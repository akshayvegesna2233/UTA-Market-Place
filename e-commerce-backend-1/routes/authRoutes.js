const express = require('express');
const {
    register, login, getMe, verifyEmail,
    resendVerification, forgotPassword, resetPassword,
    changePassword, logout, directPasswordReset
} = require('../controllers/authController');
const { protect, verifyEmailToken, verifyPasswordResetToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/verify-email/:token', verifyEmailToken, verifyEmail);
router.post('/resend-verification', protect, resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', verifyPasswordResetToken, resetPassword);
router.post('/change-password', protect, changePassword);
router.post('/logout', protect, logout);
router.post('/direct-reset', directPasswordReset);

module.exports = router;