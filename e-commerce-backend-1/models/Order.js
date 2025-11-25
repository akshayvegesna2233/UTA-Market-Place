// models/Order.js
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Order {
    /**
     * Create a new order
     * @param {Object} orderData - Order data
     * @param {Array} orderItems - Array of order items
     * @returns {Promise<string>} - ID of created order
     */
    static async create(orderData, orderItems) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Generate order ID with format ORD-XXXXX
            const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);

            // Set status to pending by default
            const status = orderData.status || 'pending';

            // Insert order
            const [result] = await connection.execute(
                `INSERT INTO orders 
                (id, buyer_id, total, service_fee, status, payment_method, payment_status, 
                delivery_address, delivery_city, delivery_state, delivery_zip)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    orderData.buyerId,
                    orderData.total,
                    orderData.serviceFee,
                    status,
                    orderData.paymentMethod,
                    orderData.paymentStatus,
                    orderData.deliveryAddress,
                    orderData.deliveryCity,
                    orderData.deliveryState,
                    orderData.deliveryZip
                ]
            );

            // Insert order items
            for (const item of orderItems) {
                await connection.execute(
                    `INSERT INTO order_items 
                    (order_id, product_id, quantity, price_at_purchase)
                    VALUES (?, ?, ?, ?)`,
                    [
                        orderId,
                        item.productId,
                        item.quantity,
                        item.price
                    ]
                );

                // Update product status to sold if needed
                await connection.execute(
                    `UPDATE products SET status = 'sold' WHERE id = ?`,
                    [item.productId]
                );
            }

            await connection.commit();
            return orderId;
        } catch (error) {
            await connection.rollback();
            console.error('Error creating order:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Find order by ID
     * @param {string} orderId - Order ID
     * @returns {Promise<Object|null>} - Order object or null if not found
     */
    static async findById(orderId) {
        try {
            // Get order details
            const [orderRows] = await pool.execute(
                `SELECT o.*, u.first_name, u.last_name, u.email, u.phone
                FROM orders o
                JOIN users u ON o.buyer_id = u.id
                WHERE o.id = ?`,
                [orderId]
            );

            if (!orderRows.length) return null;

            const order = orderRows[0];

            // Get order items
            const [itemRows] = await pool.execute(
                `SELECT oi.*, p.name, p.seller_id, 
                (SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = p.seller_id) as seller_name,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?`,
                [orderId]
            );

            order.items = itemRows;
            return order;
        } catch (error) {
            console.error('Error finding order by ID:', error);
            throw error;
        }
    }

    /**
     * Get user's orders with items
     * @param {number} userId - User ID
     * @param {string|null} status - Optional status filter
     * @returns {Promise<Array>} - Array of orders with items
     */
    static async getUserOrders(userId, status = null) {
        try {
            let query = `
                SELECT o.*,
                       (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
                FROM orders o
                WHERE o.buyer_id = ?
            `;

            const params = [userId];

            if (status) {
                query += ` AND o.status = ?`;
                params.push(status);
            }

            query += ` ORDER BY o.created_at DESC`;

            const [orderRows] = await pool.execute(query, params);

            // Process each order to include its items
            for (const order of orderRows) {
                // Get order items
                const [itemRows] = await pool.execute(
                    `SELECT oi.*, p.name as product_name, p.seller_id,
                            (SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = p.seller_id) as seller_name,
                            (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image
                     FROM order_items oi
                         JOIN products p ON oi.product_id = p.id
                     WHERE oi.order_id = ?`,
                    [order.id]
                );

                // Add items to the order
                order.items = itemRows;

                // Get first item image for the order
                const [imageRow] = await pool.execute(
                    `SELECT pi.image_url
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
                WHERE oi.order_id = ?
                LIMIT 1`,
                    [order.id]
                );

                order.image = imageRow.length ? imageRow[0].image_url : null;
            }

            return orderRows;
        } catch (error) {
            console.error('Error getting user orders:', error);
            throw error;
        }
    }

    /**
     * Update order status
     * @param {string} orderId - Order ID
     * @param {string} status - New status
     * @returns {Promise<boolean>} - True if update successful
     */
    static async updateStatus(orderId, status) {
        try {
            const [result] = await pool.execute(
                'UPDATE orders SET status = ? WHERE id = ?',
                [status, orderId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    }

    /**
     * Update payment status
     * @param {string} orderId - Order ID
     * @param {string} paymentStatus - New payment status
     * @returns {Promise<boolean>} - True if update successful
     */
    static async updatePaymentStatus(orderId, paymentStatus) {
        try {
            const [result] = await pool.execute(
                'UPDATE orders SET payment_status = ? WHERE id = ?',
                [paymentStatus, orderId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating payment status:', error);
            throw error;
        }
    }

    /**
     * Get all orders (for admin)
     * @param {string|null} status - Optional status filter
     * @param {number} limit - Max records to return
     * @param {number} offset - Records to skip
     * @returns {Promise<Array>} - Array of orders
     */
    static async getAll(status = null, limit = 10, offset = 0) {
        try {
            let query = `
                SELECT o.*, u.first_name, u.last_name, u.email,
                    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
                FROM orders o
                JOIN users u ON o.buyer_id = u.id
            `;

            const params = [];

            if (status) {
                query += ` WHERE o.status = ?`;
                params.push(status);
            }

            query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error getting all orders:', error);
            throw error;
        }
    }

    /**
     * Count orders
     * @param {string|null} status - Optional status filter
     * @returns {Promise<number>} - Total count
     */
    static async count(status = null) {
        try {
            let query = 'SELECT COUNT(*) as total FROM orders';
            const params = [];

            if (status) {
                query += ' WHERE status = ?';
                params.push(status);
            }

            const [rows] = await pool.execute(query, params);
            return rows[0].total;
        } catch (error) {
            console.error('Error counting orders:', error);
            throw error;
        }
    }

    /**
     * Get order statistics
     * @returns {Promise<Object>} - Order stats
     */
    static async getStats() {
        try {
            // Get total orders
            const [totalRows] = await pool.execute('SELECT COUNT(*) as total FROM orders');

            // Get orders by status
            const [statusRows] = await pool.execute(`
                SELECT status, COUNT(*) as count
                FROM orders
                GROUP BY status
            `);

            // Get total sales
            const [salesRows] = await pool.execute(`
                SELECT SUM(total) as total_sales
                FROM orders
                WHERE status = 'completed'
            `);

            // Format the results
            const stats = {
                totalOrders: totalRows[0].total,
                totalSales: salesRows[0].total_sales || 0,
                byStatus: {}
            };

            statusRows.forEach(row => {
                stats.byStatus[row.status] = row.count;
            });

            return stats;
        } catch (error) {
            console.error('Error getting order stats:', error);
            throw error;
        }
    }

    /**
     * Get monthly sales data
     * @param {number} year - Year to get data for
     * @returns {Promise<Array>} - Monthly sales data
     */
    static async getMonthlySales(year) {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    MONTH(created_at) as month,
                    COUNT(*) as order_count,
                    SUM(total) as total_sales
                FROM orders
                WHERE 
                    YEAR(created_at) = ? AND
                    status = 'completed'
                GROUP BY MONTH(created_at)
                ORDER BY month
            `, [year]);

            // Fill in missing months
            const monthlyData = Array.from({ length: 12 }, (_, i) => ({
                month: i + 1,
                order_count: 0,
                total_sales: 0
            }));

            rows.forEach(row => {
                monthlyData[row.month - 1] = row;
            });

            return monthlyData;
        } catch (error) {
            console.error('Error getting monthly sales:', error);
            throw error;
        }
    }
}

module.exports = Order;