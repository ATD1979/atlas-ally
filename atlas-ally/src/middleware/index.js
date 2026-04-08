// Atlas Ally — Shared middleware
const rateLimit = require('express-rate-limit');
const slowDown  = require('express-slow-down');
const db        = require('../db');

// ── Rate limiters ─────────────────────────────────────────────────────────────

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
});

// Auth routes need a generous limit — mobile users on retry loops hit 20 fast
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });

const apiSlowDown = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 30,
  delayMs: hits => (hits - 30) * 200,
  maxDelayMs: 5000,
});

// ── Bot / scraper fingerprinting ──────────────────────────────────────────────

const BLOCKED_AGENTS = ['python-requests', 'curl/', 'wget/', 'scrapy', 'httpclient', 'okhttp', 'axios/'];

// Auth routes are always exempt — login requests have no token or referer by definition
const AUTH_PATHS = ['/api/auth/send-otp', '/api/auth/verify-otp', '/api/auth/signup', '/api/auth/admin-login'];

function apiFingerprint(req, res, next) {
  // Never fingerprint-block auth endpoints
  if (AUTH_PATHS.some(p => req.path.startsWith(p))) return next();

  const ua      = req.headers['user-agent'] || '';
  const referer = req.headers['referer']    || '';
  const isBot   = BLOCKED_AGENTS.some(b => ua.toLowerCase().includes(b));

  const hasValidReferer = referer.includes('atlas-ally.com') || referer.includes('localhost');
  const hasAuth         = !!req.headers.authorization;

  // Only hard-block confirmed bots with no auth and no valid referer
  if (isBot && !hasAuth && !hasValidReferer)
    return res.status(403).json({ error: 'Access denied' });

  // Log suspicious unauthenticated access (don't block — just log)
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
