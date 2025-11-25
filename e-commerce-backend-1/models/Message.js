// models/Message.js
const { pool } = require('../config/database');

class Message {
    /**
     * Create a new conversation
     * @param {number} productId - Product ID
     * @param {number} buyerId - Buyer ID
     * @param {string} initialMessage - First message content
     * @returns {Promise<number>} - ID of created conversation
     */
    static async createConversation(productId, buyerId, initialMessage) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Get seller ID from product
            const [productResult] = await connection.execute(
                'SELECT seller_id FROM products WHERE id = ?',
                [productId]
            );

            if (!productResult.length) {
                throw new Error('Product not found');
            }

            const sellerId = productResult[0].seller_id;

            // Check if conversation already exists
            const [existingConvo] = await connection.execute(
                'SELECT id FROM conversations WHERE product_id = ? AND id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = ?)',
                [productId, buyerId]
            );

            if (existingConvo.length > 0) {
                // Conversation already exists, add message to existing conversation
                const convoId = existingConvo[0].id;

                // Add message
                await connection.execute(
                    'INSERT INTO messages (conversation_id, sender_id, text) VALUES (?, ?, ?)',
                    [convoId, buyerId, initialMessage]
                );

                // Update conversation last message time
                await connection.execute(
                    'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [convoId]
                );

                // Update unread count for seller
                await connection.execute(
                    'UPDATE conversation_participants SET unread_count = unread_count + 1 WHERE conversation_id = ? AND user_id = ?',
                    [convoId, sellerId]
                );

                await connection.commit();
                return convoId;
            }

            // Create new conversation
            const [convoResult] = await connection.execute(
                'INSERT INTO conversations (product_id) VALUES (?)',
                [productId]
            );

            const conversationId = convoResult.insertId;

            // Add participants
            await connection.execute(
                'INSERT INTO conversation_participants (conversation_id, user_id, unread_count) VALUES (?, ?, ?)',
                [conversationId, buyerId, 0]
            );

            await connection.execute(
                'INSERT INTO conversation_participants (conversation_id, user_id, unread_count) VALUES (?, ?, ?)',
                [conversationId, sellerId, 1]
            );

            // Add initial message
            await connection.execute(
                'INSERT INTO messages (conversation_id, sender_id, text) VALUES (?, ?, ?)',
                [conversationId, buyerId, initialMessage]
            );

