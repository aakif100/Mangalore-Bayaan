// Authentication utility for Netlify Functions
const jwt = require('jsonwebtoken');

exports.verifyAuth = function(event) {
  const auth = event.headers.authorization || event.headers.Authorization;
  if (!auth) {
    return { valid: false, error: 'Missing authorization header' };
  }
  
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return { valid: false, error: 'Invalid authorization format' };
  }
  
  const token = parts[1];
  const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, decoded };
  } catch (err) {
    return { valid: false, error: 'Invalid token' };
  }
};

