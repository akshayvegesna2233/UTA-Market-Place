// src/services/reviewService.js
import apiClient from './api';

const reviewService = {
    // Create a new review
    createReview: async (reviewData) => {
        return await apiClient.post('/reviews', reviewData);
    },

    // Get reviews for a seller
    getSellerReviews: async (sellerId, page = 1, limit = 10) => {
        return await apiClient.get(`/reviews/seller/${sellerId}`, {
            params: { page, limit }
        });
    },

    // Get reviews for a product
    getProductReviews: async (productId, page = 1, limit = 10) => {
        return await apiClient.get(`/reviews/product/${productId}`, {
            params: { page, limit }
        });
    },

    // Update a review
    updateReview: async (reviewId, reviewData) => {
        return await apiClient.put(`/reviews/${reviewId}`, reviewData);
    },

    // Delete a review
    deleteReview: async (reviewId) => {
        return await apiClient.delete(`/reviews/${reviewId}`);
    },

    // Get user's review for a product
    getUserReviewForProduct: async (userId, productId) => {
        return await apiClient.get(`/reviews/user/${userId}/product/${productId}`);
    },

    // Check if user is eligible to review a product
    checkReviewEligibility: async (productId) => {
        return await apiClient.get(`/reviews/check-eligibility/${productId}`);
    }
};

export default reviewService;