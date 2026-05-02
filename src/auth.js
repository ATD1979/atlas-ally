// Atlas Ally — Auth middleware & token helpers
// v2026.04.15 — clean slate
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('./db');
const config = require('./config');

const JWT_SECRET = config.JWT_SECRET;

function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, whatsapp: user.whatsapp, role: user.role, plan: user.plan },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.atlas_token;
  if (!token) return res.status(401).json({ error: 'Login required' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Session expired' });

  // Re-validate against DB on every authenticated request:
  //   - active=1: deactivated users (admin action OR /unsubscribe?wa=) lose
  //     access immediately instead of keeping it for up to 30d via JWT.
  //   - role: refreshed from DB so a demoted admin loses elevated privileges
  //     immediately. Plan/whatsapp/id stay from the JWT payload.
  // (PR #38, closes N19)
  const dbUser = db.getUserById(payload.id);
  if (!dbUser || dbUser.active !== 1) {
    return res.status(401).json({ error: 'Session expired' });
  }

  req.user = { ...payload, role: dbUser.role };
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  });
}

function requireDistributor(req, res, next) {
  requireAuth(req, res, () => {
    if (!['admin', 'distributor'].includes(req.user.role))
      return res.status(403).json({ error: 'Distributor access required' });
    next();
  });
}

function softAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.atlas_token;
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.user = payload;
  }
  next();
}

module.exports = { generateOTP, createToken, verifyToken, requireAuth, requireAdmin, requireDistributor, softAuth };
