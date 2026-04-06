require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const crypto = require('crypto');

const db = require('./db');
const { COUNTRIES, ADVISORY_LEVELS } = require('./countries');
const { dispatchAlerts, sendCheckinAlert } = require('./alerts');
const { refreshAllNews, refreshNewsForCountry } = require('./news');
const { checkAllWeather: checkWeatherAlerts } = require('./weather');
const { CHECKLISTS } = require('./checklists');
const { CRIME_DATA } = require('./crime-data');
const { generateOTP, createToken, requireAuth, requireAdmin, requireDistributor, softAuth } = require('./auth');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/', limiter);

// ── Seed crime data on startup ─────────────────────────────────────────────────
function seedCrimeData() {
  const now = new Date();
  const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6);
  CRIME_DATA.forEach(row => {
    db.upsertCrimeStat.run({
      ...row,
      category: 'overall',
      period_start: sixMonthsAgo.toISOString().split('T')[0],
      period_end: now.toISOString().split('T')[0],
      source: 'Numbeo',
    });
  });
  console.log(`✅ Crime data seeded: ${CRIME_DATA.length} cities`);
}
seedCrimeData();

// ── Error logging helper ───────────────────────────────────────────────────────
function logErr(type, err, req) {
  try {
    db.logError.run({
      type, message: err.message || String(err),
      stack: err.stack || null,
      user_id: req?.user?.id || null,
      endpoint: req?.path || null,
    });
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUP A — AUTH & USER SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

// Send OTP via WhatsApp
app.post('/api/auth/send-otp', authLimiter, async (req, res) => {
  const { whatsapp, purpose = 'login' } = req.body;
  if (!whatsapp) return res.status(400).json({ error: 'WhatsApp number required' });

  const clean = whatsapp.replace(/\s/g, '').replace(/^00/, '+');
  const code = generateOTP();

  try {
    db.createOTP.run({ whatsapp: clean, code, purpose });
    db.cleanOTPs.run();

    await sendCheckinAlert(clean,
      `🌍 *Atlas Ally*\n\nYour verification code is:\n\n*${code}*\n\n_Expires in 10 minutes. Do not share this code._`
    );
    res.json({ ok: true, message: 'OTP sent to your WhatsApp' });
  } catch (e) {
    logErr('otp_send', e, req);
    res.status(500).json({ error: 'Failed to send OTP. Check your WhatsApp number.' });
  }
});

// Verify OTP — returns JWT
app.post('/api/auth/verify-otp', authLimiter, (req, res) => {
  const { whatsapp, code } = req.body;
  if (!whatsapp || !code) return res.status(400).json({ error: 'WhatsApp and code required' });

  const clean = whatsapp.replace(/\s/g, '').replace(/^00/, '+');
  const otp = db.getOTP.get(clean);

  if (!otp || otp.code !== code.toString()) {
    return res.status(401).json({ error: 'Invalid or expired code' });
  }
  db.markOTPUsed.run(otp.id);

  let user = db.getUser(clean);
  if (!user) return res.json({ ok: true, needs_signup: true, whatsapp: clean });

  db.updateUserVerified(clean);
  db.updateLastLogin(user.id);
  user = db.getUser(clean);

  const token = createToken(user);
  res.json({ ok: true, token, user: sanitizeUser(user) });
});

// Full signup
app.post('/api/auth/signup', authLimiter, (req, res) => {
  const { whatsapp, name, email, dob, state_origin, country_origin, trial_code } = req.body;

  if (!whatsapp || !name || !dob) {
    return res.status(400).json({ error: 'Name, WhatsApp, and date of birth are required' });
  }
  if (!db.isAdult(dob)) {
    return res.status(400).json({ error: 'You must be 18 or older to use Atlas Ally' });
  }

  const clean = whatsapp.replace(/\s/g, '').replace(/^00/, '+');

  // Check if user already exists
  const existing = db.getUser(clean);
  if (existing) return res.status(409).json({ error: 'An account with this number already exists. Please log in.' });

  // Validate trial code if provided
  let distributor_id = null;
  let trialDays = 7;
  if (trial_code) {
    const tc = db.getTrialCode.get(trial_code);
    if (!tc) return res.status(400).json({ error: 'Invalid or expired invite code' });
    if (tc.uses >= tc.max_uses) return res.status(400).json({ error: 'This invite code has reached its limit' });
    distributor_id = tc.created_by;
    trialDays = tc.trial_days || 7;
    db.useTrialCode.run(trial_code);
  }

  try {
    db.createUser.run({ whatsapp: clean, name, email: email||null, dob, state_origin: state_origin||null, country_origin: country_origin||null, trial_code: trial_code||null, distributor_id });

    if (trialDays !== 7) {
      db.db.prepare(`UPDATE users SET trial_end = datetime('now', '+${trialDays} days') WHERE whatsapp = ?`).run(clean);
    }

    const user = db.getUser(clean);
    const token = createToken(user);
    res.json({ ok: true, token, user: sanitizeUser(user) });
  } catch (e) {
    logErr('signup', e, req);
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
});

// Get current user profile
app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const countries = db.getUserCountries.all(user.id).map(c => c.country_code);
  const contacts = db.getEmergencyContacts.all(user.id);
  res.json({ user: sanitizeUser(user), countries, contacts, trial_days_left: db.getTrialDaysLeft(user) });
});

// Update profile
app.put('/api/auth/profile', requireAuth, (req, res) => {
  const { name, email, state_origin, country_origin } = req.body;
  db.db.prepare(`UPDATE users SET name=COALESCE(?,name), email=COALESCE(?,email), state_origin=COALESCE(?,state_origin), country_origin=COALESCE(?,country_origin) WHERE id=?`)
    .run(name||null, email||null, state_origin||null, country_origin||null, req.user.id);
  res.json({ ok: true });
});

function sanitizeUser(u) {
  const { ...safe } = u;
  delete safe.stripe_id;
  return safe;
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUP B — MAP & INCIDENTS
// ─────────────────────────────────────────────────────────────────────────────

// Countries list
app.get('/api/countries', (req, res) => {
  const { ADVISORY_LEVELS } = require('./countries');
  const overrides = {};
  try {
    db.db.prepare(`SELECT * FROM advisory_overrides`).all().forEach(o => { overrides[o.country_code] = o; });
  } catch {}
  const list = Object.entries(COUNTRIES).map(([code, c]) => {
    const adv = overrides[code] || {};
    const level = adv.level || c.advisoryLevel || 1;
    const cfg = ADVISORY_LEVELS[level] || ADVISORY_LEVELS[1];
    return {
      code, name: c.name, flag: c.flag, capital: c.capital,
      currency: c.currency, language: c.language, timezone: c.timezone,
      center: c.center, zoom: c.zoom,
      advisoryLevel: level, advisoryText: adv.text || c.advisoryText,
      advisoryLabel: cfg.label, advisoryEmoji: cfg.emoji, advisoryColor: cfg.color,
      advisoryConfig: cfg,
    };
  });
  res.json(list);
});

// Country detail
app.get('/api/country/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const c = COUNTRIES[code];
  if (!c) return res.status(404).json({ error: 'Country not found' });
  const { ADVISORY_LEVELS } = require('./countries');
  const override = db.getAdvisoryOverride.get(code) || {};
  const level = override.level || c.advisoryLevel || 1;
  const cfg = ADVISORY_LEVELS[level] || ADVISORY_LEVELS[1];
  const events = db.getEventsByCountry.all(code);
  const news = db.getNewsByCountry.all(code);
  const crime = db.getCrimeStatsByCountry.all(code);
  res.json({ ...c, code, advisoryLevel: level, advisoryText: override.text || c.advisoryText, advisoryConfig: cfg, events, news, crime });
});

// Country weather
app.get('/api/country/:code/weather', async (req, res) => {
  const code = req.params.code.toUpperCase();
  const c = COUNTRIES[code];
  if (!c?.center) return res.status(404).json({ error: 'No location data' });
  try {
    const fetch = require('node-fetch');
    const [lat, lng] = c.center;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,weathercode,windspeed_10m&forecast_days=1`;
    const r = await fetch(url, { timeout: 8000 });
    const d = await r.json();
    const cw = d.current_weather || {};
    res.json({ current: { temp: Math.round(cw.temperature), wind: Math.round(cw.windspeed||0), code: cw.weathercode }, alerts: [] });
  } catch (e) {
    res.status(500).json({ error: 'Weather unavailable' });
  }
});

// Events feed (72h)
app.get('/api/events', (req, res) => {
  const { country_code } = req.query;
  let events;
  if (country_code) {
    events = db.db.prepare(`SELECT * FROM events WHERE country_code=? AND status='approved' AND is_test=0 AND created_at > datetime('now', '-72 hours') ORDER BY created_at DESC`).all(country_code.toUpperCase());
  } else {
    events = db.getEvents72h.all();
  }
  res.json(events);
});

// Post incident (any user, long-press on map)
app.post('/api/events', softAuth, (req, res) => {
  const { country_code, type, title, description, location, lat, lng, severity, source_url } = req.body;
  if (!country_code || !type || !title) return res.status(400).json({ error: 'country_code, type, title required' });

  const result = db.addEvent.run({
    country_code: country_code.toUpperCase(), type, title, description: description||null,
    location: location||null, lat: lat||null, lng: lng||null,
    severity: severity||'warn', source: 'user', source_url: source_url||null,
    submitted_by: req.user?.whatsapp || 'anonymous',
    submitted_user_id: req.user?.id || null,
    is_test: 0,
  });
  const event = db.db.prepare(`SELECT * FROM events WHERE id = ?`).get(result.lastInsertRowid);
  dispatchAlerts(event).catch(() => {});
  res.json({ ok: true, event });
});

// Remove event (admin only)
app.delete('/api/events/:id', requireAdmin, (req, res) => {
  db.removeEvent.run(req.params.id);
  res.json({ ok: true });
});

// Mark event as test (admin only)
app.patch('/api/events/:id/test', requireAdmin, (req, res) => {
  db.markTestEvent.run(req.params.id);
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP C — COUNTRY SUBSCRIPTIONS
// ─────────────────────────────────────────────────────────────────────────────

// Get user's countries
app.get('/api/user/countries', requireAuth, (req, res) => {
  const rows = db.getUserCountries.all(req.user.id);
  res.json(rows.map(r => r.country_code));
});

// Add country
app.post('/api/user/countries', requireAuth, (req, res) => {
  const { country_code } = req.body;
  if (!country_code) return res.status(400).json({ error: 'country_code required' });

  const user = db.getUserById(req.user.id);
  const count = db.countUserCountries.get(req.user.id).count;
  const maxFree = parseInt(db.getSetting('max_free_countries') || '3');

  if (count >= maxFree && user.plan === 'trial') {
    return res.status(402).json({
      error: 'Free trial allows up to 3 countries. Upgrade to Traveler ($3/month) to add more.',
      upgrade_required: true
    });
  }

  if (count >= (user.country_slots || 3) && user.plan !== 'premium') {
    return res.status(402).json({
      error: 'Upgrade to add more countries.',
      upgrade_required: true
    });
  }

  db.addCountry.run({ user_id: req.user.id, country_code: country_code.toUpperCase() });
  res.json({ ok: true });
});

// Remove country
app.delete('/api/user/countries/:code', requireAuth, (req, res) => {
  db.removeCountry.run(req.user.id, req.params.code.toUpperCase());
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP D — CRIME STATISTICS
// ─────────────────────────────────────────────────────────────────────────────

// Get crime stats for a country
app.get('/api/crime/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const global_stats = db.getCrimeStatsByCountry.all(code);
  const community = db.getCommunityCrime.all(code);
  res.json({ global_stats, community });
});

// Get crime stats near a location (for geofence)
app.get('/api/crime/near', (req, res) => {
  const { lat, lng, radius = 100 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  const latF = parseFloat(lat), lngF = parseFloat(lng);
  // Simple bounding box filter (1 degree ≈ 111km)
  const delta = parseFloat(radius) / 111;

  const stats = db.db.prepare(`
    SELECT *, ((lat - ?)*(lat - ?) + (lng - ?)*(lng - ?)) as dist_sq
    FROM crime_stats
    WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
    ORDER BY dist_sq ASC LIMIT 10
  `).all(latF, latF, lngF, lngF, latF-delta, latF+delta, lngF-delta, lngF+delta);

  const community = db.db.prepare(`
    SELECT *, ((lat - ?)*(lat - ?) + (lng - ?)*(lng - ?)) as dist_sq
    FROM community_crime
    WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
    AND created_at > datetime('now', '-6 months')
    ORDER BY dist_sq ASC LIMIT 20
  `).all(latF, latF, lngF, lngF, latF-delta, latF+delta, lngF-delta, lngF+delta);

  res.json({ global_stats: stats, community });
});

// Report community crime
app.post('/api/crime/community', softAuth, (req, res) => {
  const { country_code, lat, lng, type, description, severity } = req.body;
  if (!country_code || !lat || !lng || !type) return res.status(400).json({ error: 'Missing required fields' });
  db.addCommunityCrime.run({
    country_code: country_code.toUpperCase(), lat, lng, type,
    description: description||null, reported_by: req.user?.id||null, severity: severity||'warn'
  });
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP E — ROUTE & NEWS
// ─────────────────────────────────────────────────────────────────────────────

// Route autocomplete — Nominatim
app.get('/api/route/autocomplete', async (req, res) => {
  const { q, lang = 'en', lat, lng } = req.query;
  if (!q || q.length < 2) return res.json([]);
  try {
    const fetch = require('node-fetch');
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&accept-language=${lang}`;
    if (lat && lng) url += `&viewbox=${parseFloat(lng)-2},${parseFloat(lat)+2},${parseFloat(lng)+2},${parseFloat(lat)-2}&bounded=0`;
    const r = await fetch(url, { headers: { 'User-Agent': 'AtlasAlly/1.0' }, timeout: 5000 });
    const data = await r.json();
    res.json(data.map(p => ({
      name: p.display_name, lat: parseFloat(p.lat), lng: parseFloat(p.lon),
      type: p.type, category: p.class,
    })));
  } catch (e) {
    res.json([]);
  }
});

// Safe route
app.post('/api/route', async (req, res) => {
  const { from_lat, from_lng, to_lat, to_lng } = req.body;
  if (!from_lat || !from_lng || !to_lat || !to_lng) return res.status(400).json({ error: 'Coordinates required' });
  try {
    const fetch = require('node-fetch');
    const url = `https://router.project-osrm.org/route/v1/driving/${from_lng},${from_lat};${to_lng},${to_lat}?overview=full&geometries=geojson&steps=true`;
    const r = await fetch(url, { timeout: 8000 });
    const d = await r.json();
    if (!d.routes?.[0]) return res.json({ error: 'No route found' });
    const route = d.routes[0];
    const events = db.getEvents72h.all();
    const warnings = events.filter(e => {
      if (!e.lat || !e.lng) return false;
      const coords = route.geometry?.coordinates || [];
      return coords.some(([lng, lat]) => {
        const dist = Math.sqrt(Math.pow(lat - e.lat, 2) + Math.pow(lng - e.lng, 2));
        return dist < 0.5;
      });
    });
    res.json({ route, warnings, distance_km: Math.round(route.distance / 1000), duration_min: Math.round(route.duration / 60) });
  } catch (e) {
    res.status(500).json({ error: 'Route service unavailable' });
  }
});

// News by country or location
app.get('/api/news', (req, res) => {
  const { country_code, lat, lng } = req.query;
  if (!country_code) return res.status(400).json({ error: 'country_code required' });
  const news = db.getNewsByCountry.all(country_code.toUpperCase());
  res.json(news);
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP F — ADMIN & PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

// Admin: get all users
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = db.getAllUsers.all().map(sanitizeUser);
  res.json(users);
});

// Admin: update user role
app.patch('/api/admin/users/:id/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['admin','distributor','user'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  db.updateRole(role, req.params.id);
  res.json({ ok: true });
});

