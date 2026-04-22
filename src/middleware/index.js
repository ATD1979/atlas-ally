// Atlas Ally — Shared middleware
const rateLimit = require('express-rate-limit');
const slowDown  = require('express-slow-down');
const db        = require('../db');

// ── Rate limiters ─────────────────────────────────────────────────────────────

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

const apiSlowDown = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 30,
  delayMs: hits => (hits - 30) * 200,
  maxDelayMs: 5000,
});

// ── Request logging for forensics ─────────────────────────────────────────────
//
// Previously this middleware blocked specific User-Agent strings (curl/, axios/,
// python-requests, etc.). That was security theater — any attacker trivially
// sets UA to "Mozilla/5.0 ..." and the check is moot. Meanwhile it broke
// legitimate tooling (uptime monitors, mobile apps using axios, debugging
// with curl).
//
// Retained: logging of unauthenticated API requests with no valid Referer.
// Patterns in suspicious_request logs are more valuable for forensics than
// real-time blocking ever was.

function apiFingerprint(req, res, next) {
  const ua      = req.headers['user-agent'] || '';
  const referer = req.headers['referer']    || '';
  const hasValidReferer = referer.includes('atlas-ally.com') || referer.includes('localhost');
  const hasAuth         = !!req.headers.authorization;

  if (!hasAuth && !hasValidReferer && req.path.startsWith('/api/')) {
    try {
      db.logError.run({
        type: 'suspicious_request',
        message: `Unauthenticated API access: ${req.method} ${req.path}`,
        stack: `UA: ${ua.slice(0, 100)} | IP: ${req.ip}`,
        user_id: null, endpoint: req.path,
      });
    } catch {}
  }
  next();
}

// ── Security headers ──────────────────────────────────────────────────────────

function securityHeaders(req, res, next) {
  res.setHeader('X-Frame-Options',           'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options',    'nosniff');
  res.setHeader('Referrer-Policy',           'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection',          '1; mode=block');
  if (req.path.startsWith('/api/')) {
    res.setHeader('X-Robots-Tag',  'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  next();
}

// ── Error logging helper (attached to req) ────────────────────────────────────

function attachErrorLogger(req, res, next) {
  req.logErr = (type, err) => {
    try {
      db.logError.run({
        type, message: err.message || String(err),
        stack: err.stack || null,
        user_id:  req.user?.id   || null,
        endpoint: req.path       || null,
      });
    } catch {}
  };
  next();
}

module.exports = { apiLimiter, authLimiter, apiSlowDown, apiFingerprint, securityHeaders, attachErrorLogger };
