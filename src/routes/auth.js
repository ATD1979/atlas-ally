// Atlas Ally — Auth routes (/api/auth/*)
// v2026.04.15 — clean slate
const router  = require('express').Router();
const crypto  = require('crypto');
const db      = require('../db');
const { generateOTP, createToken, requireAuth, requireAdmin } = require('../auth');
const { sendCheckinAlert } = require('../alerts');

// ─── OTP rate limit (per phone, in-memory) ────────────────────────────────────
const otpRateLimit       = new Map();
const OTP_MAX_PER_WINDOW = 3;
const OTP_WINDOW_MS      = 5 * 60 * 1000;

function checkOTPRateLimit(whatsapp) {
  const now    = Date.now();
  const record = otpRateLimit.get(whatsapp);
  if (!record || now > record.resetAt) {
    otpRateLimit.set(whatsapp, { count: 1, resetAt: now + OTP_WINDOW_MS });
    return true;
  }
  if (record.count >= OTP_MAX_PER_WINDOW) return false;
  record.count++;
  return true;
}

function sanitizeUser(u) {
  const safe = { ...u };
  delete safe.stripe_id;
  delete safe.dob;
  return safe;
}

function trialStatus(user) {
  if (user.plan === 'premium') return { trial_active: false, trial_expired: false, on_premium: true };
  const daysLeft = db.getTrialDaysLeft(user);
  return {
    trial_active:  daysLeft > 0,
    trial_expired: daysLeft <= 0,
    trial_days_left: Math.max(0, Math.floor(daysLeft)),
    on_premium:    false,
  };
}

router.post('/send-otp', async (req, res) => {
  const { whatsapp, purpose = 'login' } = req.body;
  if (!whatsapp) return res.status(400).json({ error: 'WhatsApp number required' });

  const validPurposes = ['login', 'signup', 'admin-login'];
  if (!validPurposes.includes(purpose))
    return res.status(400).json({ error: 'Invalid OTP purpose' });

  const clean = whatsapp.replace(/\s/g, '').replace(/^00/, '+');

  if (purpose === 'admin-login') {
    const user = db.getUser(clean);
    if (!user || user.role !== 'admin')
      return res.status(403).json({ error: 'This number is not registered as an admin' });
  }

  if (!checkOTPRateLimit(clean))
    return res.status(429).json({ error: 'Too many codes sent. Please wait a few minutes.' });

  const code = generateOTP();

  try {
    db.createOTP.run({ whatsapp: clean, code, purpose });
    db.cleanOTPs.run();
    await sendCheckinAlert(clean,
      `🌍 *Atlas Ally*\n\nYour verification code is:\n\n*${code}*\n\n_Expires in 10 minutes. Do not share this code._`
    );
    res.json({ ok: true, message: 'OTP sent to your WhatsApp' });
  } catch (e) {
    req.logErr('otp_send', e);
    res.status(500).json({ error: 'Failed to send OTP. Check your WhatsApp number.' });
  }
});

router.post('/admin-login', (req, res) => {
  const { whatsapp, code } = req.body;
  if (!whatsapp || !code) return res.status(400).json({ error: 'WhatsApp and code required' });

  const clean = whatsapp.replace(/\s/g, '').replace(/^00/, '+');
  const otp   = db.getOTP.get(clean);

  if (!otp || otp.code !== code.toString() || otp.purpose !== 'admin-login')
    return res.status(401).json({ error: 'Invalid or expired code' });

  const user = db.getUser(clean);
  if (!user || user.role !== 'admin')
    return res.status(403).json({ error: 'Admin access denied' });

  db.markOTPUsed.run(otp.id);
  db.updateLastLogin(user.id);

  res.json({ ok: true, token: createToken(user), user: sanitizeUser(db.getUser(clean)) });
});

router.post('/verify-otp', (req, res) => {
  const { whatsapp, code, purpose = 'login' } = req.body;
  if (!whatsapp || !code) return res.status(400).json({ error: 'WhatsApp and code required' });

  const clean = whatsapp.replace(/\s/g, '').replace(/^00/, '+');
  const otp   = db.getOTP.get(clean);

  if (!otp || otp.code !== code.toString())
    return res.status(401).json({ error: 'Invalid or expired code' });

  if (otp.purpose !== purpose)
    return res.status(401).json({ error: 'Code was not issued for this action' });

  let user = db.getUser(clean);
  // For new signups (no existing user) the OTP must stay unused so /signup
  // can find it via db.getOTP (which filters used = 0). The /signup endpoint
  // marks it used itself after creating the user. Marking it here would
  // orphan the OTP and signup would 401 with "Please verify your WhatsApp
  // number before signing up".
  if (!user) return res.json({ ok: true, needs_signup: true, whatsapp: clean });

  db.markOTPUsed.run(otp.id);

  db.updateUserVerified(clean);
  db.updateLastLogin(user.id);
  user = db.getUser(clean);

  res.json({ ok: true, token: createToken(user), user: sanitizeUser(user), ...trialStatus(user) });
});