            await connection.commit();
            return conversationId;
        } catch (error) {
            await connection.rollback();
            console.error('Error creating conversation:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Send a message
     * @param {number} conversationId - Conversation ID
     * @param {number} senderId - Sender user ID
     * @param {string} text - Message text
     * @returns {Promise<number>} - ID of created message
     */
    static async sendMessage(conversationId, senderId, text) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Insert message
            const [messageResult] = await connection.execute(
                'INSERT INTO messages (conversation_id, sender_id, text) VALUES (?, ?, ?)',
                [conversationId, senderId, text]
            );

            const messageId = messageResult.insertId;

            // Update conversation last message time
            await connection.execute(
                'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?',
                [conversationId]
            );

            // Update unread count for other participants
            await connection.execute(
                `UPDATE conversation_participants 
         SET unread_count = unread_count + 1 
         WHERE conversation_id = ? AND user_id != ?`,
                [conversationId, senderId]
            );

            await connection.commit();
            return messageId;
        } catch (error) {
            await connection.rollback();
            console.error('Error sending message:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get user's conversations
     * @param {number} userId - User ID
     * @returns {Promise<Array>} - Array of conversations
     */
    static async getUserConversations(userId) {
        try {
            const [rows] = await pool.execute(
                `SELECT 
          c.id, c.product_id, c.created_at, c.last_message_at,
          p.name as product_name, 
          (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as product_image,
          cp.unread_count,
          (SELECT sender_id FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_sender_id,
          (SELECT text FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message,
          (SELECT timestamp FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message_time,
          (SELECT user_id FROM conversation_participants WHERE conversation_id = c.id AND user_id != ?) as other_user_id,
          (SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = (SELECT user_id FROM conversation_participants WHERE conversation_id = c.id AND user_id != ?)) as other_user_name,
          (SELECT avatar FROM users WHERE id = (SELECT user_id FROM conversation_participants WHERE conversation_id = c.id AND user_id != ?)) as other_user_avatar
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        JOIN products p ON c.product_id = p.id
        WHERE cp.user_id = ?
        ORDER BY c.last_message_at DESC`,
                [userId, userId, userId, userId]
            );

            return rows;
        } catch (error) {
            console.error('Error getting user conversations:', error);
            throw error;
        }
    }

    /**
     * Get conversation details
     * @param {number} conversationId - Conversation ID
     * @returns {Promise<Object|null>} - Conversation details or null if not found
     */
    static async getConversationDetails(conversationId) {
        try {
            const [rows] = await pool.execute(
                `SELECT 
          c.id, c.product_id, c.created_at, c.last_message_at,
          p.name as product_name, p.price as product_price, p.seller_id,
          (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as product_image
        FROM conversations c
        JOIN products p ON c.product_id = p.id
        WHERE c.id = ?`,
                [conversationId]
            );

            if (!rows.length) return null;

            // Get participants
            const [participants] = await pool.execute(
                `SELECT 
          cp.user_id, cp.unread_count,
          u.first_name, u.last_name, u.avatar
        FROM conversation_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = ?`,
                [conversationId]
            );

            const conversation = rows[0];
            conversation.participants = participants;

            return conversation;
        } catch (error) {
            console.error('Error getting conversation details:', error);
            throw error;
        }
    }

    /**
     * Get messages in a conversation
     * @param {number} conversationId - Conversation ID
     * @param {number} limit - Maximum number of messages to return
     * @param {number} offset - Number of messages to skip (for pagination)
     * @returns {Promise<Array>} - Array of messages
     */
    static async getMessages(conversationId, limit = 50, offset = 0) {
        try {
            // Convert limit and offset to integers
            const limitInt = parseInt(limit, 10);
            const offsetInt = parseInt(offset, 10);

            // Use string interpolation for LIMIT and OFFSET
            const [rows] = await pool.execute(
                `SELECT 
          m.id, m.sender_id, m.text, m.timestamp, m.is_read,
          u.first_name, u.last_name, u.avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.timestamp ASC
        LIMIT ${limitInt} OFFSET ${offsetInt}`,
                [conversationId]
            );

            return rows;
        } catch (error) {
            console.error('Error getting messages:', error);
            throw error;
        }
    }

    /**
     * Mark messages as read
     * @param {number} conversationId - Conversation ID
     * @param {number} userId - User ID
     * @returns {Promise<boolean>} - True if update successful
     */
    static async markAsRead(conversationId, userId) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Mark messages as read
            await connection.execute(
                `UPDATE messages 
         SET is_read = TRUE 
         WHERE conversation_id = ? 
         AND sender_id != ?
         AND is_read = FALSE`,
                [conversationId, userId]
            );

            // Reset unread count for user
            await connection.execute(
                'UPDATE conversation_participants SET unread_count = 0 WHERE conversation_id = ? AND user_id = ?',
                [conversationId, userId]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            console.error('Error marking messages as read:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Check if user is a participant in conversation
     * @param {number} conversationId - Conversation ID
     * @param {number} userId - User ID
     * @returns {Promise<boolean>} - True if user is a participant
     */
    static async isParticipant(conversationId, userId) {
        try {
            const [rows] = await pool.execute(
                'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
                [conversationId, userId]
            );

            return rows.length > 0;
        } catch (error) {
            console.error('Error checking conversation participant:', error);
            throw error;
        }
    }

    /**
     * Get total unread message count for user
     * @param {number} userId - User ID
     * @returns {Promise<number>} - Total number of unread messages
     */
    static async getUnreadCount(userId) {
        try {
            const [result] = await pool.execute(
                'SELECT SUM(unread_count) as total FROM conversation_participants WHERE user_id = ?',
                [userId]
            );

            return result[0].total || 0;
        } catch (error) {
            console.error('Error getting unread message count:', error);
            throw error;
        }
    }

    /**
     * Delete a conversation
     * @param {number} conversationId - Conversation ID
     * @returns {Promise<boolean>} - True if deletion successful
     */
    static async deleteConversation(conversationId) {
        try {
            // Note: Because of foreign key constraints with ON DELETE CASCADE,
            // deleting the conversation will also delete messages and participants
            const [result] = await pool.execute(
                'DELETE FROM conversations WHERE id = ?',
                [conversationId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting conversation:', error);
            throw error;
        }
    }

    /**
     * Check if conversation exists between user and product
     * @param {number} userId - User ID
     * @param {number} productId - Product ID
     * @returns {Promise<number|null>} - Conversation ID if exists, null otherwise
     */
    static async getConversationForProduct(userId, productId) {
        try {
            const [rows] = await pool.execute(
                `SELECT c.id
         FROM conversations c
         JOIN conversation_participants cp ON c.id = cp.conversation_id
         WHERE c.product_id = ? AND cp.user_id = ?
         LIMIT 1`,
                [productId, userId]
            );

            return rows.length ? rows[0].id : null;
        } catch (error) {
            console.error('Error checking conversation for product:', error);
            throw error;
        }
    }
}

module.exports = Message;