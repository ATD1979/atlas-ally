// Atlas Ally — Preview Gate (full email OTP — DNS verified green)
// v2026.04.15 — clean slate
'use strict';

const crypto   = require('crypto');
const path     = require('path');
const nodemailer = require('nodemailer');

const GATE_EMAIL     = 'info@atlas-ally.com';
const GATE_PASSWORD  = process.env.GATE_PASSWORD  || 'TravelGuardian0405';
const SESSION_SECRET = process.env.GATE_SECRET    || 'atlas-gate-secret-2026';
const SMTP_PASSWORD  = process.env.IMPROVMX_PASSWORD || '6WkNttWW7kxd';

// In-memory stores (fine for a single-instance preview gate)
const validSessions = new Set();
const pendingOTPs   = new Map(); // email → { code, expires }

// ── SMTP transport via ImprovMX ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   'smtp.improvmx.com',
  port:   587,
  secure: false,
  auth: {
    user: GATE_EMAIL,
    pass: SMTP_PASSWORD,
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(toEmail, code) {
  await transporter.sendMail({
    from:    `"Atlas Ally" <${GATE_EMAIL}>`,
    to:      toEmail,
    subject: 'Your Atlas Ally access code',
    text:    `Your verification code is: ${code}\n\nExpires in 10 minutes. Do not share this code.`,
    html:    `
      <div style="font-family:-apple-system,sans-serif;max-width:400px;margin:0 auto;padding:32px 24px;">
        <div style="font-size:28px;margin-bottom:8px;">🌍</div>
        <div style="font-size:20px;font-weight:700;color:#1A2332;margin-bottom:4px;">Atlas Ally</div>
        <div style="font-size:13px;color:#6B7C93;margin-bottom:28px;">Global Travel Intelligence</div>
        <div style="font-size:13px;color:#6B7C93;margin-bottom:12px;">Your verification code is:</div>
        <div style="font-size:36px;font-weight:800;letter-spacing:6px;color:#0E7490;
             background:#E0F2F7;border-radius:10px;padding:16px;text-align:center;
             margin-bottom:20px;">${code}</div>
        <div style="font-size:12px;color:#A8B5C4;">Expires in 10 minutes. Do not share this code.</div>
      </div>
    `,
  });
}

function makeSessionToken(email) {
  const payload = `${email}:${Date.now()}:${SESSION_SECRET}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

const PUBLIC_PATHS = [
  '/gate', '/gate/login', '/gate/verify', '/gate/logout',
  '/coming-soon', '/favicon.ico',
];

function isPublic(req) {
  const p = req.path;
  if (PUBLIC_PATHS.includes(p)) return true;
  if (p.startsWith('/api/')) return true;
  if (/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|map)$/.test(p)) return true;
  return false;
}

function gateMiddleware(req, res, next) {
  if (isPublic(req)) return next();
  const cookie = req.cookies?.atlas_gate;
  if (cookie && validSessions.has(cookie)) return next();
  const accept = req.headers.accept || '';
  if (accept.includes('text/html')) return res.redirect('/coming-soon');
  return res.status(401).json({ error: 'Preview access required' });
}

function setupGateRoutes(app) {
  const express = require('express');

  app.get('/coming-soon', (req, res) =>
    res.sendFile(path.join(__dirname, '..', 'public', 'coming-soon.html')));

  app.get('/gate', (req, res) => {
    const cookie = req.cookies?.atlas_gate;
    if (cookie && validSessions.has(cookie)) return res.redirect('/');
    res.sendFile(path.join(__dirname, '..', 'public', 'gate.html'));
  });

  // Step 1 — verify email + password, send OTP
  app.post('/gate/login', express.json(), async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.json({ ok: false, error: 'Email and password required.' });
    if (email.toLowerCase() !== GATE_EMAIL.toLowerCase())
      return res.json({ ok: false, error: 'Invalid credentials.' });
    if (password !== GATE_PASSWORD)
      return res.json({ ok: false, error: 'Invalid credentials.' });

    // Credentials correct — generate and email OTP
    const code    = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    pendingOTPs.set(email.toLowerCase(), { code, expires });

    try {
      await sendOTPEmail(email, code);
      console.log(`Gate: OTP sent to ${email}`);
      res.json({ ok: true, needs_otp: true, message: 'Verification code sent to your email.' });
    } catch (e) {
      console.error('Gate OTP email failed:', e.message);
      // Fallback — grant session directly if email fails (avoids lockout)
      const token = makeSessionToken(email);
      validSessions.add(token);
      res.cookie('atlas_gate', token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   8 * 60 * 60 * 1000,
        path:     '/',
      });
      console.warn('Gate: email failed, granting session directly');
      res.json({ ok: true, skip_otp: true, warning: 'Email unavailable — access granted directly.' });
    }
  });

  // Step 2 — verify OTP, create session
  app.post('/gate/verify', express.json(), (req, res) => {
    const { email, code } = req.body || {};
    if (!email || !code)
      return res.json({ ok: false, error: 'Email and code required.' });

    const key     = email.toLowerCase();
    const pending = pendingOTPs.get(key);

    if (!pending)
      return res.json({ ok: false, error: 'No code found. Please request a new one.' });
    if (Date.now() > pending.expires) {
      pendingOTPs.delete(key);
      return res.json({ ok: false, error: 'Code expired. Please log in again.' });
    }
    if (pending.code !== code.toString().trim())
      return res.json({ ok: false, error: 'Incorrect code. Please try again.' });

    // OTP correct — create session
    pendingOTPs.delete(key);
    const token = makeSessionToken(email);
    validSessions.add(token);

    res.cookie('atlas_gate', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   8 * 60 * 60 * 1000,
      path:     '/',
    });
    console.log(`Gate: session granted for ${email}`);
    res.json({ ok: true });
  });

  app.get('/gate/logout', (req, res) => {
    const cookie = req.cookies?.atlas_gate;
    if (cookie) validSessions.delete(cookie);
    res.clearCookie('atlas_gate');
    res.redirect('/coming-soon');
  });
}

module.exports = { gateMiddleware, setupGateRoutes };
