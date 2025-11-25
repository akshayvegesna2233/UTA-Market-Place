// reviewRoutes.js - Review management routes
const express = require('express');
const Review = require('../models/Review');

const {
    createReview, getSellerReviews, getProductReviews,
    updateReview, deleteReview, getUserReviewForProduct, checkReviewEligibility
} = require('../controllers/reviewController');
const { protect, verifyOwnership } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/seller/:id', getSellerReviews);
router.get('/product/:id', getProductReviews);

// Protected routes
router.post('/', protect, createReview);
router.put('/:id', protect, verifyOwnership(async (req) => {
    const review = await Review.findById(req.params.id);
    return review ? review.reviewer_id : null;
}), updateReview);
router.delete('/:id', protect, verifyOwnership(async (req) => {
    const review = await Review.findById(req.params.id);
    return review ? review.reviewer_id : null;
}), deleteReview);
router.get('/user/:userId/product/:productId', protect, verifyOwnership((req) => req.params.userId), getUserReviewForProduct);
router.get('/check-eligibility/:productId', protect, checkReviewEligibility);

module.exports = router;