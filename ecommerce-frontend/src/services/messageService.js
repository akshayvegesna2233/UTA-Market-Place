// src/services/messageService.js
import apiClient from './api';

const messageService = {
    // Get user's conversations
    getUserConversations: async () => {
        return await apiClient.get('/messages');
    },

    // Get conversation by ID
    getConversationById: async (id) => {
        return await apiClient.get(`/messages/${id}`);
    },

    // Create a new conversation
    createConversation: async (productId, message) => {
        return await apiClient.post('/messages', { productId, message });
    },

    // Send a message
    sendMessage: async (conversationId, message) => {
        return await apiClient.post(`/messages/${conversationId}`, { message });
    },

    // Mark conversation as read
    markAsRead: async (conversationId) => {
        return await apiClient.put(`/messages/${conversationId}/read`);
    },

    // Get unread message count
    getUnreadCount: async () => {
        return await apiClient.get('/messages/unread/count');
    },

    // Delete conversation
    deleteConversation: async (conversationId) => {
        return await apiClient.delete(`/messages/${conversationId}`);
    }
};

export default messageService;