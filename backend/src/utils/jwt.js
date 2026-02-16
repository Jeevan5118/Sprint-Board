const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expire });
};

const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

module.exports = { generateToken, verifyToken };
