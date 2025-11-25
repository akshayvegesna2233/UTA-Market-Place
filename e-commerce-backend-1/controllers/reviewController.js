// controllers/reviewController.js
const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Create a new review
 * @route   POST /api/reviews
 * @access  Private
 */
exports.createReview = async (req, res, next) => {
    try {
        const { productId, sellerId, rating, comment } = req.body;
        const userId = req.user.id;

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return next(new ApiError('Rating must be between 1 and 5', 400));
        }

        // Check if seller exists
        const seller = await User.findById(sellerId);
        if (!seller) {
            return next(new ApiError('Seller not found', 404));
        }

        // Check if product exists (if provided)
        if (productId) {
            const product = await Product.findById(productId);
            if (!product) {
                return next(new ApiError('Product not found', 404));
            }

            // Check if product belongs to seller
            if (product.seller_id !== sellerId) {
                return next(new ApiError('Product does not belong to specified seller', 400));
            }

            // Check if user has purchased the product
            const hasPurchased = await Review.hasUserPurchasedProduct(userId, productId);
            if (!hasPurchased) {
                return next(
                    new ApiError('You can only review products you have purchased', 403)
                );
            }

            // Check if user has already reviewed this product
            const hasReviewed = await Review.hasUserReviewedProduct(userId, productId);
            if (hasReviewed) {
                return next(
                    new ApiError('You have already reviewed this product', 400)
                );
            }
        }

        // Create review
        const reviewData = {
            reviewerId: userId,
            productId,
            sellerId,
            rating,
            comment
        };

        const reviewId = await Review.create(reviewData);

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            reviewId
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get reviews for a seller
 * @route   GET /api/reviews/seller/:id
 * @access  Public
 */
exports.getSellerReviews = async (req, res, next) => {
    try {
        const sellerId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Check if seller exists
        const seller = await User.findById(sellerId);
        if (!seller) {
            return next(new ApiError('Seller not found', 404));
        }

        // Get reviews
        const reviews = await Review.getSellerReviews(sellerId, limit, offset);

        // Get total count
        const total = await Review.countSellerReviews(sellerId);

        // Get rating statistics
        const ratingStats = await Review.getSellerRatingStats(sellerId);

        // Calculate total pages
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            count: reviews.length,
            totalReviews: total,
            totalPages,
            currentPage: page,
            ratingStats,
            reviews
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get reviews for a product
 * @route   GET /api/reviews/product/:id
 * @access  Public
 */
exports.getProductReviews = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return next(new ApiError('Product not found', 404));
        }

        // Get reviews
        const reviews = await Review.getProductReviews(productId, limit, offset);

        // Get total count
        const total = await Review.countProductReviews(productId);

        // Calculate total pages
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            count: reviews.length,
            totalReviews: total,
            totalPages,
            currentPage: page,
            reviews
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
exports.updateReview = async (req, res, next) => {
    try {
        const reviewId = req.params.id;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        // Validate rating
        if (rating && (rating < 1 || rating > 5)) {
            return next(new ApiError('Rating must be between 1 and 5', 400));
        }

        // Check if review exists
        const review = await Review.findById(reviewId);
        if (!review) {
            return next(new ApiError('Review not found', 404));
        }

        // Check if user is the reviewer
        if (review.reviewer_id !== userId && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to update this review', 403));
        }

        // Update review
        const updated = await Review.update(reviewId, { rating, comment });

        if (!updated) {
            return next(new ApiError('Failed to update review', 500));
        }

        res.status(200).json({
            success: true,
            message: 'Review updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
exports.deleteReview = async (req, res, next) => {
    try {
        const reviewId = req.params.id;
        const userId = req.user.id;

        // Check if review exists
        const review = await Review.findById(reviewId);
        if (!review) {
            return next(new ApiError('Review not found', 404));
        }

        // Check if user is the reviewer or admin
        if (review.reviewer_id !== userId && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to delete this review', 403));
        }

        // Delete review
        const deleted = await Review.delete(reviewId);

        if (!deleted) {
            return next(new ApiError('Failed to delete review', 500));
        }

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user's review for a product
 * @route   GET /api/reviews/user/:userId/product/:productId
 * @access  Private
 */
exports.getUserReviewForProduct = async (req, res, next) => {
    try {
        const { userId, productId } = req.params;

        // Check authorization
        if (req.user.id.toString() !== userId && req.user.role !== 'admin') {
            return next(
                new ApiError('Not authorized to view this user\'s review', 403)
            );
        }

        // Get review
        const review = await Review.getUserReviewForProduct(userId, productId);

        res.status(200).json({
            success: true,
            hasReview: !!review,
            review
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Check if user can review a product
 * @route   GET /api/reviews/check-eligibility/:productId
 * @access  Private
 */
exports.checkReviewEligibility = async (req, res, next) => {
    try {
        const productId = req.params.productId;
        const userId = req.user.id;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return next(new ApiError('Product not found', 404));
        }

        // Check if user has purchased the product
        const hasPurchased = await Review.hasUserPurchasedProduct(userId, productId);

        // Check if user has already reviewed the product
        const hasReviewed = await Review.hasUserReviewedProduct(userId, productId);

        res.status(200).json({
            success: true,
            canReview: hasPurchased && !hasReviewed,
            hasPurchased,
            hasReviewed
        });
    } catch (error) {
        next(error);
    }
};