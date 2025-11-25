// src/services/userService.js
import apiClient from './api';
import authService from './authService';

const userService = {
    // Get user profile by ID
    getUserProfile: async (id) => {
        let user = await apiClient.get(`/users/${id}`);
        console.log("Fetched user : ",user)
        return user;
    },

    // Update user profile
    updateProfile: async (id, profileData) => {
        const response = await apiClient.put(`/users/${id}`, profileData);

        // After successful update, update local user data
        if (response.data.success) {
            const { firstName, lastName, avatar } = response.data.user;
            authService.updateLocalUserData({
                firstName,
                lastName,
                avatar
            });
        }

        return response;
    },

    // Upload user avatar
    uploadAvatar: async (id, formData) => {
        const response = await apiClient.post(`/users/${id}/avatar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        // After successful upload, update local user data
        if (response.data.success) {
            authService.updateLocalUserData({
                avatar: response.data.avatarUrl
            });
        }

        return response;
    },

    // Get user's listings
    getUserListings: async (id, status = null) => {
        return await apiClient.get(`/users/${id}/listings`, {
            params: status ? { status } : {}
        });
    },

    // Get user's sales history
    getUserSales: async (id) => {
        return await apiClient.get(`/users/${id}/sales`);
    },

    // Delete user account
    deleteUser: async (id) => {
        return await apiClient.delete(`/users/${id}`);
    },

    // Get notifications preferences from local storage
    getLocalNotificationSettings: () => {
        try {
            const settings = localStorage.getItem('notificationSettings');
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('Error getting notification settings from local storage:', error);
            return null;
        }
    },

    // Save notifications preferences to local storage
    saveLocalNotificationSettings: (settings) => {
        try {
            localStorage.setItem('notificationSettings', JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving notification settings to local storage:', error);
            return false;
        }
    },

    // Sync local notification settings with server (to be called after login)
    syncNotificationSettings: async (userId) => {
        try {
            // Get user profile from server
            const response = await userService.getUserProfile(userId);
            const user = response.data.user;

            // Get local settings
            const localSettings = userService.getLocalNotificationSettings();

            // If local settings exist, update server with them
            if (localSettings) {
                await userService.updateProfile(userId, {
                    emailAlerts: localSettings.emailAlerts,
                    textAlerts: localSettings.textAlerts,
                    newMessageNotifications: localSettings.newMessages,
                    newListingNotifications: localSettings.newListings,
                    marketingEmails: localSettings.marketingEmails
                });
            }
            // Otherwise, use server settings to update local
            else if (user.notifications) {
                userService.saveLocalNotificationSettings({
                    emailAlerts: user.notifications.emailAlerts,
                    textAlerts: user.notifications.textAlerts,
                    newMessages: user.notifications.newMessageNotifications,
                    newListings: user.notifications.newListingNotifications,
                    marketingEmails: user.notifications.marketingEmails
                });
            }

            return true;
        } catch (error) {
            console.error('Error syncing notification settings:', error);
            return false;
        }
    }
};

export default userService;