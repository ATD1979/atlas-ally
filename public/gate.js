// Atlas Ally — Preview Gate
// Protects the app behind email/password + email OTP (2FA)
// Public routes: /gate, /gate/login, /gate/verify, /coming-soon, static assets
// Everything else requires gate session cookie

'use strict';

const crypto    = require('crypto');
const path      = require('path');
const nodemailer = require('nodemailer');

// ── Config ────────────────────────────────────────────────────────────────────
const GATE_EMAIL    = 'info@atlas-ally.com';
const GATE_PASSWORD = process.env.GATE_PASSWORD || 'TravelGuardian0405';
const SESSION_SECRET = process.env.GATE_SECRET  || 'atlas-gate-secret-2026';
const OTP_EXPIRY_MS  = 10 * 60 * 1000; // 10 minutes

// ── In-memory OTP store (Railway restarts clear this — that's fine) ────────────
const otpStore = new Map(); // email → { code, expires }

// ── Session token helpers ─────────────────────────────────────────────────────
function makeSessionToken(email) {
  const payload = `${email}:${Date.now()}:${SESSION_SECRET}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// Valid sessions (survives the process lifetime)
const validSessions = new Set();

// ── SMTP mailer (ImprovMX) ────────────────────────────────────────────────────
function getMailer() {
  return nodemailer.createTransport({
    host:   'smtp.improvmx.com',
    port:   587,
    secure: false,
    auth: {
      user: 'info@atlas-ally.com',
      pass: process.env.IMPROVMX_PASSWORD || '',
    },
    tls: { rejectUnauthorized: false },
  });
}

async function sendOTP(toEmail, code) {
  // Always send to the gate email regardless of who's logging in
  const mailer = getMailer();
  await mailer.sendMail({
    from:    '"Atlas Ally" <info@atlas-ally.com>',
    to:      GATE_EMAIL,
    subject: `Atlas Ally Preview — Your verification code: ${code}`,
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:400px;margin:0 auto;padding:32px 24px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:40px">🌍</div>
          <h2 style="color:#1A2332;margin:8px 0 4px">Atlas Ally Preview</h2>
          <p style="color:#6B7C93;font-size:14px;margin:0">Verification Code</p>
        </div>
        <div style="background:#E0F2F7;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <div style="font-family:monospace;font-size:36px;font-weight:800;letter-spacing:10px;color:#0E7490">${code}</div>
          <p style="color:#6B7C93;font-size:13px;margin:10px 0 0">Expires in 10 minutes</p>
        </div>
        <p style="color:#6B7C93;font-size:12px;text-align:center">
          If you didn't request this, someone may be trying to access Atlas Ally preview.
        </p>
      </div>
    `,
  });
}

// ── Gate middleware ───────────────────────────────────────────────────────────
const PUBLIC_PATHS = [
  '/gate', '/gate/login', '/gate/verify', '/gate/logout',
  '/coming-soon',
  '/favicon.ico', '/apple-touch-icon.png',
];

const PUBLIC_PREFIXES = [
  '/api/', // API routes have their own auth
];

function isPublic(req) {
  const p = req.path;
  if (PUBLIC_PATHS.includes(p)) return true;
  if (PUBLIC_PREFIXES.some(prefix => p.startsWith(prefix))) return true;
  // Static assets
  if (/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|map)$/.test(p)) return true;
  return false;
}

function gateMiddleware(req, res, next) {
  if (isPublic(req)) return next();

  const cookie = req.cookies?.atlas_gate;
  if (cookie && validSessions.has(cookie)) return next();

  // Not authenticated — show coming soon for browsers, 401 for others
  const accept = req.headers.accept || '';
  if (accept.includes('text/html')) {
    return res.redirect('/coming-soon');
  }
  return res.status(401).json({ error: 'Preview access required' });
}

// ── Gate route handlers ───────────────────────────────────────────────────────
function setupGateRoutes(app) {
  const express = require('express');

  // Coming soon page
  app.get('/coming-soon', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'coming-soon.html'));
  });

  // Gate login page
  app.get('/gate', (req, res) => {
    const cookie = req.cookies?.atlas_gate;
    if (cookie && validSessions.has(cookie)) return res.redirect('/');
    res.sendFile(path.join(__dirname, '..', 'public', 'gate.html'));
  });

  // Step 1: verify password, send OTP
  app.post('/gate/login', express.json(), async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.json({ ok: false, error: 'Email and password required.' });
    }

    if (email.toLowerCase() !== GATE_EMAIL.toLowerCase()) {
      return res.json({ ok: false, error: 'Invalid credentials.' });
    }

    if (password !== GATE_PASSWORD) {
      return res.json({ ok: false, error: 'Invalid credentials.' });
    }

    // Generate 6-digit OTP
    const code    = String(Math.floor(100000 + Math.random() * 900000));
    const expires = Date.now() + OTP_EXPIRY_MS;
    otpStore.set(email.toLowerCase(), { code, expires });

    try {
      await sendOTP(email, code);
      console.log(`Gate OTP sent to ${GATE_EMAIL}`);
      res.json({ ok: true });
    } catch(e) {
      console.error('Gate OTP email failed:', e.message);
      // Still return ok — show the code in logs for dev fallback
      console.log(`[GATE OTP FALLBACK] Code for ${email}: ${code}`);
      res.json({ ok: true, fallback: true });
    }
  });

  // Step 2: verify OTP, set session cookie
  app.post('/gate/verify', express.json(), (req, res) => {
    const { email, code } = req.body || {};
    if (!email || !code) return res.json({ ok: false, error: 'Missing fields.' });

    const stored = otpStore.get(email.toLowerCase());
    if (!stored) return res.json({ ok: false, error: 'No code requested. Please start over.' });
    if (Date.now() > stored.expires) {
      otpStore.delete(email.toLowerCase());
      return res.json({ ok: false, error: 'Code expired. Please request a new one.' });
    }
    if (stored.code !== code.trim()) {
      return res.json({ ok: false, error: 'Incorrect code. Please try again.' });
    }

    otpStore.delete(email.toLowerCase());

    const token = makeSessionToken(email);
    validSessions.add(token);

    // Session cookie: 8 hours, secure in production
    res.cookie('atlas_gate', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   8 * 60 * 60 * 1000,
      path:     '/',
    });

    res.json({ ok: true });
  });

  // Logout
  app.get('/gate/logout', (req, res) => {
    const cookie = req.cookies?.atlas_gate;
    if (cookie) validSessions.delete(cookie);
    res.clearCookie('atlas_gate');
    res.redirect('/coming-soon');
  });
}

module.exports = { gateMiddleware, setupGateRoutes };
