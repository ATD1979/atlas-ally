// Atlas Ally — Auth middleware & token helpers
require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'atlas-ally-secret';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createToken(user) {
  const plan = (user.role === 'admin') ? 'premium' : user.plan;
  return jwt.sign(
    { id: user.id, whatsapp: user.whatsapp, role: user.role, plan },
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
  req.user = payload;
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
