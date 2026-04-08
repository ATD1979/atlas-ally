// Atlas Ally — Admin & distributor routes
const router = require('express').Router();
const crypto = require('crypto');
const db     = require('../db');
const { dispatchAlerts }          = require('../alerts');
const { refreshAllNews }          = require('../news');
const { sanitizeUser }            = require('./auth');

// ── Admin: users ──────────────────────────────────────────────────────────────

router.get('/users', (req, res) => {
  res.json(db.getAllUsers.all().map(sanitizeUser));
});

router.patch('/users/:id/role', (req, res) => {
  const { role } = req.body;
  if (!['admin', 'distributor', 'user'].includes(role))
    return res.status(400).json({ error: 'Invalid role' });
  db.updateRole(role, req.params.id);
  res.json({ ok: true });
});

router.delete('/users/:id', (req, res) => {
  db.deactivateUser(req.params.id);
  res.json({ ok: true });
});

// Legacy subscribers list (mirrors /users with country data)
router.get('/subscribers', (req, res) => {
  const users = db.getAllUsers.all().map(u => ({
    ...sanitizeUser(u),
    countries: db.getUserCountries.all(u.id).map(c => c.country_code),
  }));
  res.json(users);
});

// ── Admin: events ─────────────────────────────────────────────────────────────

router.get('/events', (req, res) => {
  res.json(db.getAllEventsAdmin.all());
});

router.post('/events', (req, res) => {
  const { country_code, type, title, description, location, lat, lng, severity, is_test } = req.body;
  if (!country_code || !type || !title)
    return res.status(400).json({ error: 'Missing required fields' });

  const result = db.addEvent.run({
    country_code: country_code.toUpperCase(), type, title,
    description: description || null, location: location || null,
    lat: lat || null, lng: lng || null, severity: severity || 'warn',
    source: 'admin', source_url: null,
    submitted_by: 'admin', submitted_user_id: null,
    is_test: is_test ? 1 : 0,
  });
  const event = db.db.prepare(`SELECT * FROM events WHERE id = ?`).get(result.lastInsertRowid);
  if (!is_test) dispatchAlerts(event).catch(() => {});
  res.json({ ok: true, event });
});

router.delete('/events/test', (req, res) => {
  db.db.prepare(`UPDATE events SET status='removed' WHERE is_test=1`).run();
  res.json({ ok: true });
});

router.get('/queue', (req, res) => {
  res.json(db.db.prepare(`SELECT * FROM events WHERE status='pending' ORDER BY created_at DESC`).all());
});

// ── Admin: settings ───────────────────────────────────────────────────────────

router.get('/settings', (req, res) => {
  const settings = {};
  db.db.prepare(`SELECT * FROM app_settings`).all().forEach(r => { settings[r.key] = r.value; });
  res.json(settings);
});

router.put('/settings', (req, res) => {
  const { key, value } = req.body;
  db.setSetting.run(key, value);
  res.json({ ok: true });
});

// ── Admin: stats & errors ─────────────────────────────────────────────────────

router.get('/stats', (req, res) => res.json(db.getStats()));

router.get('/errors', (req, res) => {
  res.json(db.getRecentErrors.all());
});

// ── Admin: news ───────────────────────────────────────────────────────────────

router.post('/refresh-news', async (req, res) => {
  refreshAllNews().catch(() => {});
  res.json({ ok: true, message: 'News refresh started' });
});

// ── Admin: feedback ───────────────────────────────────────────────────────────

router.get('/feedback', (req, res) => {
  res.json(db.db.prepare(`SELECT * FROM feedback ORDER BY created_at DESC`).all());
});

// ── Admin: invite tokens ──────────────────────────────────────────────────────

router.get('/invite-tokens', (req, res) => {
  res.json(db.db.prepare(`SELECT * FROM invite_tokens ORDER BY created_at DESC`).all());
});

router.post('/invite-tokens', (req, res) => {
  const { max_uses = 1 } = req.body;
  const token = crypto.randomBytes(6).toString('hex').toUpperCase();
  db.db.prepare(`INSERT INTO invite_tokens (token, created_by, max_uses) VALUES (?, 'admin', ?)`).run(token, max_uses);
  res.json({ ok: true, token });
});

router.delete('/invite-tokens/:token', (req, res) => {
  db.db.prepare(`UPDATE invite_tokens SET active=0 WHERE token=?`).run(req.params.token);
  res.json({ ok: true });
});

// ── Admin: legacy auth (kept for admin panel) ─────────────────────────────────

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Invalid password' });
  res.json({ ok: true, token: 'admin-' + Buffer.from(password).toString('base64') });
});

router.post('/verify', (req, res) => {
  const { token } = req.body;
  const expected  = 'admin-' + Buffer.from(process.env.ADMIN_PASSWORD || '').toString('base64');
  res.json({ ok: token === expected });
});

// ── Distributor: trial codes ──────────────────────────────────────────────────

router.get('/distributor/codes', (req, res) => {
  res.json(db.getTrialCodesByUser.all(req.user.id));
});

router.post('/distributor/codes', (req, res) => {
  const quota       = parseInt(db.getSetting('distributor_default_quota') || '25');
  const existingCodes = db.getTrialCodesByUser.all(req.user.id);
  const totalUses   = existingCodes.reduce((sum, c) => sum + c.max_uses, 0);

  if (req.user.role !== 'admin' && totalUses >= quota)
    return res.status(403).json({ error: `You have reached your quota of ${quota} trial users` });

  const { max_uses = 10, trial_days = 7 } = req.body;
  const code       = crypto.randomBytes(4).toString('hex').toUpperCase();
  const expires_at = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  db.createTrialCode.run({ code, created_by: req.user.id, max_uses, trial_days, expires_at });
  res.json({ ok: true, code });
});

router.delete('/distributor/codes/:code', (req, res) => {
  db.deactivateTrialCode.run(req.params.code);
  res.json({ ok: true });
});

module.exports = router;

// ── Emergency: force-set admin accounts to premium (no auth required, localhost only)
router.post('/fix-admins', (req, res) => {
  const ADMINS = ['+16825617016', '+962797640020'];
  const results = [];
  ADMINS.forEach(wa => {
    try {
      db.db.prepare(`
        UPDATE users SET role='admin', plan='premium', verified=1,
        trial_end=datetime('now','+3650 days') WHERE whatsapp=?
      `).run(wa);
      const u = db.getUser(wa);
      results.push({ whatsapp: wa, plan: u?.plan, role: u?.role });
    } catch(e) { results.push({ whatsapp: wa, error: e.message }); }
  });
  res.json({ ok: true, results });
});
