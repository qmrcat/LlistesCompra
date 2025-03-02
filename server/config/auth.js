const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'comprajunts_secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

// Generar token JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      alias: user.alias
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

// Verificar token JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET
};