// Admin: deactivate user
app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  db.deactivateUser(req.params.id);
  res.json({ ok: true });
});

// Admin: get error logs
app.get('/api/admin/errors', requireAdmin, (req, res) => {
  const errors = db.getRecentErrors.all();
  res.json(errors);
});

// Admin: get app stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  res.json(db.getStats());
});

// Admin: update setting
app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const { key, value } = req.body;
  db.setSetting.run(key, value);
  res.json({ ok: true });
});

// Admin: get settings
app.get('/api/admin/settings', requireAdmin, (req, res) => {
  const rows = db.db.prepare(`SELECT * FROM app_settings`).all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  res.json(settings);
});

// Admin: post event
app.post('/api/admin/events', requireAdmin, (req, res) => {
  const { country_code, type, title, description, location, lat, lng, severity, is_test } = req.body;
  if (!country_code || !type || !title) return res.status(400).json({ error: 'Missing required fields' });
  const result = db.addEvent.run({
    country_code: country_code.toUpperCase(), type, title, description: description||null,
    location: location||null, lat: lat||null, lng: lng||null,
    severity: severity||'warn', source: 'admin', source_url: null,
    submitted_by: 'admin', submitted_user_id: null,
    is_test: is_test ? 1 : 0,
  });
  const event = db.db.prepare(`SELECT * FROM events WHERE id = ?`).get(result.lastInsertRowid);
  if (!is_test) dispatchAlerts(event).catch(() => {});
  res.json({ ok: true, event });
});

