// models/Cart.js
const { pool } = require('../config/database');

class Cart {
    /**
     * Get user's cart items
     * @param {number} userId - User ID
     * @returns {Promise<Array>} - Array of cart items with product details
     */
    static async getItems(userId) {
        try {
            const [rows] = await pool.execute(
                `SELECT ci.id, ci.product_id, ci.quantity, ci.added_at,
         p.name, p.price, p.status, p.seller_id,
         u.first_name AS seller_first_name, u.last_name AS seller_last_name,
         (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         JOIN users u ON p.seller_id = u.id
         WHERE ci.user_id = ? AND p.status = 'active'
         ORDER BY ci.added_at DESC`,
                [userId]
            );

            return rows;
        } catch (error) {
            console.error('Error getting cart items:', error);
            throw error;
        }
    }

    /**
     * Add an item to the cart
     * @param {number} userId - User ID
     * @param {number} productId - Product ID
     * @param {number} quantity - Quantity to add
     * @returns {Promise<number>} - ID of created cart item or updated item
     */
    static async addItem(userId, productId, quantity = 1) {
        try {
            // Check if the product is already in the cart
            const [existingItems] = await pool.execute(
                'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
                [userId, productId]
            );

            if (existingItems.length > 0) {
                // Update quantity of existing item
                const newQuantity = existingItems[0].quantity + quantity;

                await pool.execute(
                    'UPDATE cart_items SET quantity = ? WHERE id = ?',
                    [newQuantity, existingItems[0].id]
                );

                return existingItems[0].id;
            } else {
                // Add new item to cart
                const [result] = await pool.execute(
                    'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                    [userId, productId, quantity]
                );

                return result.insertId;
            }
        } catch (error) {
            console.error('Error adding item to cart:', error);
            throw error;
        }
    }

    /**
     * Update cart item quantity
     * @param {number} itemId - Cart item ID
     * @param {number} quantity - New quantity
     * @returns {Promise<boolean>} - True if update successful
     */
    static async updateItemQuantity(itemId, quantity) {
        try {
            if (quantity < 1) {
                throw new Error('Quantity must be at least 1');
            }

            const [result] = await pool.execute(
                'UPDATE cart_items SET quantity = ? WHERE id = ?',
                [quantity, itemId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating cart item quantity:', error);
            throw error;
        }
    }

    /**
     * Remove an item from the cart
     * @param {number} itemId - Cart item ID
     * @returns {Promise<boolean>} - True if removal successful
     */
    static async removeItem(itemId) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM cart_items WHERE id = ?',
                [itemId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error removing item from cart:', error);
            throw error;
        }
    }

    /**
     * Clear all items from user's cart
     * @param {number} userId - User ID
     * @returns {Promise<boolean>} - True if clear successful
     */
    static async clearCart(userId) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM cart_items WHERE user_id = ?',
                [userId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error clearing cart:', error);
            throw error;
        }
    }

    /**
     * Check if product is in user's cart
     * @param {number} userId - User ID
     * @param {number} productId - Product ID
     * @returns {Promise<boolean>} - True if product is in cart
     */
    static async isProductInCart(userId, productId) {
        try {
            const [rows] = await pool.execute(
                'SELECT id FROM cart_items WHERE user_id = ? AND product_id = ?',
                [userId, productId]
            );

            return rows.length > 0;
        } catch (error) {
            console.error('Error checking if product is in cart:', error);
            throw error;
        }
    }

    /**
     * Get cart item count
     * @param {number} userId - User ID
     * @returns {Promise<number>} - Total number of items in cart
     */
    static async getItemCount(userId) {
        try {
            const [result] = await pool.execute(
                'SELECT COUNT(*) as count FROM cart_items WHERE user_id = ?',
                [userId]
            );

            return result[0].count;
        } catch (error) {
            console.error('Error getting cart item count:', error);
            throw error;
        }
    }

    /**
     * Calculate cart totals
     * @param {number} userId - User ID
     * @returns {Promise<Object>} - Cart totals (subtotal, serviceFee, total)
     */
    static async calculateTotals(userId) {
        try {
            // Get cart items with their current prices
            const [items] = await pool.execute(
                `SELECT ci.quantity, p.price
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.user_id = ? AND p.status = 'active'`,
                [userId]
            );

            // Calculate subtotal
            const subtotal = items.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);

            // Get commission rate from settings
            const [settingsResult] = await pool.execute(
                'SELECT commission_rate, min_commission FROM settings LIMIT 1'
            );

            const commissionRate = settingsResult.length ? settingsResult[0].commission_rate / 100 : 0.05;
            const minCommission = settingsResult.length ? settingsResult[0].min_commission : 0.50;

            // Calculate service fee
            let serviceFee = subtotal * commissionRate;
            if (serviceFee < minCommission && subtotal > 0) {
                serviceFee = minCommission;
            }

            // Calculate total
            const total = subtotal + serviceFee;

            return {
                subtotal: parseFloat(subtotal.toFixed(2)),
                serviceFee: parseFloat(serviceFee.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
                itemCount: items.length
            };
        } catch (error) {
            console.error('Error calculating cart totals:', error);
            throw error;
        }
    }

    /**
     * Validate cart items (check if all products are still available)
     * @param {number} userId - User ID
     * @returns {Promise<Array>} - Array of unavailable items
     */
    static async validateItems(userId) {
        try {
            const [rows] = await pool.execute(
                `SELECT ci.id, ci.product_id, p.name, p.status
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.user_id = ? AND p.status != 'active'`,
                [userId]
            );

            return rows;
        } catch (error) {
            console.error('Error validating cart items:', error);
            throw error;
        }
    }

    /**
     * Remove unavailable items from cart
     * @param {number} userId - User ID
     * @returns {Promise<number>} - Number of items removed
     */
    static async removeUnavailableItems(userId) {
        try {
            const [result] = await pool.execute(
                `DELETE ci FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.user_id = ? AND p.status != 'active'`,
                [userId]
            );

            return result.affectedRows;
        } catch (error) {
            console.error('Error removing unavailable items:', error);
            throw error;
        }
    }
}

module.exports = Cart;