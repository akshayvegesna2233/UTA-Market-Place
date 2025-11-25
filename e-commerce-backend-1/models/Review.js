// models/Review.js
const { pool } = require('../config/database');
const User = require('./User');

class Review {
    /**
     * Create a new review
     * @param {Object} reviewData - Review data
     * @returns {Promise<number>} - ID of created review
     */
    static async create(reviewData) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const { reviewerId, productId, sellerId, rating, comment } = reviewData;

            // Insert review
            const [result] = await connection.execute(
                'INSERT INTO reviews (reviewer_id, product_id, seller_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
                [reviewerId, productId, sellerId, rating, comment]
            );

            // Update seller rating
            await User.updateRating(sellerId);

            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            console.error('Error creating review:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Find a review by ID
     * @param {number} id - Review ID
     * @returns {Promise<Object|null>} - Review object or null if not found
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT r.*,
         u.first_name as reviewer_first_name, u.last_name as reviewer_last_name, u.avatar as reviewer_avatar,
         p.name as product_name
         FROM reviews r
         JOIN users u ON r.reviewer_id = u.id
         LEFT JOIN products p ON r.product_id = p.id
         WHERE r.id = ?`,
                [id]
            );

            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding review by ID:', error);
            throw error;
        }
    }

    /**
     * Get reviews for a seller
     * @param {number} sellerId - Seller ID
     * @param {number} limit - Limit results
     * @param {number} offset - Offset for pagination
     * @returns {Promise<Array>} - Array of reviews
     */
    static async getSellerReviews(sellerId, limit = 10, offset = 0) {
        try {
            const [rows] = await pool.execute(
                `SELECT r.*,
         u.first_name as reviewer_first_name, u.last_name as reviewer_last_name, u.avatar as reviewer_avatar,
         p.name as product_name, p.id as product_id
         FROM reviews r
         JOIN users u ON r.reviewer_id = u.id
         LEFT JOIN products p ON r.product_id = p.id
         WHERE r.seller_id = ?
         ORDER BY r.date DESC
         LIMIT ? OFFSET ?`,
                [sellerId, limit, offset]
            );

            return rows;
        } catch (error) {
            console.error('Error getting seller reviews:', error);
            throw error;
        }
    }

    /**
     * Get reviews for a product
     * @param {number} productId - Product ID
     * @param {number} limit - Limit results
     * @param {number} offset - Offset for pagination
     * @returns {Promise<Array>} - Array of reviews
     */
    static async getProductReviews(productId, limit = 10, offset = 0) {
        try {
            const [rows] = await pool.execute(
                `SELECT r.*,
         u.first_name as reviewer_first_name, u.last_name as reviewer_last_name, u.avatar as reviewer_avatar
         FROM reviews r
         JOIN users u ON r.reviewer_id = u.id
         WHERE r.product_id = ?
         ORDER BY r.date DESC
         LIMIT ? OFFSET ?`,
                [productId, limit, offset]
            );

            return rows;
        } catch (error) {
            console.error('Error getting product reviews:', error);
            throw error;
        }
    }

    /**
     * Count seller reviews (for pagination)
     * @param {number} sellerId - Seller ID
     * @returns {Promise<number>} - Total count of reviews
     */
    static async countSellerReviews(sellerId) {
        try {
            const [result] = await pool.execute(
                'SELECT COUNT(*) as count FROM reviews WHERE seller_id = ?',
                [sellerId]
            );

            return result[0].count;
        } catch (error) {
            console.error('Error counting seller reviews:', error);
            throw error;
        }
    }

    /**
     * Count product reviews (for pagination)
     * @param {number} productId - Product ID
     * @returns {Promise<number>} - Total count of reviews
     */
    static async countProductReviews(productId) {
        try {
            const [result] = await pool.execute(
                'SELECT COUNT(*) as count FROM reviews WHERE product_id = ?',
                [productId]
            );

            return result[0].count;
        } catch (error) {
            console.error('Error counting product reviews:', error);
            throw error;
        }
    }

    /**
     * Get seller rating statistics
     * @param {number} sellerId - Seller ID
     * @returns {Promise<Object>} - Object with rating statistics
     */
    static async getSellerRatingStats(sellerId) {
        try {
            // Get count of reviews by rating
            const [ratingCounts] = await pool.execute(
                `SELECT rating, COUNT(*) as count
         FROM reviews
         WHERE seller_id = ?
         GROUP BY rating
         ORDER BY rating DESC`,
                [sellerId]
            );

            // Get average rating
            const [avgResult] = await pool.execute(
                'SELECT AVG(rating) as avg_rating FROM reviews WHERE seller_id = ?',
                [sellerId]
            );

            // Get total review count
            const [countResult] = await pool.execute(
                'SELECT COUNT(*) as total FROM reviews WHERE seller_id = ?',
                [sellerId]
            );

            // Build rating distribution object
            const ratingDistribution = {
                1: 0, 2: 0, 3: 0, 4: 0, 5: 0
            };

            ratingCounts.forEach(item => {
                ratingDistribution[item.rating] = item.count;
            });

            return {
                average: avgResult[0].avg_rating || 0,
                total: countResult[0].total || 0,
                distribution: ratingDistribution
            };
        } catch (error) {
            console.error('Error getting seller rating stats:', error);
            throw error;
        }
    }

    /**
     * Check if user has purchased product (to verify review eligibility)
     * @param {number} userId - User ID
     * @param {number} productId - Product ID
     * @returns {Promise<boolean>} - True if user purchased the product
     */
    static async hasUserPurchasedProduct(userId, productId) {
        try {
            const [rows] = await pool.execute(
                `SELECT 1
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         WHERE o.buyer_id = ? AND oi.product_id = ? AND o.status = 'completed'
         LIMIT 1`,
                [userId, productId]
            );

            return rows.length > 0;
        } catch (error) {
            console.error('Error checking if user purchased product:', error);
            throw error;
        }
    }

    /**
     * Check if user has already reviewed product
     * @param {number} userId - User ID
     * @param {number} productId - Product ID
     * @returns {Promise<boolean>} - True if user already reviewed the product
     */
    static async hasUserReviewedProduct(userId, productId) {
        try {
            const [rows] = await pool.execute(
                'SELECT 1 FROM reviews WHERE reviewer_id = ? AND product_id = ? LIMIT 1',
                [userId, productId]
            );

            return rows.length > 0;
        } catch (error) {
            console.error('Error checking if user reviewed product:', error);
            throw error;
        }
    }

    /**
     * Update a review
     * @param {number} id - Review ID
     * @param {Object} reviewData - Review data to update
     * @returns {Promise<boolean>} - True if update successful
     */
    static async update(id, reviewData) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const { rating, comment } = reviewData;

            // Get seller ID from review
            const [reviewResult] = await connection.execute(
                'SELECT seller_id FROM reviews WHERE id = ?',
                [id]
            );

            if (!reviewResult.length) {
                throw new Error('Review not found');
            }

            const sellerId = reviewResult[0].seller_id;

            // Update review
            const [result] = await connection.execute(
                'UPDATE reviews SET rating = ?, comment = ?, date = CURRENT_TIMESTAMP WHERE id = ?',
                [rating, comment, id]
            );

            // Update seller rating
            await User.updateRating(sellerId);

            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            console.error('Error updating review:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Delete a review
     * @param {number} id - Review ID
     * @returns {Promise<boolean>} - True if deletion successful
     */
    static async delete(id) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Get seller ID from review
            const [reviewResult] = await connection.execute(
                'SELECT seller_id FROM reviews WHERE id = ?',
                [id]
            );

            if (!reviewResult.length) {
                throw new Error('Review not found');
            }

            const sellerId = reviewResult[0].seller_id;

            // Delete review
            const [result] = await connection.execute(
                'DELETE FROM reviews WHERE id = ?',
                [id]
            );

            // Update seller rating
            await User.updateRating(sellerId);

            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            console.error('Error deleting review:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get user's review for a product
     * @param {number} userId - User ID
     * @param {number} productId - Product ID
     * @returns {Promise<Object|null>} - Review object or null if not found
     */
    static async getUserReviewForProduct(userId, productId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM reviews WHERE reviewer_id = ? AND product_id = ?',
                [userId, productId]
            );

            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error getting user review for product:', error);
            throw error;
        }
    }
}

module.exports = Review;