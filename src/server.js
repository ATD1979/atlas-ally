require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const db = require('./db');
const { dispatchAlerts } = require('./alerts');
const { refreshAllNews, refreshNewsForCountry } = require('./news');
const { COUNTRIES, ADVISORY_LEVELS } = require('./countries');
const { calculateSafetyScore, detectCountry, getNearbyPOI } = require('./safety');
const { CHECKLISTS } = require('./checklists');
const { getWeatherForCountry, checkAllWeather } = require('./weather');
const { createCheckoutSession, handleWebhook } = require('./stripe');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'atlas-ally-dev-secret';

app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const strictLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15 });
app.use('/api/', limiter);
app.use('/api/register', strictLimiter);
app.use('/api/submit', strictLimiter);

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const p = jwt.verify(auth.slice(7), JWT_SECRET);
    if (p.role !== 'admin') throw new Error();
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────

// Countries list (for country picker)
app.get('/api/countries', (req, res) => {
  const list = Object.entries(COUNTRIES).map(([code, c]) => {
    const override = db.getAdvisoryOverride.get(code);
    const level = override?.level || c.advisoryLevel;
    return {
      code,
      name: c.name,
      flag: c.flag,
      capital: c.capital,
      advisoryLevel: level,
      advisoryLabel: ADVISORY_LEVELS[level]?.label || 'Unknown',
      advisoryColor: ADVISORY_LEVELS[level]?.color || '#888',
      advisoryEmoji: ADVISORY_LEVELS[level]?.emoji || '⚪',
    };
  });
  res.json(list);
});

// Full country data (map, advisory, emergency, borders, health)
app.get('/api/country/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const country = COUNTRIES[code];
  if (!country) return res.status(404).json({ error: 'Country not found' });

  const override = db.getAdvisoryOverride.get(code);
  const level = override?.level || country.advisoryLevel;
  const text = override?.text || country.advisoryText;
  const events = db.getEventsByCountry.all(code);
  const news = db.getNewsByCountry.all(code);

  res.json({
    ...country,
    advisoryLevel: level,
    advisoryText: text,
    advisoryConfig: ADVISORY_LEVELS[level],
    events,
    news,
  });
});

// Events feed for a country
app.get('/api/country/:code/events', (req, res) => {
  const events = db.getEventsByCountry.all(req.params.code.toUpperCase());
  res.json(events);
});

// News feed for a country
app.get('/api/country/:code/news', async (req, res) => {
  const code = req.params.code.toUpperCase();
  const cached = db.getNewsByCountry.all(code);

  // Refresh if nothing cached
  if (!cached.length) {
    await refreshNewsForCountry(code);
    return res.json(db.getNewsByCountry.all(code));
  }
  res.json(cached);
});

