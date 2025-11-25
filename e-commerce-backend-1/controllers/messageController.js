// controllers/messageController.js
const Message = require('../models/Message');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendMessageNotification } = require('../services/emailService');
const { ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Get user's conversations
 * @route   GET /api/messages
 * @access  Private
 */
exports.getUserConversations = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get conversations
        const conversations = await Message.getUserConversations(userId);

        res.status(200).json({
            success: true,
            count: conversations.length,
            conversations
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get conversation messages
 * @route   GET /api/messages/:id
 * @access  Private
 */
exports.getConversationById = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        const userId = req.user.id;

        // Check if user is part of the conversation
        const isParticipant = await Message.isParticipant(conversationId, userId);

        if (!isParticipant) {
            return next(new ApiError('Not authorized to view this conversation', 403));
        }

        // Get conversation details
        const conversation = await Message.getConversationDetails(conversationId);

        if (!conversation) {
            return next(new ApiError('Conversation not found', 404));
        }

        // Get messages
        const messages = await Message.getMessages(conversationId);

        // Mark messages as read
        await Message.markAsRead(conversationId, userId);

        res.status(200).json({
            success: true,
            conversation: {
                ...conversation,
                messages
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new conversation
 * @route   POST /api/messages
 * @access  Private
 */
exports.createConversation = async (req, res, next) => {
    try {
        const { productId, message } = req.body;
        const userId = req.user.id;

        if (!productId || !message) {
            return next(new ApiError('Product ID and message are required', 400));
        }

        // Check if product exists
        const product = await Product.findById(productId);

        if (!product) {
            return next(new ApiError('Product not found', 404));
        }

        // Check if user is not the seller
        if (product.seller_id === userId) {
            return next(new ApiError('You cannot message yourself', 400));
        }

        // Check if conversation already exists
        const existingConversationId = await Message.getConversationForProduct(userId, productId);

        if (existingConversationId) {
            // Send message to existing conversation
            await Message.sendMessage(existingConversationId, userId, message);

            return res.status(200).json({
                success: true,
                message: 'Message sent to existing conversation',
                conversationId: existingConversationId
            });
        }

        // Create new conversation
        const conversationId = await Message.createConversation(productId, userId, message);

        // Send notification to seller
        const seller = await User.findById(product.seller_id);
        //await sendMessageNotification(seller, req.user, conversationId, product.name);

        // Emit socket event if available
        if (req.app.get('io')) {
            const io = req.app.get('io');
            io.to(`user-${product.seller_id}`).emit('new-conversation', {
                conversationId,
                productId,
                sender: {
                    id: userId,
                    name: `${req.user.first_name} ${req.user.last_name}`
                },
                message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Conversation created successfully',
            conversationId
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Send a message
 * @route   POST /api/messages/:id
 * @access  Private
 */
exports.sendMessage = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        const { message } = req.body;
        const userId = req.user.id;

        if (!message) {
            return next(new ApiError('Message content is required', 400));
        }

        // Check if user is part of the conversation
        const isParticipant = await Message.isParticipant(conversationId, userId);

        if (!isParticipant) {
            return next(new ApiError('Not authorized to send messages to this conversation', 403));
        }

        // Send message
        const messageId = await Message.sendMessage(conversationId, userId, message);

        // Get conversation details
        const conversation = await Message.getConversationDetails(conversationId);

        // Get other participant
        const otherParticipant = conversation.participants.find(p => p.user_id !== userId);

        // Emit socket event if available
        if (req.app.get('io')) {
            const io = req.app.get('io');
            io.to(`user-${otherParticipant.user_id}`).emit('new-message', {
                conversationId,
                message: {
                    id: messageId,
                    sender_id: userId,
                    text: message,
                    timestamp: new Date(),
                    is_read: false,
                    first_name: req.user.first_name,
                    last_name: req.user.last_name
                }
            });
        }

        // Send email notification
        const recipient = await User.findById(otherParticipant.user_id);
        // await sendMessageNotification(
        //     recipient,
        //     req.user,
        //     conversationId,
        //     conversation.product_name
        // );

        res.status(200).json({
            success: true,
            message: 'Message sent successfully',
            messageId
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark conversation as read
 * @route   PUT /api/messages/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        const userId = req.user.id;

        // Check if user is part of the conversation
        const isParticipant = await Message.isParticipant(conversationId, userId);

        if (!isParticipant) {
            return next(new ApiError('Not authorized to access this conversation', 403));
        }

        // Mark as read
        await Message.markAsRead(conversationId, userId);

        // Emit socket event if available
        if (req.app.get('io')) {
            const io = req.app.get('io');
            io.to(`conversation-${conversationId}`).emit('messages-read', {
                conversationId,
                userId
            });
        }

        res.status(200).json({
            success: true,
            message: 'Conversation marked as read'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get unread message count
 * @route   GET /api/messages/unread/count
 * @access  Private
 */
exports.getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get count
        const count = await Message.getUnreadCount(userId);

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete conversation
 * @route   DELETE /api/messages/:id
 * @access  Private
 */
exports.deleteConversation = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        const userId = req.user.id;

        // Check if user is part of the conversation
        const isParticipant = await Message.isParticipant(conversationId, userId);

        if (!isParticipant && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to delete this conversation', 403));
        }

        // Delete conversation
        const deleted = await Message.deleteConversation(conversationId);

        if (!deleted) {
            return next(new ApiError('Failed to delete conversation', 500));
        }

        res.status(200).json({
            success: true,
            message: 'Conversation deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};