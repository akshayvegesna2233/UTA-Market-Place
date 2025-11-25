// controllers/authController.js
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const {
    generateToken,
    generateEmailVerificationToken,
    generatePasswordResetToken
} = require('../config/auth');
const {
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail
} = require('../services/emailService');
const { ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Validate UTA email
        if (!email.endsWith('@mavs.uta.edu')) {
            return next(
                new ApiError('Please use your UTA email address (@mavs.uta.edu)', 400)
            );
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return next(
                new ApiError('User already exists with this email address', 400)
            );
        }

        // Create user
        const userId = await User.create({
            firstName,
            lastName,
            email,
            password
        });

        // Generate verification token
        const user = await User.findById(userId);
        const verificationToken = generateEmailVerificationToken(user);

        // Send welcome email with verification link
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        //await sendWelcomeEmail(user, verificationUrl);

        // Generate auth token
        const token = generateToken({ id: userId, email, role: user.role });

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify your email address.',
            token,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findByEmail(email);
        if (!user) {
            return next(new ApiError('Invalid credentials', 401));
        }

        // Check if password is correct
        const isMatch = await User.validatePassword(password, user.password);
        if (!isMatch) {
            return next(new ApiError('Invalid credentials', 401));
        }

        // Check if user is active
        if (user.status !== 'active') {
            return next(new ApiError('Your account is currently inactive or suspended', 403));
        }

        // Generate token
        const token = generateToken({ id: user.id, email: user.email, role: user.role });

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
    try {
        // User is already available in req.user from auth middleware
        const user = req.user;

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                role: user.role,
                status: user.status,
                joinDate: user.join_date,
                streetAddress: user.street_address,
                city: user.city,
                state: user.state,
                zipCode: user.zip_code,
                notifications: {
                    emailAlerts: user.email_alerts,
                    textAlerts: user.text_alerts,
                    newMessageNotifications: user.new_message_notifications,
                    newListingNotifications: user.new_listing_notifications,
                    marketingEmails: user.marketing_emails
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Verify email address
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
exports.verifyEmail = async (req, res, next) => {
    try {
        const decoded = req.emailVerification;

        // Check if user exists
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        // Set user status to active (if not already)
        if (user.status !== 'active') {
            await User.updateStatus(user.id, 'active');
        }

        res.status(200).json({
            success: true,
            message: 'Email verification successful'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Private
 */
exports.resendVerification = async (req, res, next) => {
    try {
        // User is already available in req.user from auth middleware
        const user = req.user;

        // Generate verification token
        const verificationToken = generateEmailVerificationToken(user);

        // Send verification email
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        await sendVerificationEmail(user, verificationUrl);

        res.status(200).json({
            success: true,
            message: 'Verification email has been sent'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findByEmail(email);
        if (!user) {
            return next(new ApiError('No user found with this email address', 404));
        }

        // Generate password reset token
        const resetToken = generatePasswordResetToken(user);

        // Send password reset email
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        await sendPasswordResetEmail(user, resetUrl);

        res.status(200).json({
            success: true,
            message: 'Password reset email has been sent'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
    try {
        const { password } = req.body;
        const decoded = req.passwordReset;

        // Check if user exists
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        // Update password
        await User.updatePassword(user.id, password);

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Change password
 * @route   POST /api/auth/change-password
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = req.user;

        // Get user with password
        const userWithPassword = await User.findByEmail(user.email);

        // Verify current password
        const isMatch = await User.validatePassword(currentPassword, userWithPassword.password);
        if (!isMatch) {
            return next(new ApiError('Current password is incorrect', 401));
        }

        // Update password
        await User.updatePassword(user.id, newPassword);
        console.log(newPassword);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Direct password reset (no email verification)
 * @route   POST /api/auth/direct-reset
 * @access  Public
 */
exports.directPasswordReset = async (req, res, next) => {
    try {
        const { email, newPassword } = req.body;

        // Check if user exists
        const user = await User.findByEmail(email);
        if (!user) {
            return next(new ApiError('No user found with this email address', 404));
        }

        // Validate password (you could add more validation)
        if (!newPassword || newPassword.length < 8) {
            return next(new ApiError('Password must be at least 8 characters long', 400));
        }

        // Update password
        await User.updatePassword(user.id, newPassword);

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Logout user (client-side only)
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};