// Admin: remove test events
app.delete('/api/admin/events/test', requireAdmin, (req, res) => {
  db.db.prepare(`UPDATE events SET status='removed' WHERE is_test=1`).run();
  res.json({ ok: true });
});

// Admin: get all events including test
app.get('/api/admin/events', requireAdmin, (req, res) => {
  const events = db.getAllEventsAdmin.all();
  res.json(events);
});

// Admin: refresh news
app.post('/api/admin/refresh-news', requireAdmin, async (req, res) => {
  refreshAllNews().catch(() => {});
  res.json({ ok: true, message: 'News refresh started' });
});

// Distributor: create trial code
app.post('/api/distributor/codes', requireDistributor, (req, res) => {
  const user = db.getUserById(req.user.id);
  const quota = parseInt(db.getSetting('distributor_default_quota') || '25');
  const existingCodes = db.getTrialCodesByUser.all(req.user.id);
  const totalUses = existingCodes.reduce((sum, c) => sum + c.max_uses, 0);

  // Admins have unlimited quota
  if (req.user.role !== 'admin' && totalUses >= quota) {
    return res.status(403).json({ error: `You have reached your quota of ${quota} trial users` });
  }

  const { max_uses = 10, trial_days = 7 } = req.body;
  const code = crypto.randomBytes(4).toString('hex').toUpperCase();
  const expires_at = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  db.createTrialCode.run({ code, created_by: req.user.id, max_uses, trial_days, expires_at });
  res.json({ ok: true, code });
});

