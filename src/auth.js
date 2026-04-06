// Atlas Ally — Auth middleware & OTP helpers
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'atlas-ally-secret';

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create JWT token
function createToken(user) {
  return jwt.sign(
    { id: user.id, whatsapp: user.whatsapp, role: user.role, plan: user.plan },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Verify JWT token
function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

// Middleware: require any valid login
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') ||
                req.cookies?.atlas_token;
  if (!token) return res.status(401).json({ error: 'Login required' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Session expired' });

  const dbUser = payload?.id ? db.getUserById(payload.id) : null;
  if (!dbUser || dbUser.active === 0) return res.status(401).json({ error: 'Account not available' });

  req.user = {
    ...payload,
    id: dbUser.id,
    whatsapp: dbUser.whatsapp,
    role: dbUser.role,
    plan: dbUser.plan,
    verified: dbUser.verified,
    name: dbUser.name,
    email: dbUser.email,
    active: dbUser.active,
  };
  next();
}

// Middleware: require admin role
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  });
}

// Middleware: require admin or distributor
function requireDistributor(req, res, next) {
  requireAuth(req, res, () => {
    if (!['admin', 'distributor'].includes(req.user.role))
      return res.status(403).json({ error: 'Distributor access required' });
    next();
  });
}

// Soft auth — attach user if token present, don't block if not
function softAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') ||
                req.cookies?.atlas_token;
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.user = payload;
  }
  next();
}

module.exports = { generateOTP, createToken, verifyToken, requireAuth, requireAdmin, requireDistributor, softAuth };
