// middleware/auth.js
const { verifyToken, extractTokenFromHeader } = require('../config/auth');
const User = require('../models/User');

/**
 * Middleware to protect routes by verifying JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protect = async (req, res, next) => {
    try {
        // Get token from header
        const token = extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            return res.status(401).json({ message: 'Not authorized to access this route' });
        }

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({ message: 'Token is invalid or expired' });
        }

        // Check if token is the right type
        if (decoded.type !== 'access') {
            return res.status(401).json({ message: 'Invalid token type' });
        }

        // Check if user still exists
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(403).json({ message: 'Your account is not active' });
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
};

/**
 * Middleware to restrict access to routes based on user role
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'You do not have permission to perform this action' });
        }

        next();
    };
};

/**
 * Middleware to verify ownership of a resource
 * @param {Function} getOwnerId - Function to get owner ID from request
 * @param {string} errorMessage - Custom error message
 * @returns {Function} Middleware function
 */
const verifyOwnership = (getOwnerId, errorMessage = 'You do not have permission to perform this action') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            // Admin can access any resource
            if (req.user.role === 'admin') {
                return next();
            }

            // Get owner ID
            const ownerId = await getOwnerId(req);

            // Check ownership
            if (req.user.id.toString() !== ownerId.toString()) {
                return res.status(403).json({ message: errorMessage });
            }

            next();
        } catch (error) {
            console.error('Ownership verification error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

/**
 * Middleware to verify email token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyEmailToken = (req, res, next) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Check if token is the right type
        if (decoded.type !== 'email_verification') {
            return res.status(400).json({ message: 'Invalid token type' });
        }

        // Add decoded data to request
        req.emailVerification = decoded;
        next();
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(400).json({ message: 'Email verification failed' });
    }
};

/**
 * Middleware to verify password reset token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyPasswordResetToken = (req, res, next) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Check if token is the right type
        if (decoded.type !== 'password_reset') {
            return res.status(400).json({ message: 'Invalid token type' });
        }

        // Add decoded data to request
        req.passwordReset = decoded;
        next();
    } catch (error) {
        console.error('Password reset verification error:', error);
        res.status(400).json({ message: 'Password reset verification failed' });
    }
};

module.exports = {
    protect,
    restrictTo,
    verifyOwnership,
    verifyEmailToken,
    verifyPasswordResetToken
};