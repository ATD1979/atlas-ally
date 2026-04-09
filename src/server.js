// Atlas Ally — Server entry point
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const db = require('./db');
const { COUNTRIES }    = require('./countries');
const { CHECKLISTS }   = require('./checklists');
const { refreshAllNews }   = require('./news');
const { ingestSecurityEvents } = require('./services/events-ingest');
const { checkAllWeather }  = require('./weather');
const { requireAuth, requireAdmin, requireDistributor, softAuth } = require('./auth');
const { seedCrimeData, seedAdminUsers, ensureRuntimeTables } = require('./services/seed');
const {
  apiLimiter, authLimiter, apiSlowDown, apiFingerprint,
  securityHeaders, attachErrorLogger,
} = require('./middleware');

// Route modules
const authRoutes     = require('./routes/auth');
const mapRoutes      = require('./routes/map');
const userRoutes     = require('./routes/user');
const dataRoutes     = require('./routes/data');
const adminRoutes    = require('./routes/admin');
const paymentRoutes  = require('./routes/payments');

// ── Startup ───────────────────────────────────────────────────────────────────
ensureRuntimeTables();
seedCrimeData();
seedAdminUsers();

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(securityHeaders);
app.use(attachErrorLogger);
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API middleware ────────────────────────────────────────────────────────────
app.use('/api/', apiSlowDown);
app.use('/api/', apiFingerprint);
app.use('/api/', apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────

// Auth — /send-otp and /verify-otp are rate-limited; /me and /profile require auth
app.use('/api/auth', authLimiter, authRoutes.router);

// Map / countries / events / safety / detect-country
app.use('/api', softAuth, mapRoutes);

// User: country subscriptions, contacts, account deletion
app.use('/api/user', requireAuth, userRoutes);

// Check-in and zone-alert (softAuth — no login required)
app.post('/api/checkin',    softAuth, require('./routes/user').handleCheckin);
app.post('/api/zone-alert', softAuth, require('./routes/user').handleZoneAlert);

// Crime stats, route planning, news
app.use('/api', softAuth, dataRoutes);

// Stripe checkout & webhook
app.use('/api', softAuth, paymentRoutes);

// Admin routes (login/verify are public; individual routes enforce their own auth)
app.use('/api/admin',       adminRoutes);
app.use('/api/distributor', requireDistributor, adminRoutes);

// ── Misc routes ───────────────────────────────────────────────────────────────

// Checklists
app.get('/api/checklists', softAuth, (req, res) => res.json(CHECKLISTS));

// Offline country bundle
app.get('/api/offline/:code', softAuth, (req, res) => {
  const code = req.params.code.toUpperCase();
  const c    = COUNTRIES[code];
  if (!c) return res.status(404).json({ error: 'Country not found' });
  const { ADVISORY_LEVELS } = require('./countries');
  const cfg = ADVISORY_LEVELS[c.advisoryLevel || 1] || ADVISORY_LEVELS[1];
  res.json({
    ...c, code, advisoryConfig: cfg,
    events: db.getEventsByCountry.all(code),
    news:   db.getNewsByCountry.all(code),
  });
});

// Feedback
app.post('/api/feedback', softAuth, (req, res) => {
  const { rating, likes, dislikes, suggestions, bugs, would_pay, price_point, token } = req.body;
  try {
    db.db.prepare(`
      INSERT INTO feedback (user_id, whatsapp, token, rating, likes, dislikes, suggestions, bugs, would_pay, price_point)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user?.id || null, req.user?.whatsapp || null, token || null,
      rating || null, likes || null, dislikes || null,
      suggestions || null, bugs || null, would_pay ? 1 : 0, price_point || null
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// Invite tokens (public validate + use)
app.get('/api/invite/:token', (req, res) => {
  const t = db.db.prepare(`SELECT * FROM invite_tokens WHERE token=? AND active=1`).get(req.params.token.toUpperCase());
  if (!t)                  return res.status(404).json({ error: 'Invalid or expired invite' });
  if (t.uses >= t.max_uses) return res.status(400).json({ error: 'This invite has been used' });
  res.json({ ok: true, token: t.token });
});

app.post('/api/invite/:token/use', softAuth, (req, res) => {
  const token = req.params.token.toUpperCase();
  const t     = db.db.prepare(`SELECT * FROM invite_tokens WHERE token=? AND active=1`).get(token);
  if (!t || t.uses >= t.max_uses) return res.status(400).json({ error: 'Invalid invite' });
  db.db.prepare(`UPDATE invite_tokens SET uses=uses+1, used_by=?, used_at=datetime('now') WHERE token=?`)
    .run(req.user?.whatsapp || 'anonymous', token);
  res.json({ ok: true });
});

// Legacy register (backward compat)
app.post('/api/register', softAuth, (req, res) => {
  const { whatsapp, name, countries } = req.body;
  if (!whatsapp) return res.status(400).json({ error: 'whatsapp required' });
  const clean = whatsapp.replace(/\s/g, '').replace(/^00/, '+');
  try {
    db.upsertUser({ whatsapp: clean, name: name || null, email: null });
    const user = db.getUser(clean);
    countries?.forEach(code => {
      try { db.addCountry.run({ user_id: user.id, country_code: code.toUpperCase() }); } catch {}
    });
    const { createToken } = require('./auth');
    res.json({ ok: true, token: createToken(user) });
  } catch {
    res.status(500).json({ error: 'Registration failed' });
  }
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

// Legal pages
app.get('/admin',   (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'privacy.html')));
app.get('/terms',   (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'terms.html')));

// ── Scheduled jobs ────────────────────────────────────────────────────────────
refreshAllNews().catch(e => console.error('Initial news refresh failed:', e.message));
ingestSecurityEvents().catch(e => console.error('Initial event ingest failed:', e.message));
checkAllWeather(db).catch(() => {});

setInterval(() => refreshAllNews().catch(e => console.error('News refresh:', e.message)), 30 * 60 * 1000); // every 30 min
setInterval(() => ingestSecurityEvents().catch(e => console.error('Event ingest:', e.message)), 15 * 60 * 1000); // every 15 min
setInterval(() => checkAllWeather(db).catch(() => {}),    6 * 60 * 60 * 1000);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌍 Atlas Ally running on port ${PORT}`));
