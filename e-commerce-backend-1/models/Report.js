// models/Report.js
const { pool } = require('../config/database');

class Report {
    /**
     * Create a new report
     * @param {Object} reportData - Report data
     * @returns {Promise<number>} - ID of created report
     */
    static async create(reportData) {
        try {
            const { type, itemId, reportedById, reason } = reportData;

            const [result] = await pool.execute(
                'INSERT INTO reports (type, item_id, reported_by_id, reason) VALUES (?, ?, ?, ?)',
                [type, itemId, reportedById, reason]
            );

            return result.insertId;
        } catch (error) {
            console.error('Error creating report:', error);
            throw error;
        }
    }

    /**
     * Find a report by ID
     * @param {number} id - Report ID
     * @returns {Promise<Object|null>} - Report object or null if not found
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT r.*,
         u.first_name as reporter_first_name, u.last_name as reporter_last_name
         FROM reports r
         JOIN users u ON r.reported_by_id = u.id
         WHERE r.id = ?`,
                [id]
            );

            if (!rows.length) return null;

            // Get reported item details
            const report = rows[0];

            if (report.type === 'User') {
                const [userResults] = await pool.execute(
                    'SELECT id, first_name, last_name, email FROM users WHERE id = ?',
                    [report.item_id]
                );

                if (userResults.length) {
                    report.itemDetails = userResults[0];
                }
            } else if (report.type === 'Listing') {
                const [productResults] = await pool.execute(
                    `SELECT p.id, p.name, p.seller_id,
           u.first_name as seller_first_name, u.last_name as seller_last_name
           FROM products p
           JOIN users u ON p.seller_id = u.id
           WHERE p.id = ?`,
                    [report.item_id]
                );

                if (productResults.length) {
                    report.itemDetails = productResults[0];
                }
            }

            return report;
        } catch (error) {
            console.error('Error finding report by ID:', error);
            throw error;
        }
    }

    /**
     * Update report status
     * @param {number} id - Report ID
     * @param {string} status - New status
     * @returns {Promise<boolean>} - True if update successful
     */
    static async updateStatus(id, status) {
        try {
            const [result] = await pool.execute(
                'UPDATE reports SET status = ? WHERE id = ?',
                [status, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating report status:', error);
            throw error;
        }
    }

    /**
     * Get all reports (admin function)
     * @param {string} status - Filter by status (optional)
     * @param {string} type - Filter by type (optional)
     * @param {number} limit - Limit results
     * @param {number} offset - Offset for pagination
     * @returns {Promise<Array>} - Array of reports
     */
    static async getAll(status = null, type = null, limit = 10, offset = 0) {
        try {
            let query = `
        SELECT r.*,
        u.first_name as reporter_first_name, u.last_name as reporter_last_name
        FROM reports r
        JOIN users u ON r.reported_by_id = u.id
      `;

            const params = [];
            const conditions = [];

            if (status) {
                conditions.push('r.status = ?');
                params.push(status);
            }

            if (type) {
                conditions.push('r.type = ?');
                params.push(type);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY r.date DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);

            // Get additional details for each report
            const reports = await Promise.all(
                rows.map(async (report) => {
                    if (report.type === 'User') {
                        const [userResults] = await pool.execute(
                            'SELECT id, first_name, last_name, email FROM users WHERE id = ?',
                            [report.item_id]
                        );

                        if (userResults.length) {
                            report.itemDetails = userResults[0];
                            report.itemName = `${userResults[0].first_name} ${userResults[0].last_name}`;
                        }
                    } else if (report.type === 'Listing') {
                        const [productResults] = await pool.execute(
                            `SELECT p.id, p.name, p.seller_id,
               u.first_name as seller_first_name, u.last_name as seller_last_name
               FROM products p
               JOIN users u ON p.seller_id = u.id
               WHERE p.id = ?`,
                            [report.item_id]
                        );

                        if (productResults.length) {
                            report.itemDetails = productResults[0];
                            report.itemName = productResults[0].name;
                        }
                    }

                    return report;
                })
            );

            return reports;
        } catch (error) {
            console.error('Error getting all reports:', error);
            throw error;
        }
    }

    /**
     * Count reports (for pagination)
     * @param {string} status - Filter by status (optional)
     * @param {string} type - Filter by type (optional)
     * @returns {Promise<number>} - Total count of reports
     */
    static async count(status = null, type = null) {
        try {
            let query = 'SELECT COUNT(*) as count FROM reports';
            const params = [];
            const conditions = [];

            if (status) {
                conditions.push('status = ?');
                params.push(status);
            }

            if (type) {
                conditions.push('type = ?');
                params.push(type);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            const [result] = await pool.execute(query, params);
            return result[0].count;
        } catch (error) {
            console.error('Error counting reports:', error);
            throw error;
        }
    }

    /**
     * Check if user has already reported an item
     * @param {number} userId - User ID
     * @param {string} type - Report type
     * @param {number} itemId - Item ID
     * @returns {Promise<boolean>} - True if user already reported the item
     */
    static async hasUserReportedItem(userId, type, itemId) {
        try {
            const [rows] = await pool.execute(
                'SELECT 1 FROM reports WHERE reported_by_id = ? AND type = ? AND item_id = ? LIMIT 1',
                [userId, type, itemId]
            );

            return rows.length > 0;
        } catch (error) {
            console.error('Error checking if user reported item:', error);
            throw error;
        }
    }

    /**
     * Get report statistics (admin function)
     * @returns {Promise<Object>} - Object with report statistics
     */
    static async getStats() {
        try {
            const [result] = await pool.execute(
                `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
          SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissed,
          SUM(CASE WHEN type = 'User' THEN 1 ELSE 0 END) as users,
          SUM(CASE WHEN type = 'Listing' THEN 1 ELSE 0 END) as listings,
          SUM(CASE WHEN date >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as last_week
        FROM reports`
            );

            return result[0];
        } catch (error) {
            console.error('Error getting report statistics:', error);
            throw error;
        }
    }

    /**
     * Get pending reports count
     * @returns {Promise<number>} - Count of pending reports
     */
    static async getPendingCount() {
        try {
            const [result] = await pool.execute(
                "SELECT COUNT(*) as count FROM reports WHERE status = 'pending'"
            );

            return result[0].count;
        } catch (error) {
            console.error('Error getting pending reports count:', error);
            throw error;
        }
    }

    /**
     * Delete a report
     * @param {number} id - Report ID
     * @returns {Promise<boolean>} - True if deletion successful
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM reports WHERE id = ?',
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting report:', error);
            throw error;
        }
    }
}

module.exports = Report;