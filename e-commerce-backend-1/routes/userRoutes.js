// userRoutes.js - User profile routes
const express = require('express');
const {
    getUserProfile, updateProfile, uploadAvatar,
    getUserListings, getUserSales, deleteUser
} = require('../controllers/userController');
const { protect, verifyOwnership } = require('../middleware/auth');

const router = express.Router();

// Get user profile is public, others require authentication
router.get('/:id', getUserProfile);
router.put('/:id', protect, verifyOwnership((req) => req.params.id), updateProfile);
router.post('/:id/avatar', protect, verifyOwnership((req) => req.params.id), uploadAvatar);
router.get('/:id/listings', getUserListings);
router.get('/:id/sales', protect, verifyOwnership((req) => req.params.id), getUserSales);
router.delete('/:id', protect, verifyOwnership((req) => req.params.id), deleteUser);

module.exports = router;
