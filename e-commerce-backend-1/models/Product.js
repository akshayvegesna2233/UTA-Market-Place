// models/Product.js
const {pool} = require('../config/database');

class Product {
    /**
     * Find a product by ID
     * @param {number} id - Product ID
     * @returns {Promise<Object|null>} - Product object or null if not found
     */
    static async findById(id) {
        try {
            // Get product details
            const [rows] = await pool.execute(
                `SELECT p.*,
                        c.name       as category_name,
                        c.icon       as category_icon,
                        u.id as         seller_id,
                        u.first_name as seller_first_name,
                        u.last_name as  seller_last_name,
                        u.avatar     as seller_avatar,
                        u.rating     as seller_rating,
                        u.join_date  as seller_join_date
                 FROM products p
                          JOIN categories c ON p.category_id = c.id
                          JOIN users u ON p.seller_id = u.id
                 WHERE p.id = ?`,
                [id]
            );

            if (!rows.length) return null;

            // Increment view count
            await pool.execute(
                'UPDATE products SET views = views + 1 WHERE id = ?',
                [id]
            );

            return rows[0];
        } catch (error) {
            console.error('Error finding product by ID:', error);
            throw error;
        }
    }

    /**
     * Get product images
     * @param {number} productId - Product ID
     * @returns {Promise<Array>} - Array of product images
     */
    static async getImages(productId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_main DESC',
                [productId]
            );
            return rows;
        } catch (error) {
            console.error('Error getting product images:', error);
            throw error;
        }
    }

    /**
     * Get product specifications
     * @param {number} productId - Product ID
     * @returns {Promise<Array>} - Array of product specifications
     */
    static async getSpecifications(productId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM product_specifications WHERE product_id = ?',
                [productId]
            );
            return rows;
        } catch (error) {
            console.error('Error getting product specifications:', error);
            throw error;
        }
    }

    /**
     * Create a new product
     * @param {Object} productData - Product data
     * @param {Array} images - Array of image URLs
     * @param {Array} specifications - Array of specifications
     * @returns {Promise<number>} - ID of created product
     */
    static async create(productData, images = [], specifications = []) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const {name, description, price, sellerId, categoryId, itemCondition, location} = productData;

            // Insert product
            const [productResult] = await connection.execute(
                `INSERT INTO products
                 (name, description, price, seller_id, category_id, item_condition, location)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [name, description, price, sellerId, categoryId, itemCondition, location]
            );

            const productId = productResult.insertId;

            // Insert images
            if (images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    const isMain = i === 0; // First image is main
                    await connection.execute(
                        'INSERT INTO product_images (product_id, image_url, is_main) VALUES (?, ?, ?)',
                        [productId, images[i], isMain]
                    );
                }
            }

            // Insert specifications
            if (specifications.length > 0) {
                for (const spec of specifications) {
                    await connection.execute(
                        'INSERT INTO product_specifications (product_id, name, value) VALUES (?, ?, ?)',
                        [productId, spec.name, spec.value]
                    );
                }
            }

            await connection.commit();
            return productId;
        } catch (error) {
            await connection.rollback();
            console.error('Error creating product:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Update a product
     * @param {number} id - Product ID
     * @param {Object} productData - Product data to update
     * @returns {Promise<boolean>} - True if update successful
     */
    static async update(id, productData) {
        try {
            const {
                name, description, price, categoryId,
                itemCondition, location, status
            } = productData;

            // Build SET clause and parameters dynamically to avoid undefined values
            let setClause = [];
            let params = [];

            if (name !== undefined) {
                setClause.push('name = ?');
                params.push(name);
            }

            if (description !== undefined) {
                setClause.push('description = ?');
                params.push(description);
            }

            if (price !== undefined) {
                setClause.push('price = ?');
                params.push(price);
            }

            if (categoryId !== undefined) {
                setClause.push('category_id = ?');
                params.push(categoryId);
            }

            if (itemCondition !== undefined) {
                setClause.push('item_condition = ?');
                params.push(itemCondition);
            }

            if (location !== undefined) {
                setClause.push('location = ?');
                params.push(location);
            }

            if (status !== undefined) {
                setClause.push('status = ?');
                params.push(status);
            }

            // Add updated_at timestamp
            setClause.push('updated_at = CURRENT_TIMESTAMP');

            // If nothing to update, return true
            if (setClause.length === 1) {
                return true;
            }

            // Build the query
            const query = `UPDATE products
                           SET ${setClause.join(', ')}
                           WHERE id = ?`;

            // Add product ID to parameters
            params.push(id);

            const [result] = await pool.execute(query, params);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    /**
     * Update product status
     * @param {number} id - Product ID
     * @param {string} status - New status
     * @returns {Promise<boolean>} - True if update successful
     */
    static async updateStatus(id, status) {
        try {
            const [result] = await pool.execute(
                'UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating product status:', error);
            throw error;
        }
    }

    /**
     * Delete a product
     * @param {number} id - Product ID
     * @returns {Promise<boolean>} - True if deletion successful
     */
    static async delete(id) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Delete product images
            await connection.execute('DELETE FROM product_images WHERE product_id = ?', [id]);

            // Delete product specifications
            await connection.execute('DELETE FROM product_specifications WHERE product_id = ?', [id]);

            // Delete the product
            const [result] = await connection.execute('DELETE FROM products WHERE id = ?', [id]);

            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            console.error('Error deleting product:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Add a product image
     * @param {number} productId - Product ID
     * @param {string} imageUrl - Image URL
     * @param {boolean} isMain - Whether this is the main image
     * @returns {Promise<number>} - ID of created image
     */
    static async addImage(productId, imageUrl, isMain = false) {
        try {
            // If this is the main image, unset any existing main image
            if (isMain) {
                await pool.execute(
                    'UPDATE product_images SET is_main = 0 WHERE product_id = ?',
                    [productId]
                );
            }

            const [result] = await pool.execute(
                'INSERT INTO product_images (product_id, image_url, is_main) VALUES (?, ?, ?)',
                [productId, imageUrl, isMain]
            );

            return result.insertId;
        } catch (error) {
            console.error('Error adding product image:', error);
            throw error;
        }
    }

    /**
     * Remove a product image
     * @param {number} imageId - Image ID
     * @returns {Promise<boolean>} - True if deletion successful
     */
    static async removeImage(imageId) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM product_images WHERE id = ?',
                [imageId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error removing product image:', error);
            throw error;
        }
    }

    /**
     * Add a product specification
     * @param {number} productId - Product ID
     * @param {string} name - Specification name
     * @param {string} value - Specification value
     * @returns {Promise<number>} - ID of created specification
     */
    static async addSpecification(productId, name, value) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO product_specifications (product_id, name, value) VALUES (?, ?, ?)',
                [productId, name, value]
            );

            return result.insertId;
        } catch (error) {
            console.error('Error adding product specification:', error);
            throw error;
        }
    }

    /**
     * Update a product specification
     * @param {number} specId - Specification ID
     * @param {string} value - New specification value
     * @returns {Promise<boolean>} - True if update successful
     */
    static async updateSpecification(specId, value) {
        try {
            const [result] = await pool.execute(
                'UPDATE product_specifications SET value = ? WHERE id = ?',
                [value, specId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating product specification:', error);
            throw error;
        }
    }

    /**
     * Remove a product specification
     * @param {number} specId - Specification ID
     * @returns {Promise<boolean>} - True if deletion successful
     */
    static async removeSpecification(specId) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM product_specifications WHERE id = ?',
                [specId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error removing product specification:', error);
            throw error;
        }
    }

    /**
     * Search for products with filtering options
     * @param {Object} options - Search options
     * @returns {Promise<Array>} - Array of products matching criteria
     */
    static async search(options) {
        try {
            const {
                searchTerm = '',
                categoryId = null,
                minPrice = null,
                maxPrice = null,
                sellerId = null,
                condition = null,
                sortBy = 'newest',
                limit = 10,
                offset = 0
            } = options;

            // Validate limit and offset
            if (typeof limit !== 'number' || limit < 1 || typeof offset !== 'number' || offset < 0) {
                throw new Error('Invalid limit or offset value');
            }

            let query = `
                SELECT p.*,
                       c.name       as                                                               category_name,
                       u.first_name as                                                               seller_first_name,
                       u.last_name  as                                                               seller_last_name,
                       (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
                FROM products p
                    JOIN categories c
                ON p.category_id = c.id
                    JOIN users u ON p.seller_id = u.id
                WHERE p.status = 'active'
            `;

            const params = [];

            // Add search term filter
            if (searchTerm) {
                query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
                params.push(`%${searchTerm}%`, `%${searchTerm}%`);
            }

            // Add category filter
            if (categoryId) {
                query += ` AND p.category_id = ?`;
                params.push(categoryId);
            }

            // Add price filters
            if (minPrice !== null) {
                query += ` AND p.price >= ?`;
                params.push(minPrice);
            }

            if (maxPrice !== null) {
                query += ` AND p.price <= ?`;
                params.push(maxPrice);
            }

            // Add seller filter
            if (sellerId) {
                query += ` AND p.seller_id = ?`;
                params.push(sellerId);
            }

            // Add condition filter
            if (condition) {
                query += ` AND p.item_condition = ?`;
                params.push(condition);
            }

            // Add sorting
            switch (sortBy) {
                case 'priceAsc':
                    query += ` ORDER BY p.price ASC`;
                    break;
                case 'priceDesc':
                    query += ` ORDER BY p.price DESC`;
                    break;
                case 'oldest':
                    query += ` ORDER BY p.created_at ASC`;
                    break;
                case 'mostViewed':
                    query += ` ORDER BY p.views DESC`;
                    break;
                case 'mostInterested':
                    query += ` ORDER BY p.interested DESC`;
                    break;
                case 'newest':
                default:
                    query += ` ORDER BY p.created_at DESC`;
                    break;
            }

            // Add pagination directly (no placeholders)
            query += ` LIMIT ${limit} OFFSET ${offset}`;

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    }

    /**
     * Count products matching search criteria (for pagination)
     * @param {Object} options - Search options
     * @returns {Promise<number>} - Total count of matching products
     */
    static async count(options) {
        try {
            const {
                searchTerm = '',
                categoryId = null,
                minPrice = null,
                maxPrice = null,
                sellerId = null,
                condition = null
            } = options;

            let query = `
                SELECT COUNT(*) as count
                FROM products p
                WHERE p.status = 'active'
            `;

            const params = [];

            // Add search term filter
            if (searchTerm) {
                query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
                params.push(`%${searchTerm}%`, `%${searchTerm}%`);
            }

            // Add category filter
            if (categoryId) {
                query += ` AND p.category_id = ?`;
                params.push(categoryId);
            }

            // Add price filters
            if (minPrice !== null) {
                query += ` AND p.price >= ?`;
                params.push(minPrice);
            }

            if (maxPrice !== null) {
                query += ` AND p.price <= ?`;
                params.push(maxPrice);
            }

            // Add seller filter
            if (sellerId) {
                query += ` AND p.seller_id = ?`;
                params.push(sellerId);
            }

            // Add condition filter
            if (condition) {
                query += ` AND p.item_condition = ?`;
                params.push(condition);
            }

            const [result] = await pool.execute(query, params);
            return result[0].count;
        } catch (error) {
            console.error('Error counting products:', error);
            throw error;
        }
    }

    /**
     * Get related products
     * @param {number} productId - Product ID
     * @param {number} limit - Limit results
     * @returns {Promise<Array>} - Array of related products
     */
    static async getRelated(productId, limit = 4) {
        try {
            // First get the category of the current product
            const [categoryResult] = await pool.execute(
                'SELECT category_id FROM products WHERE id = ?',
                [productId]
            );

            if (!categoryResult.length) return [];

            const categoryId = categoryResult[0].category_id;

            // Convert limit to integer to ensure it's a valid number
            const limitValue = parseInt(limit, 10);

            // Get other products in the same category
            // Use a different approach for the LIMIT clause to avoid prepared statement issues
            const query = `SELECT 
            p.id, 
            p.name, 
            p.price,
            p.item_condition,
            u.first_name as seller_first_name,
            u.last_name as seller_last_name,
            (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image_url
        FROM products p
        JOIN users u ON p.seller_id = u.id
        WHERE p.category_id = ? 
        AND p.id != ? 
        AND p.status = 'active'
        ORDER BY RAND()
        LIMIT ${limitValue}`;

            const [rows] = await pool.execute(query, [categoryId, productId]);

            return rows;
        } catch (error) {
            console.error('Error getting related products:', error);
            throw error;
        }
    }

    /**
     * Get featured products
     * @param {number} limit - Limit results
     * @returns {Promise<Array>} - Array of featured products
     */
    static async getFeatured(limit = 4) {
        try {
            // Ensure limit is a positive integer
            if (typeof limit !== 'number' || isNaN(limit) || limit < 1) {
                throw new Error('Invalid limit value');
            }

            const sql = `
                SELECT p.id,
                       p.name,
                       p.price,
                       p.category_id,
                       c.name as                                                                     category_name,
                       (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image
                FROM products p
                    JOIN categories c
                ON p.category_id = c.id
                WHERE p.status = 'active'
                ORDER BY (p.views * 0.4) + (p.interested * 0.6) DESC
                    LIMIT ${limit}
            `;

            const [rows] = await pool.query(sql);
            return rows;
        } catch (error) {
            console.error('Error getting featured products:', error);
            throw error;
        }
    }

    /**
     * Get recently listed products
     * @param {number} limit - Limit results
     * @returns {Promise<Array>} - Array of recent products
     */
    static async getRecent(limit = 8) {
        try {
            const [rows] = await pool.execute(
                `SELECT p.id,
                        p.name,
                        p.price,
                        p.created_at,
                        p.category_id,
                        c.name as                                                                     category_name,
                        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as image
                 FROM products p
                     JOIN categories c
                 ON p.category_id = c.id
                 WHERE p.status = 'active'
                 ORDER BY p.created_at DESC
                     LIMIT ?`,
                [limit]
            );

            return rows;
        } catch (error) {
            console.error('Error getting recent products:', error);
            throw error;
        }
    }

    /**
     * Increment interested count
     * @param {number} id - Product ID
     * @returns {Promise<boolean>} - True if update successful
     */
    static async incrementInterested(id) {
        try {
            const [result] = await pool.execute(
                'UPDATE products SET interested = interested + 1 WHERE id = ?',
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error incrementing interested count:', error);
            throw error;
        }
    }

    /**
     * Get products pending approval (admin function)
     * @param {number} limit - Limit results
     * @param {number} offset - Offset for pagination
     * @returns {Promise<Array>} - Array of pending products
     */
    static async getPending(limit = 10, offset = 0) {
        try {
            const [rows] = await pool.execute(
                `SELECT p.*,
                        c.name       as                                                               category_name,
                        u.first_name as                                                               seller_first_name,
                        u.last_name  as                                                               seller_last_name,
                        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
                 FROM products p
                     JOIN categories c
                 ON p.category_id = c.id
                     JOIN users u ON p.seller_id = u.id
                 WHERE p.status = 'pending'
                 ORDER BY p.created_at ASC
                     LIMIT ?
                 OFFSET ?`,
                [limit, offset]
            );

            return rows;
        } catch (error) {
            console.error('Error getting pending products:', error);
            throw error;
        }
    }

    /**
     * Count pending products (admin function)
     * @returns {Promise<number>} - Total count of pending products
     */
    static async countPending() {
        try {
            const [result] = await pool.execute(
                'SELECT COUNT(*) as count FROM products WHERE status = "pending"'
            );
            return result[0].count;
        } catch (error) {
            console.error('Error counting pending products:', error);
            throw error;
        }
    }

    /**
     * Get product statistics (admin function)
     * @returns {Promise<Object>} - Object with product statistics
     */
    static async getStats() {
        try {
            const [result] = await pool.execute(
                `SELECT COUNT(*)                                                                       as total,
                        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)                             as active,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)                            as pending,
                        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END)                               as sold,
                        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_last_week
                 FROM products`
            );

            return result[0];
        } catch (error) {
            console.error('Error getting product statistics:', error);
            throw error;
        }
    }
}

module.exports = Product;