// Atlas Ally — Auth routes (/api/auth/*)
const router = require('express').Router();
const db = require('../db');
const { generateOTP, createToken } = require('../auth');
const { sendCheckinAlert } = require('../alerts');

function sanitizeUser(u) {
  const safe = { ...u };
  delete safe.stripe_id;
  return safe;
}

// Send OTP via WhatsApp
router.post('/send-otp', async (req, res) => {
  const { whatsapp, purpose = 'login' } = req.body;
  if (!whatsapp) return res.status(400).json({ error: 'WhatsApp number required' });

  const clean = whatsapp.replace(/\s/g, '').replace(/^00/, '+');
  const code  = generateOTP();

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

// Verify OTP — returns JWT
router.post('/verify-otp', (req, res) => {
  const { whatsapp, code } = req.body;
  if (!whatsapp || !code) return res.status(400).json({ error: 'WhatsApp and code required' });

  const clean = whatsapp.replace(/\s/g, '').replace(/^00/, '+');
  const otp   = db.getOTP.get(clean);

  if (!otp || otp.code !== code.toString())
    return res.status(401).json({ error: 'Invalid or expired code' });

  db.markOTPUsed.run(otp.id);

  let user = db.getUser(clean);
  if (!user) return res.json({ ok: true, needs_signup: true, whatsapp: clean });

  db.updateUserVerified(clean);
  db.updateLastLogin(user.id);
  user = db.getUser(clean);

  res.json({ ok: true, token: createToken(user), user: sanitizeUser(user) });
});

// Full signup
router.post('/signup', (req, res) => {
  const { whatsapp, name, email, dob, state_origin, country_origin, trial_code } = req.body;

  if (!whatsapp || !name || !dob)
    return res.status(400).json({ error: 'Name, WhatsApp, and date of birth are required' });
  if (!db.isAdult(dob))
    return res.status(400).json({ error: 'You must be 18 or older to use Atlas Ally' });

  const clean    = whatsapp.replace(/\s/g, '').replace(/^00/, '+');
  const existing = db.getUser(clean);

  if (existing) {
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
    return res.json({ ok: true, token: createToken(updated), user: sanitizeUser(updated), was_existing: true });
  }

  // Validate trial code
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
    if (trialDays !== 7)
      db.db.prepare(`UPDATE users SET trial_end = datetime('now', '+${trialDays} days') WHERE whatsapp = ?`).run(clean);

    const user = db.getUser(clean);
    res.json({ ok: true, token: createToken(user), user: sanitizeUser(user) });
  } catch (e) {
    req.logErr('signup', e);
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
});

// Get current user profile
router.get('/me', (req, res) => {
  const user     = db.getUserById(req.user.id);
  if (!user)     return res.status(404).json({ error: 'User not found' });
  const countries = db.getUserCountries.all(user.id).map(c => c.country_code);
  const contacts  = db.getEmergencyContacts.all(user.id);
  res.json({ user: sanitizeUser(user), countries, contacts, trial_days_left: db.getTrialDaysLeft(user) });
});

// Update profile
router.put('/profile', (req, res) => {
  const { name, email, state_origin, country_origin } = req.body;
  db.db.prepare(`
    UPDATE users
    SET name = COALESCE(?,name), email = COALESCE(?,email),
        state_origin = COALESCE(?,state_origin), country_origin = COALESCE(?,country_origin)
    WHERE id = ?
  `).run(name || null, email || null, state_origin || null, country_origin || null, req.user.id);
  res.json({ ok: true });
});

module.exports = { router, sanitizeUser };