// Register / update user
app.post('/api/register', (req, res) => {
  const { whatsapp, name, email, countries = [] } = req.body;
  if (!whatsapp) return res.status(400).json({ error: 'WhatsApp number required' });

  const normalized = whatsapp.replace(/\s/g, '').replace(/^00/, '+');
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    return res.status(400).json({ error: 'Use international format: +1XXXXXXXXXX' });
  }

  try {
    db.upsertUser.run({ whatsapp: normalized, name: name || null, email: email || null });
    const user = db.getUser.get(normalized);
    const daysLeft = db.getTrialDaysLeft(user);

    // Add countries
    for (const code of countries.slice(0, 10)) {
      db.addCountry.run({ user_id: user.id, country_code: code.toUpperCase() });
    }

    res.json({
      success: true,
      user_id: user.id,
      plan: user.plan,
      trial_days_left: daysLeft,
      message: `Welcome to Atlas Ally! ${daysLeft} days free trial remaining.`
    });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get user info + their countries
app.post('/api/user', (req, res) => {
  const { whatsapp } = req.body;
  if (!whatsapp) return res.status(400).json({ error: 'WhatsApp required' });
  const user = db.getUser.get(whatsapp.replace(/\s/g,''));
  if (!user) return res.status(404).json({ error: 'User not found' });

  const countries = db.getUserCountries.all(user.id);
  const daysLeft = db.getTrialDaysLeft(user);

  res.json({
    ...user,
    trial_days_left: daysLeft,
    trial_active: db.isTrialActive(user),
    countries: countries.map(c => c.country_code),
  });
});

// Add country to user subscription
app.post('/api/user/add-country', (req, res) => {
  const { whatsapp, country_code } = req.body;
  if (!whatsapp || !country_code) return res.status(400).json({ error: 'Missing fields' });

  const user = db.getUser.get(whatsapp.replace(/\s/g,''));
  if (!user) return res.status(404).json({ error: 'User not found. Register first.' });
  if (!COUNTRIES[country_code.toUpperCase()]) return res.status(400).json({ error: 'Unknown country' });

  const count = db.countUserCountries.get(user.id).count;
  const isPremium = user.plan === 'premium';
  const isTrialAlive = db.isTrialActive(user);

  // Trial: up to 3 countries. Premium: based on what they paid for (we'll store max in future)
  const maxFree = 3;
  if (!isPremium && count >= maxFree && !isTrialAlive) {
    return res.status(402).json({ error: 'Upgrade to premium to add more countries', upgrade: true });
  }

  db.addCountry.run({ user_id: user.id, country_code: country_code.toUpperCase() });
  res.json({ success: true });
});

// Submit incident report
app.post('/api/submit', async (req, res) => {
  const { country_code, type, title, description, location, lat, lng, severity, source_url, submitted_by } = req.body;
  if (!country_code || !type || !title) return res.status(400).json({ error: 'country_code, type, and title required' });
  if (!COUNTRIES[country_code.toUpperCase()]) return res.status(400).json({ error: 'Unknown country' });

  const validTypes = ['siren','drone','missile','troop','strike','gunfire','checkpoint','chemical','weather','health','news','clear'];
  if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });

  const result = db.addEvent.run({
    country_code: country_code.toUpperCase(),
    type, title: title.slice(0,200),
    description: (description||'').slice(0,1000),
    location: location||null, lat: lat||null, lng: lng||null,
    severity: severity||'warn', source: null,
    source_url: source_url||null, submitted_by: submitted_by||'community'
  });

  const id = result.lastInsertRowid;
  const event = db.db.prepare('SELECT * FROM events WHERE id = ?').get(id);

  dispatchAlerts(event)
    .then(r => { db.markNotified.run(id); console.log('Dispatched:', r); })
    .catch(e => console.error(e));

  res.json({ success: true, id });
});

// Unsubscribe
app.get('/unsubscribe', (req, res) => {
  const { wa } = req.query;
  if (wa) db.db.prepare('UPDATE users SET active=0 WHERE whatsapp=?').run(decodeURIComponent(wa));
  res.send(`<!DOCTYPE html><html><body style="background:#f8f9fa;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;"><div style="font-size:48px;margin-bottom:16px;">👋</div><h2 style="margin-bottom:8px;color:#1a1a1a;">Unsubscribed</h2><p style="color:#666;">You've been removed from Atlas Ally alerts.</p></div></body></html>`);
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPw = process.env.ADMIN_PASSWORD || 'admin123';
  if (password !== adminPw && !(adminPw.startsWith('$2') && bcrypt.compareSync(password, adminPw))) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  res.json(db.getStats());
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = db.getAllUsers.all();
  res.json(users.map(u => ({
    ...u,
    trial_days_left: db.getTrialDaysLeft(u),
    countries: db.getUserCountries.all(u.id).map(c => c.country_code),
  })));
});

app.get('/api/admin/events', requireAdmin, (req, res) => {
  res.json(db.getRecentEvents.all());
});

app.post('/api/admin/event', requireAdmin, async (req, res) => {
  const { country_code, type, title, description, location, lat, lng, severity, source, source_url } = req.body;
  if (!country_code || !type || !title) return res.status(400).json({ error: 'country_code, type, title required' });

  const result = db.addEvent.run({
    country_code: country_code.toUpperCase(), type, title,
    description: description||null, location: location||null,
    lat: lat||null, lng: lng||null, severity: severity||'warn',
    source: source||'Admin', source_url: source_url||null, submitted_by: 'admin'
  });

  const id = result.lastInsertRowid;
  const event = db.db.prepare('SELECT * FROM events WHERE id = ?').get(id);

  dispatchAlerts(event)
    .then(r => { db.markNotified.run(id); })
    .catch(e => console.error(e));

  res.json({ success: true, id });
});

app.post('/api/admin/advisory', requireAdmin, (req, res) => {
  const { country_code, level, text } = req.body;
  db.setAdvisoryOverride.run({ country_code: country_code.toUpperCase(), level, text });
  res.json({ success: true });
});

app.post('/api/admin/refresh-news', requireAdmin, async (req, res) => {
  refreshAllNews().catch(console.error);
  res.json({ success: true, message: 'News refresh started' });
});

// ─── GEOFENCE & SAFETY ROUTES ────────────────────────────────────────────────

