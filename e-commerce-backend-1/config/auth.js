// config/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file';

// JWT expiration (in seconds)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Token types
const TOKEN_TYPES = {
    ACCESS: 'access',
    REFRESH: 'refresh',
    EMAIL_VERIFICATION: 'email_verification',
    PASSWORD_RESET: 'password_reset'
};

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} type - Token type
 * @param {string|number} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
const generateToken = (payload, type = TOKEN_TYPES.ACCESS, expiresIn = JWT_EXPIRES_IN) => {
    // Add token type to payload
    const tokenPayload = { ...payload, type };

    return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error('Token verification error:', error.message);
        return null;
    }
};

/**
 * Generate email verification token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateEmailVerificationToken = (user) => {
    return generateToken(
        { id: user.id, email: user.email },
        TOKEN_TYPES.EMAIL_VERIFICATION,
        '48h' // 48 hours expiration
    );
};

/**
 * Generate password reset token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generatePasswordResetToken = (user) => {
    return generateToken(
        { id: user.id, email: user.email },
        TOKEN_TYPES.PASSWORD_RESET,
        '1h' // 1 hour expiration
    );
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateRefreshToken = (user) => {
    return generateToken(
        { id: user.id },
        TOKEN_TYPES.REFRESH,
        '7d' // 7 days expiration
    );
};

/**
 * Extract token from authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} JWT token or null if invalid
 */
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.split(' ')[1];
};

module.exports = {
    JWT_SECRET,
    JWT_EXPIRES_IN,
    TOKEN_TYPES,
    generateToken,
    verifyToken,
    generateEmailVerificationToken,
    generatePasswordResetToken,
    generateRefreshToken,
    extractTokenFromHeader
};