router.post('/signup', (req, res) => {
  const { whatsapp, name, email, dob, state_origin, country_origin, trial_code } = req.body;

  if (!whatsapp || !name || !dob)
    return res.status(400).json({ error: 'Name, WhatsApp, and date of birth are required' });

  if (!db.isAdult(dob))
    return res.status(400).json({ error: 'You must be 18 or older to use Atlas Ally' });

  const clean = whatsapp.replace(/\s/g, '').replace(/^00/, '+');

  const otp = db.getOTP.get(clean);
  if (!otp || otp.purpose !== 'signup')
    return res.status(401).json({ error: 'Please verify your WhatsApp number before signing up' });
  db.markOTPUsed.run(otp.id);

  const existing = db.getUser(clean);
  if (existing) {
    // Block overwriting privileged accounts. Without this, anyone who obtains
    // a signup-purpose OTP for an admin/distributor's WhatsApp could rewrite
    // their identifying fields (name/email/dob). Privileged users are seeded
    // and reach a token via /verify-otp directly — they never legitimately
    // hit /signup. (PR #38, closes N19 partial)
    if (existing.role === 'admin' || existing.role === 'distributor') {
      return res.status(403).json({
        error: 'This number is registered for staff use. Please use the admin login.',
      });
    }
    db.db.prepare(`
      UPDATE users SET
        name           = COALESCE(NULLIF(@name,''), name),
        email          = COALESCE(NULLIF(@email,''), email),
        dob            = COALESCE(NULLIF(@dob,''), dob),
        state_origin   = COALESCE(NULLIF(@state_origin,''), state_origin),
        country_origin = COALESCE(NULLIF(@country_origin,''), country_origin),
        verified = 1, last_login = datetime('now')
      WHERE whatsapp = @whatsapp
    `).run({ name: name || null, email: email || null, dob: dob || null,
             state_origin: state_origin || null, country_origin: country_origin || null,
             whatsapp: clean });
    const updated = db.getUser(clean);
    return res.json({ ok: true, token: createToken(updated), user: sanitizeUser(updated),
                      was_existing: true, ...trialStatus(updated) });
  }

  let distributor_id = null;
  let trialDays      = 7;
  if (trial_code) {
    const tc = db.getTrialCode.get(trial_code);
    if (!tc)                    return res.status(400).json({ error: 'Invalid or expired invite code' });
    if (tc.uses >= tc.max_uses) return res.status(400).json({ error: 'This invite code has reached its limit' });
    distributor_id = tc.created_by;
    trialDays      = tc.trial_days || 7;
    db.useTrialCode.run(trial_code);
  }

  try {
    db.createUser({ whatsapp: clean, name, email: email || null, dob,
                    state_origin: state_origin || null, country_origin: country_origin || null,
                    trial_code: trial_code || null, distributor_id });

    if (trialDays !== 7) {
      // Parameterize the datetime modifier rather than interpolating trialDays
      // into the SQL template literal. trialDays originates from req.body in
      // admin.js's /distributor/codes handler (stored via invite_tokens) and
      // could carry hostile content; datetime() receives it as a bound string
      // and rejects anything that isn't a valid modifier like '+7 days'.
      const days = parseInt(trialDays, 10) || 7;
      db.db.prepare(`UPDATE users SET trial_end = datetime('now', ?) WHERE whatsapp = ?`).run(`+${days} days`, clean);
    }

    const user = db.getUser(clean);
    res.json({ ok: true, token: createToken(user), user: sanitizeUser(user), ...trialStatus(user) });
  } catch (e) {
    req.logErr('signup', e);
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
});

router.post('/redeem-token', requireAuth, (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  const row = db.db.prepare(`SELECT * FROM free_tokens WHERE token = ? AND used = 0`).get(token);
  if (!row) return res.status(400).json({ error: 'Invalid or already used token' });

  db.db.prepare(`UPDATE free_tokens SET used = 1, used_by = ?, used_at = datetime('now') WHERE token = ?`)
    .run(req.user.whatsapp, token);
  db.db.prepare(`
    UPDATE users
    SET trial_end = datetime(
          CASE WHEN trial_end > datetime('now') THEN trial_end ELSE datetime('now') END,
          '+' || ? || ' days'
        ),
        plan = CASE WHEN plan != 'premium' THEN 'trial' ELSE plan END
    WHERE id = ?
  `).run(row.days, req.user.id);

  const user = db.getUserById(req.user.id);
  res.json({ ok: true, message: `${row.days} free days added to your account`, ...trialStatus(user) });
});

router.post('/send-free-token', requireAdmin, async (req, res) => {
  const { whatsapp, days = 30 } = req.body;
  if (!whatsapp) return res.status(400).json({ error: 'WhatsApp number required' });

  const clean     = whatsapp.replace(/\s/g, '').replace(/^00/, '+');
  const recipient = db.getUser(clean);
  if (!recipient) return res.status(404).json({ error: 'No user found with that WhatsApp number' });

  const token = crypto.randomBytes(12).toString('hex').toUpperCase();
  db.db.prepare(`INSERT INTO free_tokens (token, created_by, whatsapp, days) VALUES (?, ?, ?, ?)`)
    .run(token, req.user.id, clean, days);

  try {
    await sendCheckinAlert(clean,
      `🌍 *Atlas Ally*\n\nYou've been given *${days} days of free access* by an Atlas Ally admin.\n\nYour token: *${token}*\n\nRedeem it in the app under Account → Redeem Token.`
    );
    res.json({ ok: true, token, days, sent_to: clean });
  } catch (e) {
    req.logErr('send_free_token', e);
    res.json({ ok: true, token, days, sent_to: clean,
               whatsapp_warning: 'Token created but WhatsApp delivery failed — share the token manually.' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const countries = db.getUserCountries.all(user.id).map(c => c.country_code);
  const contacts  = db.getEmergencyContacts.all(user.id);
  res.json({ user: sanitizeUser(user), countries, contacts, ...trialStatus(user) });
});

router.put('/profile', requireAuth, (req, res) => {
  const { name, email, state_origin, country_origin } = req.body;
  db.db.prepare(`
    UPDATE users
    SET name           = COALESCE(?, name),
        email          = COALESCE(?, email),
        state_origin   = COALESCE(?, state_origin),
        country_origin = COALESCE(?, country_origin)
    WHERE id = ?
  `).run(name || null, email || null, state_origin || null, country_origin || null, req.user.id);
  res.json({ ok: true });
});

module.exports = { router, sanitizeUser };
