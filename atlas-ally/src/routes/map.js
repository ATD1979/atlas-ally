// Atlas Ally — Map, events & country routes
const router  = require('express').Router();
const fetch   = require('node-fetch');
const db      = require('../db');
const { COUNTRIES, ADVISORY_LEVELS } = require('../countries');
const { dispatchAlerts } = require('../alerts');

// ── Countries ─────────────────────────────────────────────────────────────────

router.get('/countries', (req, res) => {
  const overrides = {};
  try {
    db.db.prepare(`SELECT * FROM advisory_overrides`).all()
      .forEach(o => { overrides[o.country_code] = o; });
  } catch {}

  const list = Object.entries(COUNTRIES).map(([code, c]) => {
    const adv   = overrides[code] || {};
    const level = adv.level || c.advisoryLevel || 1;
    const cfg   = ADVISORY_LEVELS[level] || ADVISORY_LEVELS[1];
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

router.get('/country/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const c    = COUNTRIES[code];
  if (!c) return res.status(404).json({ error: 'Country not found' });

  const override = db.getAdvisoryOverride.get(code) || {};
  const level    = override.level || c.advisoryLevel || 1;
  const cfg      = ADVISORY_LEVELS[level] || ADVISORY_LEVELS[1];

  res.json({
    ...c, code,
    advisoryLevel: level, advisoryText: override.text || c.advisoryText, advisoryConfig: cfg,
    events: db.getEventsByCountry.all(code),
    news:   db.getNewsByCountry.all(code),
    crime:  db.getCrimeStatsByCountry.all(code),
  });
});

router.get('/country/:code/weather', async (req, res) => {
  const code = req.params.code.toUpperCase();
  const c    = COUNTRIES[code];
  if (!c?.center) return res.status(404).json({ error: 'No location data' });

  try {
    const [lat, lng] = c.center;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,weathercode,windspeed_10m&forecast_days=1`;
    const r   = await fetch(url, { timeout: 8000 });
    const d   = await r.json();
    const cw  = d.current_weather || {};
    res.json({ current: { temp: Math.round(cw.temperature), wind: Math.round(cw.windspeed || 0), code: cw.weathercode }, alerts: [] });
  } catch {
    res.status(500).json({ error: 'Weather unavailable' });
  }
});

// ── Events ────────────────────────────────────────────────────────────────────

router.get('/events', (req, res) => {
  const { country_code } = req.query;
  const events = country_code
    ? db.db.prepare(`
        SELECT * FROM events
        WHERE country_code=? AND status='approved' AND is_test=0
          AND created_at > datetime('now', '-72 hours')
        ORDER BY created_at DESC
      `).all(country_code.toUpperCase())
    : db.getEvents72h.all();
  res.json(events);
});

router.post('/events', (req, res) => {
  const { country_code, type, title, description, location, lat, lng, severity, source_url } = req.body;
  if (!country_code || !type || !title)
    return res.status(400).json({ error: 'country_code, type, title required' });

  const result = db.addEvent.run({
    country_code: country_code.toUpperCase(), type, title,
    description: description || null, location: location || null,
    lat: lat || null, lng: lng || null, severity: severity || 'warn',
    source: 'user', source_url: source_url || null,
    submitted_by: req.user?.whatsapp || 'anonymous',
    submitted_user_id: req.user?.id || null,
    is_test: 0,
  });
  const event = db.db.prepare(`SELECT * FROM events WHERE id = ?`).get(result.lastInsertRowid);
  dispatchAlerts(event).catch(() => {});
  res.json({ ok: true, event });
});

router.delete('/events/:id', (req, res) => {
  db.removeEvent.run(req.params.id);
  res.json({ ok: true });
});

router.patch('/events/:id/test', (req, res) => {
  db.markTestEvent.run(req.params.id);
  res.json({ ok: true });
});

// ── Detect country from coords ────────────────────────────────────────────────

router.post('/detect-country', async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'AtlasAlly/1.0' }, timeout: 5000 }
    );
    const d           = await r.json();
    const countryCode = d.address?.country_code?.toUpperCase();
    res.json({ country_code: countryCode, country: countryCode ? COUNTRIES[countryCode] : null });
  } catch {
    res.json({ country_code: null });
  }
});

// ── Safety score ──────────────────────────────────────────────────────────────

router.post('/safety-score', async (req, res) => {
  const { lat, lng, country_code } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  try {
    const { calculateSafetyScore } = require('../safety');
    res.json(calculateSafetyScore(lat, lng, country_code));
  } catch {
    res.status(500).json({ score: 50, label: 'Unknown', emoji: '🛡', factors: [] });
  }
});

module.exports = router;
