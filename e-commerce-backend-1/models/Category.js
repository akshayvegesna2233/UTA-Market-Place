// models/Category.js
const { pool } = require('../config/database');

class Category {
    /**
     * Get all categories
     * @returns {Promise<Array>} - Array of all categories
     */
    static async getAll() {
        try {
            const [rows] = await pool.execute('SELECT * FROM categories ORDER BY name');
            return rows;
        } catch (error) {
            console.error('Error getting all categories:', error);
            throw error;
        }
    }

    /**
     * Find a category by ID
     * @param {number} id - Category ID
     * @returns {Promise<Object|null>} - Category object or null if not found
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM categories WHERE id = ?',
                [id]
            );
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding category by ID:', error);
            throw error;
        }
    }

    /**
     * Find a category by name
     * @param {string} name - Category name
     * @returns {Promise<Object|null>} - Category object or null if not found
     */
    static async findByName(name) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM categories WHERE name = ?',
                [name]
            );
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error finding category by name:', error);
            throw error;
        }
    }

    /**
     * Create a new category (admin function)
     * @param {Object} categoryData - Category data
     * @returns {Promise<number>} - ID of created category
     */
    static async create(categoryData) {
        try {
            const { name, icon } = categoryData;

            const [result] = await pool.execute(
                'INSERT INTO categories (name, icon) VALUES (?, ?)',
                [name, icon]
            );

            return result.insertId;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    }

    /**
     * Update a category (admin function)
     * @param {number} id - Category ID
     * @param {Object} categoryData - Category data to update
     * @returns {Promise<boolean>} - True if update successful
     */
    static async update(id, categoryData) {
        try {
            const { name, icon } = categoryData;

            const [result] = await pool.execute(
                'UPDATE categories SET name = ?, icon = ? WHERE id = ?',
                [name, icon, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    }

    /**
     * Delete a category (admin function)
     * @param {number} id - Category ID
     * @returns {Promise<boolean>} - True if deletion successful
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM categories WHERE id = ?',
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    }

    /**
     * Get products count by category
     * @returns {Promise<Array>} - Array of categories with product counts
     */
    static async getProductCounts() {
        try {
            const [rows] = await pool.execute(
                `SELECT c.id, c.name, c.icon, COUNT(p.id) as product_count
         FROM categories c
         LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
         GROUP BY c.id
         ORDER BY c.name`
            );

            return rows;
        } catch (error) {
            console.error('Error getting product counts by category:', error);
            throw error;
        }
    }

    /**
     * Get popular categories (by product count)
     * @param {number} limit - Limit results
     * @returns {Promise<Array>} - Array of popular categories
     */
    static async getPopular(limit = 5) {
        try {
            const [rows] = await pool.execute(
                `SELECT c.id, c.name, c.icon, COUNT(p.id) as product_count
         FROM categories c
         JOIN products p ON c.id = p.category_id AND p.status = 'active'
         GROUP BY c.id
         ORDER BY product_count DESC
         LIMIT ?`,
                [limit]
            );

            return rows;
        } catch (error) {
            console.error('Error getting popular categories:', error);
            throw error;
        }
    }
}

module.exports = Category;