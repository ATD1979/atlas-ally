// Atlas Ally — User incident reporting routes (/api/incidents/*)
// v2026.05.07 — submission endpoint for user-reported safety incidents
//
// Authenticated users submit reports via POST /report. Reports land in
// the events table with status='pending' and source='user_report',
// awaiting admin moderation via the existing admin.js endpoints
// (GET /api/admin/pending, POST /api/admin/approve/:id,
// POST /api/admin/reject/:id).
//
// Approval triggers WhatsApp dispatch through the existing alerts
// pipeline (admin.js handles that). Rejection silently flips status
// without notifying the submitter.
//
// Mount in app entry file: app.use('/api/incidents', require('./routes/incidents'));

const router = require('express').Router();
const db     = require('../db');
const { requireAuth } = require('../auth');

// Rate limit: max 5 reports per user per hour. Inlined query rather than
// a new prepared statement to keep db.js minimal per the Phase 3.A
// "no schema/db.js changes" decision.
const RATE_LIMIT_MAX    = 5;
const RATE_LIMIT_WINDOW = '-1 hour';

// Severity allowed values — matches the convention used by RSS-fetched
// events ('info' for FYI items, 'warn' for default caution, 'crit' for
// immediate-danger reports). Server-side validation here protects against
// arbitrary strings being inserted from a tampered client.
const VALID_SEVERITIES = ['info', 'warn', 'crit'];

function checkRateLimit(userId) {
  const row = db.db.prepare(
    `SELECT COUNT(*) AS c FROM events WHERE submitted_user_id = ? AND created_at > datetime('now', ?)`
  ).get(userId, RATE_LIMIT_WINDOW);
  return row.c < RATE_LIMIT_MAX;
}

// POST /api/incidents/report
// Body: { country_code, type, title, description?, location?, lat?, lng?, severity? }
router.post('/report', requireAuth, (req, res) => {
  const {
    country_code, type, title, description,
    location, lat, lng, severity,
  } = req.body || {};

  // Required fields
  if (!country_code || !type || !title) {
    return res.status(400).json({
      error: 'country_code, type, and title are required',
    });
  }

  // Length limits — protect against giant payloads landing in the events
  // table where they'd bloat the admin queue and the public feed.
  if (title.length > 200) {
    return res.status(400).json({ error: 'Title too long (max 200 chars)' });
  }
  if (description && description.length > 2000) {
    return res.status(400).json({ error: 'Description too long (max 2000 chars)' });
  }

  if (severity && !VALID_SEVERITIES.includes(severity)) {
    return res.status(400).json({
      error: `Invalid severity. Allowed: ${VALID_SEVERITIES.join(', ')}`,
    });
  }

  if (!checkRateLimit(req.user.id)) {
    return res.status(429).json({
      error: 'You have submitted too many reports recently. Please try again later.',
    });
  }

  try {
    const result = db.addPendingEvent.run({
      country_code:      country_code.toUpperCase(),
      type,
      title:             title.trim(),
      description:       description ? description.trim() : null,
      location:          location || null,
      lat:               (lat === undefined || lat === null || lat === '') ? null : Number(lat),
      lng:               (lng === undefined || lng === null || lng === '') ? null : Number(lng),
      severity:          severity || 'warn',
      source:            'user_report',
      source_url:        null,
      submitted_by:      req.user.whatsapp,
      submitted_user_id: req.user.id,
      is_test:           0,
    });

    res.json({
      ok:      true,
      id:      result.lastInsertRowid,
      message: 'Your report has been submitted and is awaiting admin review.',
    });
  } catch (e) {
    if (req.logErr) req.logErr('incident_submit', e);
    else console.error('[incidents/report] error:', e.message);
    res.status(500).json({ error: 'Failed to submit report. Please try again.' });
  }
});

module.exports = router;