// Real-time safety score
app.post('/api/safety-score', (req, res) => {
  const { lat, lng, country_code } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  const code = country_code || detectCountry(lat, lng);
  if (!code) return res.json({ score: 50, label: 'Unknown area', color: '#888', emoji: '⚪', factors: [] });
  const result = calculateSafetyScore(lat, lng, code);
  const poi = getNearbyPOI(lat, lng, code);
  res.json({ ...result, country_code: code, poi });
});

// Detect country from GPS
app.post('/api/detect-country', (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  const code = detectCountry(lat, lng);
  const country = code ? COUNTRIES[code] : null;
  res.json({ country_code: code, country: country ? { name: country.name, flag: country.flag, advisoryLevel: country.advisoryLevel } : null });
});

// Emergency contacts — add
app.post('/api/contacts', (req, res) => {
  const { whatsapp, name, contact_whatsapp, relation } = req.body;
  if (!whatsapp || !name || !contact_whatsapp) return res.status(400).json({ error: 'Missing required fields' });
  const user = db.getUser.get(whatsapp.replace(/\s/g, ''));
  if (!user) return res.status(404).json({ error: 'User not found — register first.' });
  db.addEmergencyContact.run({ user_id: user.id, name, whatsapp: contact_whatsapp, relation: relation || null });
  res.json({ success: true });
});

// Emergency contacts — get
app.get('/api/contacts/:whatsapp', (req, res) => {
  const user = db.getUser.get(decodeURIComponent(req.params.whatsapp).replace(/\s/g, ''));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(db.getEmergencyContacts.all(user.id));
});

// Emergency contacts — remove
app.delete('/api/contacts/:contact_id', (req, res) => {
  const { whatsapp } = req.body;
  const user = db.getUser.get((whatsapp || '').replace(/\s/g, ''));
  if (!user) return res.status(404).json({ error: 'User not found' });
  db.removeEmergencyContact.run(req.params.contact_id, user.id);
  res.json({ success: true });
});

// "I'm Safe" check-in
app.post('/api/checkin', async (req, res) => {
  const { whatsapp, lat, lng, country_code, message } = req.body;
  if (!whatsapp) return res.status(400).json({ error: 'whatsapp required' });
  const user = db.getUser.get(whatsapp.replace(/\s/g, ''));
  if (!user) return res.status(404).json({ error: 'User not found' });

  const code = country_code || detectCountry(lat, lng) || 'Unknown';
  const scoreData = lat && lng ? calculateSafetyScore(lat, lng, code) : { score: null };
  const contacts = db.getEmergencyContacts.all(user.id);
  const country = COUNTRIES[code];

  db.logCheckin.run({
    user_id: user.id, lat: lat || null, lng: lng || null,
    country_code: code, safety_score: scoreData.score || null,
    message: message || null, type: 'manual',
  });

  const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: country?.timezone || 'UTC' });
  const msg = [
    `✅ *SAFE CHECK-IN — ATLAS ALLY*`,
    ``,
    `${user.name || 'Your contact'} has checked in as safe.`,
    ``,
    `${country ? country.flag + ' ' + country.name : code}`,
    lat ? `📍 ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E` : '',
    scoreData.score != null ? `🛡 Safety Score: ${scoreData.score}/100 — ${scoreData.label || ''}` : '',
    message ? `` : '',
    message ? `💬 "${message}"` : '',
    ``,
    `_Atlas Ally · ${ts}${country ? ' ' + country.name + ' time' : ''}_`,
  ].filter(l => l !== null).join('\n');

  const { sendCheckinAlert } = require('./alerts');
  let sent = 0;
  for (const contact of contacts) {
    const ok = await sendCheckinAlert(contact.whatsapp, msg);
    if (ok) sent++;
  }

  res.json({ success: true, contacts_notified: sent, safety_score: scoreData.score });
});

// Zone entry/exit alert
app.post('/api/zone-alert', async (req, res) => {
  const { whatsapp, zone_name, country_code, lat, lng, alert_type } = req.body;
  if (!whatsapp) return res.status(400).json({ error: 'whatsapp required' });
  const user = db.getUser.get(whatsapp.replace(/\s/g, ''));
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.logZoneAlert.run({
    user_id: user.id, zone_name: zone_name || 'Unknown Zone',
    country_code: country_code || '?', lat: lat || null, lng: lng || null,
    event_type: 'zone', alert_type: alert_type || 'entry',
  });

  const contacts = db.getEmergencyContacts.all(user.id);
  const country = COUNTRIES[country_code];
  const scoreData = lat && lng && country_code ? calculateSafetyScore(lat, lng, country_code) : {};
  const isEntry = alert_type !== 'exit';
  const emoji = isEntry ? '⚠️' : '✅';
  const verb = isEntry ? 'has entered' : 'has left';

  const msg = [
    `${emoji} *ZONE ALERT — ATLAS ALLY*`,
    ``,
    `${user.name || 'Your contact'} ${verb} ${zone_name || 'a monitored area'}.`,
    ``,
    country ? `${country.flag} ${country.name}` : country_code,
    lat ? `📍 ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E` : '',
    scoreData.score != null ? `🛡 Area Safety Score: ${scoreData.score}/100 — ${scoreData.label || ''}` : '',
    ``,
    `_Atlas Ally · ${new Date().toLocaleTimeString('en-US', { timeZone: country?.timezone || 'UTC' })}_`,
  ].filter(l => l !== null).join('\n');

  const { sendCheckinAlert } = require('./alerts');
  let sent = 0;
  for (const c of contacts) {
    const ok = await sendCheckinAlert(c.whatsapp, msg);
    if (ok) sent++;
  }

  res.json({ success: true, contacts_notified: sent });
});