// Distributor: get my codes
app.get('/api/distributor/codes', requireDistributor, (req, res) => {
  const codes = db.getTrialCodesByUser.all(req.user.id);
  res.json(codes);
});

// Distributor: deactivate code
app.delete('/api/distributor/codes/:code', requireDistributor, (req, res) => {
  db.deactivateTrialCode.run(req.params.code);
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING ROUTES (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

// Safety score
app.post('/api/safety-score', async (req, res) => {
  const { lat, lng, country_code } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  try {
    const { calculateSafetyScore } = require('./safety');
    const result = await calculateSafetyScore({ lat, lng, country_code, db });
    res.json(result);
  } catch (e) {
    res.status(500).json({ score: 50, label: 'Unknown', emoji: '🛡', factors: [] });
  }
});

// Detect country from coordinates
app.post('/api/detect-country', async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  try {
    const fetch = require('node-fetch');
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { 'User-Agent': 'AtlasAlly/1.0' }, timeout: 5000
    });
    const d = await r.json();
    const countryCode = d.address?.country_code?.toUpperCase();
    const country = countryCode ? COUNTRIES[countryCode] : null;
    res.json({ country_code: countryCode, country });
  } catch {
    res.json({ country_code: null });
  }
});

// Register subscriber (legacy, for backward compat)
app.post('/api/register', softAuth, (req, res) => {
  const { whatsapp, name, countries } = req.body;
  if (!whatsapp) return res.status(400).json({ error: 'whatsapp required' });
  const clean = whatsapp.replace(/\s/g,'').replace(/^00/,'+');
  try {
    db.upsertUser({ whatsapp: clean, name: name||null, email: null });
    const user = db.getUser(clean);
    if (countries?.length) {
      countries.forEach(code => {
        try { db.addCountry.run({ user_id: user.id, country_code: code.toUpperCase() }); } catch {}
      });
    }
    const token = createToken(user);
    res.json({ ok: true, token });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Emergency contacts
app.get('/api/user/contacts', requireAuth, (req, res) => {
  res.json(db.getEmergencyContacts.all(req.user.id));
});
app.post('/api/user/contacts', requireAuth, (req, res) => {
  const { name, whatsapp, relation } = req.body;
  if (!name || !whatsapp) return res.status(400).json({ error: 'name and whatsapp required' });
  db.addEmergencyContact.run({ user_id: req.user.id, name, whatsapp, relation: relation||null });
  res.json({ ok: true });
});
app.delete('/api/user/contacts/:id', requireAuth, (req, res) => {
  db.removeEmergencyContact.run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Check-in
app.post('/api/checkin', softAuth, async (req, res) => {
  const { whatsapp, lat, lng, country_code, message, safety_score } = req.body;
  if (!whatsapp) return res.status(400).json({ error: 'whatsapp required' });
  const user = db.getUser(whatsapp);
  if (user) {
    db.logCheckin.run({ user_id: user.id, lat: lat||null, lng: lng||null, country_code: country_code||null, safety_score: safety_score||null, message: message||null, type: 'manual' });
    const contacts = db.getEmergencyContacts.all(user.id);
    const country = country_code ? COUNTRIES[country_code] : null;
    const mapUrl = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : '';
    const msg = `✅ *${user.name || whatsapp} is safe!*\n${country ? `📍 ${country.flag} ${country.name}\n` : ''}${message ? `💬 "${message}"\n` : ''}${mapUrl ? `🗺️ ${mapUrl}` : ''}\n_Atlas Ally check-in_`;
    for (const c of contacts) await sendCheckinAlert(c.whatsapp, msg).catch(() => {});
  }
  res.json({ ok: true });
});

// Zone alert
app.post('/api/zone-alert', softAuth, async (req, res) => {
  const { whatsapp, zone_name, country_code, lat, lng, alert_type } = req.body;
  if (!whatsapp) return res.status(400).json({ error: 'whatsapp required' });
  const user = db.getUser(whatsapp);
  if (user) {
    db.logZoneAlert.run({ user_id: user.id, zone_name: zone_name||null, country_code: country_code||null, lat: lat||null, lng: lng||null, event_type: 'geofence', alert_type: alert_type||'entry' });
    const contacts = db.getEmergencyContacts.all(user.id);
    const country = country_code ? COUNTRIES[country_code] : null;
    const mapUrl = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : '';
    const msg = alert_type === 'danger'
      ? `🚨 *DANGER ALERT — ${user.name || whatsapp}*\nEntering high-risk area: ${zone_name||'Unknown'}\n${country ? `${country.flag} ${country.name}\n` : ''}${mapUrl}\n_Atlas Ally journey alert_`
      : `🛂 *${user.name || whatsapp} crossed into ${zone_name || country?.name || 'new country'}*\n${mapUrl}\n_Atlas Ally geofence alert_`;
    for (const c of contacts) await sendCheckinAlert(c.whatsapp, msg).catch(() => {});
  }
  res.json({ ok: true });
});

// Checklists
app.get('/api/checklists', (req, res) => res.json(CHECKLISTS));
app.get('/api/offline/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const c = COUNTRIES[code];
  if (!c) return res.status(404).json({ error: 'Country not found' });
  const { ADVISORY_LEVELS } = require('./countries');
  const level = c.advisoryLevel || 1;
  const cfg = ADVISORY_LEVELS[level] || ADVISORY_LEVELS[1];
  const events = db.getEventsByCountry.all(code);
  const news = db.getNewsByCountry.all(code);
  res.json({ ...c, code, advisoryConfig: cfg, events, news });
});

// Unsubscribe
app.get('/unsubscribe', (req, res) => {
  const { wa } = req.query;
  if (wa) {
    const user = db.getUser(wa);
    if (user) db.deactivateUser(user.id);
  }
  res.send('<html><body style="font-family:sans-serif;max-width:400px;margin:40px auto;text-align:center"><h2>Unsubscribed</h2><p>You have been removed from Atlas Ally alerts.</p></body></html>');
});

// Admin panel auth (legacy)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid password' });
  res.json({ ok: true, token: 'admin-' + Buffer.from(password).toString('base64') });
});
app.post('/api/admin/verify', (req, res) => {
  const { token } = req.body;
  const expected = 'admin-' + Buffer.from(process.env.ADMIN_PASSWORD || '').toString('base64');
  res.json({ ok: token === expected });
});
app.get('/api/admin/queue', (req, res) => {
  const events = db.db.prepare(`SELECT * FROM events WHERE status='pending' ORDER BY created_at DESC`).all();
  res.json(events);
});
app.get('/api/admin/subscribers', (req, res) => {
  const users = db.getAllUsers.all().map(u => ({ ...sanitizeUser(u), countries: db.getUserCountries.all(u.id).map(c => c.country_code) }));
  res.json(users);
});

// Stripe checkout
app.post('/api/checkout', softAuth, async (req, res) => {
  const { whatsapp, plan, countries } = req.body;
  const stripe = require('./stripe').getStripe();
  if (!stripe) {
    // No Stripe configured — start trial instead
    if (whatsapp) {
      const clean = whatsapp.replace(/\s/g,'').replace(/^00/,'+');
      db.upsertUser({ whatsapp: clean, name: null, email: null });
      if (countries?.length) {
        const user = db.getUser(clean);
        countries.forEach(c => { try { db.addCountry.run({ user_id: user.id, country_code: c }); } catch {} });
      }
    }
    return res.json({ ok: true, trial: true });
  }
  try {
    const priceId = plan === 'family' ? process.env.STRIPE_FAMILY_PRICE_ID : process.env.STRIPE_BASE_PRICE_ID;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.BASE_URL}/?checkout=success`,
      cancel_url: `${process.env.BASE_URL}/landing`,
      metadata: { whatsapp: whatsapp||'', plan: plan||'traveler' },
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// Stripe webhook
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const stripe = require('./stripe').getStripe();
  if (!stripe) return res.json({ ok: true });
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send('Webhook error');
  }
  if (event.type === 'checkout.session.completed') {
    const wa = event.data.object.metadata?.whatsapp;
    if (wa) {
      const user = db.getUser(wa);
      if (user) db.updatePlan({ plan: 'premium', stripe_id: event.data.object.customer, id: user.id });
    }
  }
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULED JOBS
// ─────────────────────────────────────────────────────────────────────────────
refreshAllNews().catch(() => {});
checkWeatherAlerts(db).catch(() => {});

const NEWS_INTERVAL = 2 * 60 * 60 * 1000;
const WEATHER_INTERVAL = 6 * 60 * 60 * 1000;
setInterval(() => refreshAllNews().catch(() => {}), NEWS_INTERVAL);
setInterval(() => checkWeatherAlerts(db).catch(() => {}), WEATHER_INTERVAL);

// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌍 Atlas Ally running on port ${PORT}`));
