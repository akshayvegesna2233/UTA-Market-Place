// src/services/authService.js
import apiClient from './api';

const authService = {
    // User registration
    register: async (userData) => {
        const response = await apiClient.post('/auth/register', userData);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // User login
    login: async (credentials) => {
        const response = await apiClient.post('/auth/login', credentials);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // Get current user profile
    getCurrentUser: async () => {
        return await apiClient.get('/auth/me');
    },

    // Change password (direct approach without email)
    changePassword: async (currentPassword, newPassword) => {
        return await apiClient.post('/auth/change-password', {
            currentPassword,
            newPassword
        });
    },

    // Simple forgot password with email only
    forgotPassword: async (email) => {
        // In a real implementation, this would typically send an email
        // For our simplified version, we'll just request a password reset
        return await apiClient.post('/auth/forgot-password', { email });
    },

    // Reset password with token
    resetPassword: async (token, password) => {
        return await apiClient.post(`/auth/reset-password/${token}`, { password });
    },

    // Direct password reset without email verification
    directPasswordReset: async (email, newPassword) => {
        return await apiClient.post('/auth/direct-reset', {
            email,
            newPassword
        });
    },

    // Logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Clean up any other stored data like notifications
        localStorage.removeItem('notificationSettings');

        // Optional: Call the logout endpoint
        return apiClient.post('/auth/logout').catch(() => {
            // Silently fail for the logout endpoint
            // We still want to clear local storage even if the request fails
        });
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    // Get current user from localStorage
    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Update local user data after profile changes
    updateLocalUserData: (userData) => {
        const currentUser = authService.getUser();
        if (currentUser) {
            const updatedUser = { ...currentUser, ...userData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        }
        return null;
    }
};

export default authService;