// Offline country brief download
app.get('/api/offline/:code', async (req, res) => {
  const code = req.params.code.toUpperCase();
  const country = COUNTRIES[code];
  if (!country) return res.status(404).json({ error: 'Unknown country' });

  const events = db.getEventsByCountry.all(code);
  const news = db.getNewsByCountry.all(code);
  const override = db.getAdvisoryOverride.get(code);

  res.json({
    code, ...country,
    advisoryLevel: override?.level || country.advisoryLevel,
    advisoryText: override?.text || country.advisoryText,
    events, news,
    cachedAt: new Date().toISOString(),
  });
});

// Weather for a country
app.get('/api/country/:code/weather', async (req, res) => {
  const code = req.params.code.toUpperCase();
  try {
    const weather = await getWeatherForCountry(code);
    res.json(weather || { alerts: [] });
  } catch(e) {
    res.json({ alerts: [] });
  }
});

// Stripe checkout
app.post('/api/checkout', async (req, res) => {
  const { email, whatsapp, plan, countries } = req.body;
  if (!whatsapp && !email) return res.status(400).json({ error: 'whatsapp or email required' });
  try {
    const session = await createCheckoutSession({ email, whatsapp, plan: plan||'traveler', countries: countries||['JO'],
      successUrl: process.env.BASE_URL + '/?checkout=success',
      cancelUrl: process.env.BASE_URL + '/landing',
    });
    res.json({ url: session.url });
  } catch(e) {
    // Stripe not configured — register as trial
    if (whatsapp) {
      const normalized = whatsapp.replace(/\s/g,'').replace(/^00/,'+');
      db.upsertUser.run({ whatsapp: normalized, name: null, email: email||null });
      for (const code of (countries||['JO'])) db.addCountry.run({ user_id: db.getUser.get(normalized).id, country_code: code.toUpperCase() });
    }
    res.json({ url: null, trial: true, message: 'Free trial activated' });
  }
});

// Stripe webhook (must use raw body)
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const result = await handleWebhook(req.body, sig);
  if (!result.handled) return res.status(400).json({ error: result.error });
  res.json({ received: true });
});

// Checklists — list all
app.get('/api/checklists', (req, res) => {
  res.json(Object.values(CHECKLISTS).map(c => ({
    id: c.id, name: c.name, icon: c.icon, desc: c.desc, color: c.color,
    totalItems: c.categories.reduce((n, cat) => n + cat.items.length, 0),
  })));
});

// Checklists — get one
app.get('/api/checklists/:id', (req, res) => {
  const cl = CHECKLISTS[req.params.id];
  if (!cl) return res.status(404).json({ error: 'Not found' });
  res.json(cl);
});

// Nearest POI
app.post('/api/nearest', (req, res) => {
  const { lat, lng, country_code } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  const code = country_code || detectCountry(lat, lng);
  const poi = getNearbyPOI(lat, lng, code);
  res.json({ poi, country_code: code });
});


// ─── Pages ────────────────────────────────────────────────────────────────────
app.get('/admin*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin.html')));
app.get('/landing', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'landing.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌍 Atlas Ally running on port ${PORT}`);
  console.log(`   App:     http://localhost:${PORT}`);
  console.log(`   Admin:   http://localhost:${PORT}/admin\n`);

  // Refresh news on startup, then every 2 hours
  setTimeout(() => refreshAllNews().catch(console.error), 5000);
  setInterval(() => refreshAllNews().catch(console.error), 2 * 60 * 60 * 1000);

  // Check weather alerts on startup, then every 6 hours
  setTimeout(() => checkAllWeather().catch(console.error), 15000);
  setInterval(() => checkAllWeather().catch(console.error), 6 * 60 * 60 * 1000);
});
