// models/User.js
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    /**
     * Find a user by ID
     * @param {number} id - User ID
     * @returns {Promise<Object|null>} - User object or null if not found
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT id, first_name, last_name, email, avatar, phone, street_address, city, state, zip_code, ' +
                'join_date, role, status, email_alerts, text_alerts, new_message_notifications, ' +
                'new_listing_notifications, marketing_emails, rating, total_sales ' +
                'FROM users WHERE id = ?',
                [id]
            );
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    }

    /**
     * Find a user by email
     * @param {string} email - User email
     * @returns {Promise<Object|null>} - User object or null if not found
     */
    static async findByEmail(email) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<number>} - ID of created user
     */
    static async create(userData) {
        try {
            const { firstName, lastName, email, password, role = 'user' } = userData;

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const [result] = await pool.execute(
                'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
                [firstName, lastName, email, hashedPassword, role]
            );

            return result.insertId;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Update user information
     * @param {number} id - User ID
     * @param {Object} userData - User data to update
     * @returns {Promise<boolean>} - True if update successful
     */
    static async update(id, userData) {
        try {
            const {
                firstName, lastName, avatar, phone,
                streetAddress, city, state, zipCode,
                emailAlerts, textAlerts, newMessageNotifications,
                newListingNotifications, marketingEmails
            } = userData;

            const params = [
                firstName || null,
                lastName || null,
                avatar || null,
                phone || null,
                streetAddress || null,
                city || null,
                state || null,
                zipCode || null,
                emailAlerts === undefined ? null : emailAlerts,
                textAlerts === undefined ? null : textAlerts,
                newMessageNotifications === undefined ? null : newMessageNotifications,
                newListingNotifications === undefined ? null : newListingNotifications,
                marketingEmails === undefined ? null : marketingEmails,
                id
            ];

            const [result] = await pool.execute(
                `UPDATE users SET 
         first_name = IFNULL(?, first_name),
         last_name = IFNULL(?, last_name),
         avatar = IFNULL(?, avatar),
         phone = IFNULL(?, phone),
         street_address = IFNULL(?, street_address),
         city = IFNULL(?, city),
         state = IFNULL(?, state),
         zip_code = IFNULL(?, zip_code),
         email_alerts = IFNULL(?, email_alerts),
         text_alerts = IFNULL(?, text_alerts),
         new_message_notifications = IFNULL(?, new_message_notifications),
         new_listing_notifications = IFNULL(?, new_listing_notifications),
         marketing_emails = IFNULL(?, marketing_emails)
         WHERE id = ?`,
                params
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Update user password
     * @param {number} id - User ID
     * @param {string} newPassword - New password
     * @returns {Promise<boolean>} - True if update successful
     */
    static async updatePassword(id, newPassword) {
        try {
            // Hash the new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            const [result] = await pool.execute(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating user password:', error);
            throw error;
        }
    }

    /**
     * Update user status
     * @param {number} id - User ID
     * @param {string} status - New status
     * @returns {Promise<boolean>} - True if update successful
     */
    static async updateStatus(id, status) {
        try {
            const [result] = await pool.execute(
                'UPDATE users SET status = ? WHERE id = ?',
                [status, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating user status:', error);
            throw error;
        }
    }

    /**
     * Update user role
     * @param {number} id - User ID
     * @param {string} role - New role
     * @returns {Promise<boolean>} - True if update successful
     */
    static async updateRole(id, role) {
        try {
            const [result] = await pool.execute(
                'UPDATE users SET role = ? WHERE id = ?',
                [role, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating user role:', error);
            throw error;
        }
    }

    /**
     * Update seller rating
     * @param {number} id - User ID
     * @returns {Promise<boolean>} - True if update successful
     */
    static async updateRating(id) {
        try {
            // Calculate average rating from reviews
            const [ratingResult] = await pool.execute(
                'SELECT AVG(rating) as avgRating FROM reviews WHERE seller_id = ?',
                [id]
            );

            const avgRating = ratingResult[0].avgRating || 0;

            // Update user's rating
            const [result] = await pool.execute(
                'UPDATE users SET rating = ? WHERE id = ?',
                [avgRating, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating seller rating:', error);
            throw error;
        }
    }

    /**
     * Increment total sales count
     * @param {number} id - User ID
     * @returns {Promise<boolean>} - True if update successful
     */
    static async incrementSales(id) {
        try {
            const [result] = await pool.execute(
                'UPDATE users SET total_sales = total_sales + 1 WHERE id = ?',
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error incrementing sales count:', error);
            throw error;
        }
    }

    /**
     * Get all users (admin function)
     * @param {number} limit - Limit results
     * @param {number} offset - Offset for pagination
     * @returns {Promise<Array>} - Array of users
     */
    static async getAll(limit = 10, offset = 0) {
        try {
            const [rows] = await pool.execute(
                'SELECT id, first_name, last_name, email, avatar, phone, join_date, role, status, rating, total_sales ' +
                'FROM users ORDER BY join_date DESC LIMIT ? OFFSET ?',
                [limit, offset]
            );

            return rows;
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }

    /**
     * Count total users (for pagination)
     * @returns {Promise<number>} - Total user count
     */
    static async count() {
        try {
            const [result] = await pool.execute('SELECT COUNT(*) as count FROM users');
            return result[0].count;
        } catch (error) {
            console.error('Error counting users:', error);
            throw error;
        }
    }

    /**
     * Delete a user
     * @param {number} id - User ID
     * @returns {Promise<boolean>} - True if deletion successful
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM users WHERE id = ?',
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    /**
     * Get user's listings
     * @param {number} userId - User ID
     * @param {string} status - Filter by status (optional)
     * @returns {Promise<Array>} - Array of user's product listings
     */
    static async getListings(userId, status = null) {
        try {
            let query = 'SELECT p.*, ' +
                '(SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image ' +
                'FROM products p WHERE p.seller_id = ?';

            const params = [userId];

            if (status) {
                query += ' AND p.status = ?';
                params.push(status);
            }

            query += ' ORDER BY p.created_at DESC';

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error getting user listings:', error);
            throw error;
        }
    }

    /**
     * Get user's sales history
     * @param {number} userId - User ID
     * @returns {Promise<Array>} - Array of completed orders for user's products
     */
    static async getSalesHistory(userId) {
        try {
            const [rows] = await pool.execute(
                `SELECT o.id, o.created_at, o.total, o.status, o.payment_status,
         u.id as buyer_id, u.first_name as buyer_first_name, u.last_name as buyer_last_name,
         oi.product_id, oi.quantity, oi.price_at_purchase,
         p.name as product_name
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         JOIN products p ON oi.product_id = p.id
         JOIN users u ON o.buyer_id = u.id
         WHERE p.seller_id = ?
         ORDER BY o.created_at DESC`,
                [userId]
            );

            return rows;
        } catch (error) {
            console.error('Error getting sales history:', error);
            throw error;
        }
    }

    /**
     * Check if password is valid
     * @param {string} password - Plain text password to check
     * @param {string} hashedPassword - Hashed password from database
     * @returns {Promise<boolean>} - True if password matches
     */
    static async validatePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    /**
     * Get new users count (for analytics)
     * @param {number} days - Number of days to look back
     * @returns {Promise<number>} - Count of new users in the specified period
     */
    static async getNewUsersCount(days = 30) {
        try {
            const [result] = await pool.execute(
                'SELECT COUNT(*) as count FROM users WHERE join_date >= DATE_SUB(NOW(), INTERVAL ? DAY)',
                [days]
            );
            return result[0].count;
        } catch (error) {
            console.error('Error counting new users:', error);
            throw error;
        }
    }
}

module.exports = User;