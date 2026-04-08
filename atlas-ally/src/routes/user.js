// Atlas Ally — User routes (/api/user/*)
const router = require('express').Router();
const fetch  = require('node-fetch');
const db     = require('../db');
const { COUNTRIES } = require('../countries');
const { sendCheckinAlert } = require('../alerts');

// ── Country subscriptions ─────────────────────────────────────────────────────

router.get('/countries', (req, res) => {
  res.json(db.getUserCountries.all(req.user.id).map(r => r.country_code));
});

router.post('/countries', (req, res) => {
  const { country_code } = req.body;
  if (!country_code) return res.status(400).json({ error: 'country_code required' });

  const user     = db.getUserById(req.user.id);
  const count    = db.countUserCountries.get(req.user.id).count;
  const maxFree  = parseInt(db.getSetting('max_free_countries') || '3');

  if (count >= maxFree && user.plan === 'trial')
    return res.status(402).json({
      error: 'Free trial allows up to 3 countries. Upgrade to Traveler ($3/month) to add more.',
      upgrade_required: true,
    });

  if (count >= (user.country_slots || 3) && user.plan !== 'premium')
    return res.status(402).json({ error: 'Upgrade to add more countries.', upgrade_required: true });

  db.addCountry.run({ user_id: req.user.id, country_code: country_code.toUpperCase() });
  res.json({ ok: true });
});

router.delete('/countries/:code', (req, res) => {
  db.removeCountry.run(req.user.id, req.params.code.toUpperCase());
  res.json({ ok: true });
});

// ── Emergency contacts ────────────────────────────────────────────────────────

router.get('/contacts', (req, res) => {
  res.json(db.getEmergencyContacts.all(req.user.id));
});

router.post('/contacts', (req, res) => {
  const { name, whatsapp, relation } = req.body;
  if (!name || !whatsapp) return res.status(400).json({ error: 'name and whatsapp required' });
  db.addEmergencyContact.run({ user_id: req.user.id, name, whatsapp, relation: relation || null });
  res.json({ ok: true });
});

router.delete('/contacts/:id', (req, res) => {
  db.removeEmergencyContact.run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ── Account deletion ──────────────────────────────────────────────────────────

router.delete('/delete', (req, res) => {
  const userId = req.user.id;
  try {
    [
      `DELETE FROM emergency_contacts WHERE user_id = ?`,
      `DELETE FROM user_countries     WHERE user_id = ?`,
      `DELETE FROM checkin_log        WHERE user_id = ?`,
      `DELETE FROM zone_alerts        WHERE user_id = ?`,
      `DELETE FROM notify_log         WHERE user_id = ?`,
      `DELETE FROM offline_cache      WHERE user_id = ?`,
      `DELETE FROM feedback           WHERE user_id = ?`,
    ].forEach(sql => db.db.prepare(sql).run(userId));

    db.db.prepare(`UPDATE events SET submitted_user_id = NULL WHERE submitted_user_id = ?`).run(userId);
    db.db.prepare(`
      UPDATE users SET
        whatsapp       = 'deleted-' || id,
        name           = 'Deleted User',
        email          = NULL, dob = NULL,
        state_origin   = NULL, country_origin = NULL,
        active = 0, verified = 0, stripe_id = NULL
      WHERE id = ?
    `).run(userId);

    console.log(`User ${userId} account deleted (anonymized)`);
    res.json({ ok: true, message: 'Account deleted successfully' });
  } catch (e) {
    req.logErr('account_delete', e);
    res.status(500).json({ error: 'Failed to delete account. Please contact support@atlas-ally.com' });
  }
});

module.exports = router;

// ── Standalone handlers (mounted directly in server.js) ───────────────────────

async function handleCheckin(req, res) {
  const { whatsapp, lat, lng, country_code, message, safety_score } = req.body;
  if (!whatsapp) return res.status(400).json({ error: 'whatsapp required' });

  const user = db.getUser(whatsapp);
  if (user) {
    db.logCheckin.run({ user_id: user.id, lat: lat || null, lng: lng || null,
                        country_code: country_code || null, safety_score: safety_score || null,
                        message: message || null, type: 'manual' });
    const contacts = db.getEmergencyContacts.all(user.id);
    const country  = country_code ? COUNTRIES[country_code] : null;
    const mapUrl   = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : '';
    const msg =
      `✅ *${user.name || whatsapp} is safe!*\n` +
      (country ? `📍 ${country.flag} ${country.name}\n` : '') +
      (message ? `💬 "${message}"\n` : '') +
      (mapUrl  ? `🗺️ ${mapUrl}` : '') +
      `\n_Atlas Ally check-in_`;
    for (const c of contacts) await sendCheckinAlert(c.whatsapp, msg).catch(() => {});
  }
  res.json({ ok: true });
}

async function handleZoneAlert(req, res) {
  const { whatsapp, zone_name, country_code, lat, lng, alert_type } = req.body;
  if (!whatsapp) return res.status(400).json({ error: 'whatsapp required' });

  const user = db.getUser(whatsapp);
  if (user) {
    db.logZoneAlert.run({ user_id: user.id, zone_name: zone_name || null,
                          country_code: country_code || null, lat: lat || null,
                          lng: lng || null, event_type: 'geofence',
                          alert_type: alert_type || 'entry' });
    const contacts = db.getEmergencyContacts.all(user.id);
    const country  = country_code ? COUNTRIES[country_code] : null;
    const mapUrl   = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : '';
    const msg = alert_type === 'danger'
      ? `🚨 *DANGER ALERT — ${user.name || whatsapp}*\nEntering high-risk area: ${zone_name || 'Unknown'}\n${country ? `${country.flag} ${country.name}\n` : ''}${mapUrl}\n_Atlas Ally journey alert_`
      : `🛂 *${user.name || whatsapp} crossed into ${zone_name || country?.name || 'new country'}*\n${mapUrl}\n_Atlas Ally geofence alert_`;
    for (const c of contacts) await sendCheckinAlert(c.whatsapp, msg).catch(() => {});
  }
  res.json({ ok: true });
}

module.exports.handleCheckin   = handleCheckin;
module.exports.handleZoneAlert = handleZoneAlert;
