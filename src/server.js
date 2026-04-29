// Atlas Ally — Server entry point
// v2026.04.26 — webhook before json + requireAuth on checkin/zone-alert (PR #26)
const config      = require('./config');
const express     = require('express');
const cors       = require('cors');
const path       = require('path');
const cookieParser = require('cookie-parser');

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
const { gateMiddleware, setupGateRoutes } = require('./gate');

// Route modules
const authRoutes     = require('./routes/auth');
const mapRoutes      = require('./routes/map');
const userRoutes     = require('./routes/user');
const crimeRoutes        = require('./routes/crime');
const newsRoutes         = require('./routes/news');
const eventsRoutes       = require('./routes/events');
const routePlanningRoutes = require('./routes/route-planning');
const adminRoutes    = require('./routes/admin');
const paymentRoutes  = require('./routes/payments');
const packRoutes     = require('./routes/pack');

// ── Startup ───────────────────────────────────────────────────────────────────
ensureRuntimeTables();
seedCrimeData();
seedAdminUsers();

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
app.set('trust proxy', 1);

// CORS: allowlist production + local dev. Same-origin browser requests have
// no Origin header and are allowed through. Third-party sites cannot make
// credentialed requests to the API.
const ALLOWED_ORIGINS = [
  'https://atlas-ally.com',
  'https://www.atlas-ally.com',
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                    // same-origin, mobile, curl
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(null, false);                                       // silent reject
  },
  credentials: true,
}));
app.use(cookieParser());

// Stripe webhook MUST mount before express.json() so that express.raw() sees
// the raw request body for signature verification. Routing it via paymentRoutes
// (mounted below) would fail: app.use(express.json()) would have already
// consumed the body, breaking stripe.webhooks.constructEvent. Also placed
// before gateMiddleware so Stripe is never redirected to coming-soon, and
// before /api/ rate limiters since the webhook is authenticated by signature,
// not by IP/fingerprint. (PR #26)
app.post('/api/stripe-webhook',
  express.raw({ type: 'application/json' }),
  require('./routes/payments').handleStripeWebhook);

app.use(express.json());
app.use(securityHeaders);
app.use(attachErrorLogger);

// ── Gate routes (must be before static + gate middleware) ─────────────────────
setupGateRoutes(app);

// ── Gate middleware — redirects unauthenticated browsers to coming-soon ────────
app.use(gateMiddleware);

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

// Check-in and zone-alert (requireAuth as of PR #26 — was softAuth; whatsapp
// is now derived from req.user inside the handlers, never from the body, to
// prevent arbitrary impersonation of any user's emergency contacts).
app.post('/api/checkin',    requireAuth, require('./routes/user').handleCheckin);
app.post('/api/zone-alert', requireAuth, require('./routes/user').handleZoneAlert);

// Crime stats, route planning, news
app.use('/api', softAuth, crimeRoutes);
app.use('/api', softAuth, newsRoutes);
app.use('/api', softAuth, eventsRoutes);
app.use('/api', softAuth, routePlanningRoutes);

// AI pack list
app.use('/api', softAuth, packRoutes);

// Stripe checkout (webhook is mounted earlier, before express.json())
app.use('/api', softAuth, paymentRoutes);

// Admin routes (login/verify are public; individual routes enforce their own auth)
app.use('/api/admin',       adminRoutes);
// Force news cache refresh
app.get('/api/admin/refresh-news', requireAdmin, async (req, res) => {
  db.clearOldNews.run();
  refreshAllNews().catch(console.error);
  res.json({ ok: true, message: 'News cache cleared and refresh started' });
});
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
    news:   db.getNewsByCountry(code, 'en'),
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

// Invite tokens (public validate + use) — under authLimiter since these are
// auth-adjacent (invite tokens gate registration into the product).
app.get('/api/invite/:token', authLimiter, (req, res) => {
  const t = db.db.prepare(`SELECT * FROM invite_tokens WHERE token=? AND active=1`).get(req.params.token.toUpperCase());
  if (!t)                  return res.status(404).json({ error: 'Invalid or expired invite' });
  if (t.uses >= t.max_uses) return res.status(400).json({ error: 'This invite has been used' });
  res.json({ ok: true, token: t.token });
});

