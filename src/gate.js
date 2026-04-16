// Atlas Ally — Preview Gate (password-only until DNS propagates for email OTP)
'use strict';

const crypto = require('crypto');
const path   = require('path');

const GATE_EMAIL    = 'info@atlas-ally.com';
const GATE_PASSWORD = process.env.GATE_PASSWORD || 'TravelGuardian0405';
const SESSION_SECRET = process.env.GATE_SECRET  || 'atlas-gate-secret-2026';

const validSessions = new Set();

function makeSessionToken(email) {
  const payload = `${email}:${Date.now()}:${SESSION_SECRET}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

const PUBLIC_PATHS = [
  '/gate', '/gate/login', '/gate/logout', '/coming-soon', '/favicon.ico',
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

  // Single-step login — password only (OTP via email coming once DNS propagates)
  app.post('/gate/login', express.json(), (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.json({ ok: false, error: 'Email and password required.' });
    if (email.toLowerCase() !== GATE_EMAIL.toLowerCase())
      return res.json({ ok: false, error: 'Invalid credentials.' });
    if (password !== GATE_PASSWORD)
      return res.json({ ok: false, error: 'Invalid credentials.' });

    // Password correct — set session immediately (no OTP until DNS resolves)
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
    res.json({ ok: true, skip_otp: true });
  });

  // OTP verify endpoint kept for future use (no-op for now)
  app.post('/gate/verify', express.json(), (req, res) => {
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
