// Atlas Ally — Preview Gate (full email OTP — DNS verified green)
// v2026.04.27 — PR #27 gate hardening (rate limit, attempts counter,
// timing-safe compare, periodic sweep)
'use strict';

const crypto       = require('crypto');
const path         = require('path');
const nodemailer   = require('nodemailer');
const rateLimit    = require('express-rate-limit');
const config       = require('./config');
const { verifyToken } = require('./auth');

const GATE_EMAIL     = 'info@atlas-ally.com';
const GATE_PASSWORD  = config.GATE_PASSWORD;
const SMTP_PASSWORD  = config.IMPROVMX_PASSWORD;
// Note: GATE_SECRET is no longer consumed here — makeSessionToken() uses
// crypto.randomBytes. The env var can be kept in Railway for now; a future
// cleanup can make it optional/remove it from config.js.

// In-memory stores (fine for a single-instance preview gate)
const validSessions = new Set();
const pendingOTPs   = new Map(); // email → { code, expires, attempts }

// Hardening constants
const OTP_TTL_MS         = 10 * 60 * 1000;  // 10 minutes
const MAX_OTP_ATTEMPTS   = 5;
const SWEEP_INTERVAL_MS  = 5 * 60 * 1000;   // 5 minutes

// ── SMTP transport via ImprovMX with defensive timeouts ──────────────────────
const transporter = nodemailer.createTransport({
  host:   'smtp.improvmx.com',
  port:   587,
  secure: false,
  auth: {
    user: GATE_EMAIL,
    pass: SMTP_PASSWORD,
  },
  // Add connection timeouts to prevent hanging
  connectionTimeout: 15000,   // 15s to establish connection
  greetingTimeout:   10000,   // 10s for server greeting
  socketTimeout:     20000,   // 20s for socket inactivity
});

// ── Rate limiter for gate endpoints ──────────────────────────────────────────
// 10 requests per 15 minutes per IP, applied to /gate/login and /gate/verify.
// Without this, a 6-digit OTP is brute-forceable in ~17 minutes. With it,
// the same brute-force takes >100 days at the rate-limit ceiling.
const gateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,   // RateLimit-* response headers
  legacyHeaders:   false,  // disable X-RateLimit-* (deprecated)
  message:         { ok: false, error: 'Too many attempts. Try again in 15 minutes.' },
});

// ── Timing-safe equality for secrets ─────────────────────────────────────────
// crypto.timingSafeEqual throws on length mismatch — guard against that.
// Always compare buffers of equal length to avoid leaking length info.
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

async function sendOTPEmail(toEmail, code) {
  console.log(`Gate: Attempting to send OTP to ${toEmail} via ImprovMX...`);

  // Wrap the entire send operation in a promise race with timeout
  const sendPromise = transporter.sendMail({
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

  // Add a 25-second timeout as last resort
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Email send timeout after 25 seconds')), 25000);
  });

  try {
    await Promise.race([sendPromise, timeoutPromise]);
    console.log(`Gate: OTP email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error(`Gate: Email send failed to ${toEmail}:`, error.message);
    throw error; // Re-throw so caller can handle
  }
}

function makeSessionToken() {
  // Cryptographically random, 256 bits of entropy.
  // Session validity is tracked by the validSessions Set in memory —
  // the token is just a high-entropy key, no structure needed.
  return crypto.randomBytes(32).toString('hex');
}

// ── Periodic sweep of expired pendingOTPs ────────────────────────────────────
// Every 5 minutes, drop entries whose `expires` is in the past. Without this,
// expired entries accumulate forever — small leak, but bounded leak class
// matters more than the size. .unref() so the interval doesn't keep the
// event loop alive on SIGTERM.
const sweepHandle = setInterval(() => {
  const now = Date.now();
  let removed = 0;
  for (const [key, entry] of pendingOTPs.entries()) {
    if (now > entry.expires) {
      pendingOTPs.delete(key);
      removed++;
    }
  }
  if (removed > 0) console.log(`Gate: swept ${removed} expired OTP entr${removed === 1 ? 'y' : 'ies'}`);
}, SWEEP_INTERVAL_MS);
sweepHandle.unref();

const PUBLIC_PATHS = [
  '/gate', '/gate/login', '/gate/verify', '/gate/logout',
  '/coming-soon', '/favicon.ico',
  '/login.html', '/signup.html',
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
  // User auth bypass: once a user has logged in via WhatsApp OTP, the atlas_token
  // cookie (signed JWT) grants gate access too. Without this, post-login redirect
  // to '/' bounces straight back to /coming-soon.
  const userToken = req.cookies?.atlas_token;
  if (userToken && verifyToken(userToken)) return next();
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
  app.post('/gate/login', gateLimiter, express.json(), async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.json({ ok: false, error: 'Email and password required.' });
    if (email.toLowerCase() !== GATE_EMAIL.toLowerCase())
      return res.json({ ok: false, error: 'Invalid credentials.' });
    if (!safeCompare(password, GATE_PASSWORD))
      return res.json({ ok: false, error: 'Invalid credentials.' });

    // Credentials correct — generate and email OTP
    const code    = generateOTP();
    const expires = Date.now() + OTP_TTL_MS;
    pendingOTPs.set(email.toLowerCase(), { code, expires, attempts: 0 });

    try {
      await sendOTPEmail(email, code);
      console.log(`Gate: OTP sent to ${email}`);
      res.json({ ok: true, needs_otp: true, message: 'Verification code sent to your email.' });
    } catch (e) {
      console.error('Gate OTP email failed:', e.message);

      // Log more details for debugging
      if (e.code) console.error(`Gate: SMTP Error code: ${e.code}`);
      if (e.response) console.error(`Gate: SMTP Response: ${e.response}`);

      // Return specific error instead of fallback session
      let errorMsg = 'Email service temporarily unavailable. ';
      if (e.message.includes('timeout')) {
        errorMsg += 'Connection timed out - please try again.';
      } else if (e.message.includes('Invalid login') || e.code === 'EAUTH') {
        errorMsg += 'SMTP authentication failed - check credentials.';
      } else if (e.code === 'ENOTFOUND' || e.code === 'ECONNREFUSED') {
        errorMsg += 'Cannot reach email server - network issue.';
      } else {
        errorMsg += 'Please try again or contact support.';
      }

      res.json({ ok: false, error: errorMsg });
    }
  });

  // Step 2 — verify OTP, create session
  app.post('/gate/verify', gateLimiter, express.json(), (req, res) => {
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

    // Timing-safe OTP comparison. Increment attempts on mismatch; invalidate
    // the pending entry after MAX_OTP_ATTEMPTS so an attacker can't keep
    // guessing against a single pending session.
    const submitted = code.toString().trim();
    if (!safeCompare(submitted, pending.code)) {
      pending.attempts = (pending.attempts || 0) + 1;
      if (pending.attempts >= MAX_OTP_ATTEMPTS) {
        pendingOTPs.delete(key);
        console.log(`Gate: OTP invalidated for ${email} after ${MAX_OTP_ATTEMPTS} failed attempts`);
        return res.json({ ok: false, error: 'Too many incorrect attempts. Please log in again.' });
      }
      return res.json({ ok: false, error: 'Incorrect code. Please try again.' });
    }

    // OTP correct — create session
    pendingOTPs.delete(key);
    const token = makeSessionToken();
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