app.post('/api/invite/:token/use', authLimiter, softAuth, (req, res) => {
  const token = req.params.token.toUpperCase();
  // Atomic UPDATE — validation + mutation in one SQL statement to prevent
  // TOCTOU. If two simultaneous POSTs race, the second's WHERE clause will
  // no longer match once the first commits, giving changes=0.
  const result = db.db.prepare(`
    UPDATE invite_tokens
    SET uses = uses + 1, used_by = ?, used_at = datetime('now')
    WHERE token = ? AND active = 1 AND uses < max_uses
  `).run(req.user?.whatsapp || 'anonymous', token);
  if (result.changes === 0) {
    return res.status(400).json({ error: 'Invalid or exhausted invite' });
  }
  res.json({ ok: true });
});

// Legacy register (backward compat) — also under authLimiter, see above.
app.post('/api/register', authLimiter, softAuth, (req, res) => {
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

// Static files — root serves the app (gate middleware already protects it)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.get('/landing', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'landing.html')));

// Capture launch interest emails
app.post('/api/notify-interest', (req, res) => {
  const { email } = req.body || {};
  if (email) {
    try {
      db.db.prepare(`CREATE TABLE IF NOT EXISTS launch_interest (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, created_at TEXT DEFAULT (datetime('now')))`).run();
      db.db.prepare(`INSERT OR IGNORE INTO launch_interest (email) VALUES (?)`).run(email);
    } catch {}
    console.log(`Launch interest: ${email}`);
  }
  res.json({ ok: true });
});

// Legal pages
app.get('/admin',   (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'privacy.html')));
app.get('/terms',   (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'terms.html')));

// ── Scheduled jobs ────────────────────────────────────────────────────────────
// Interval IDs captured in `intervals` so the shutdown handler can clearInterval
// on each. Without this, Node won't exit cleanly on SIGTERM because the event
// loop still has active timers.
refreshAllNews().catch(e => console.error('Initial news refresh failed:', e.message));
ingestSecurityEvents().catch(e => console.error('Initial event ingest failed:', e.message));
checkAllWeather(db).catch(() => {});

const intervals = [
  setInterval(() => refreshAllNews().catch(e => console.error('News refresh:', e.message)), 30 * 60 * 1000),       // every 30 min
  setInterval(() => ingestSecurityEvents().catch(e => console.error('Event ingest:', e.message)), 15 * 60 * 1000), // every 15 min
  setInterval(() => checkAllWeather(db).catch(() => {}), 6 * 60 * 60 * 1000),                                       // every 6 hours
];

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`🌍 Atlas Ally running on port ${PORT}`));

// ── Graceful shutdown ─────────────────────────────────────────────────────────
// Railway sends SIGTERM on deploy/restart (default grace ~30s). We clear the
// interval timers first so no cron fires mid-shutdown, then stop accepting new
// connections via server.close() (which drains in-flight requests), then close
// the SQLite handle. A 10s safety-valve timeout force-exits if anything hangs.
// `shuttingDown` guards against double-invocation (e.g. if both SIGTERM and
// SIGINT arrive, or the handler is re-entered).
let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[shutdown] received ${signal}, closing gracefully`);

  intervals.forEach(clearInterval);

  server.close((err) => {
    if (err) console.error('[shutdown] server.close error:', err.message);
    else     console.log('[shutdown] http server closed');

    if (db.db && typeof db.db.close === 'function') {
      try { db.db.close(); console.log('[shutdown] db closed'); }
      catch (e) { console.error('[shutdown] db.close error:', e.message); }
    }
    process.exit(0);
  });

  // Safety valve — force exit if graceful close hangs (long-lived keep-alive,
  // stuck DB write, etc.). .unref() so the timer itself doesn't keep us alive.
  setTimeout(() => {
    console.error('[shutdown] forced exit after 10s timeout');
    process.exit(1);
  }, 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
