const jwt = require('jsonwebtoken');
const path = require('path');

// Ensure dotenv is loaded if auth middleware is imported in isolation
if (!process.env.JWT_SECRET) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

module.exports = function (req, res, next) {
  let token = null;

  // Extract from Authorization header (case-insensitive check for 'Bearer <token>')
  const authHeader = req.header('Authorization') || req.header('authorization');
  if (authHeader && typeof authHeader === 'string') {
    const trimmed = authHeader.trim();
    if (/^Bearer\s+/i.test(trimmed)) {
      token = trimmed.replace(/^Bearer\s+/i, '').trim();
    } else if (!trimmed.includes(' ')) {
      token = trimmed;
    }
  }

  // Fallback to x-auth-token header
  if (!token && req.header('x-auth-token')) {
    token = String(req.header('x-auth-token')).trim();
  }

  // Sanitize token: remove quotes, detect 'undefined'/'null' literal strings
  if (token) {
    token = token.replace(/^["']+|["']+$/g, '').trim();
    if (token === 'undefined' || token === 'null' || token === '') {
      token = null;
    }
  }

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  const secret = (process.env.JWT_SECRET || '').trim();
  if (!secret) {
    console.error('[Auth Middleware] FATAL: JWT_SECRET environment variable is missing.');
    return res.status(500).json({ msg: 'Authentication configuration error' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || !decoded.user || !decoded.user.id) {
      return res.status(401).json({ msg: 'Token is not valid' });
    }
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

