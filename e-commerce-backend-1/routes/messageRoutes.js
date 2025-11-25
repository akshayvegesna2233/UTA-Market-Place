// messageRoutes.js - Messaging routes
const express = require('express');
const {
    getUserConversations, getConversationById, createConversation,
    sendMessage, markAsRead, getUnreadCount, deleteConversation
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getUserConversations);
router.get('/unread/count', getUnreadCount);
router.get('/:id', getConversationById);
router.post('/', createConversation);
router.post('/:id', sendMessage);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteConversation);

module.exports = router;
