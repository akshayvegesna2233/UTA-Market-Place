// src/services/reportService.js
import apiClient from './api';

const reportService = {
    // Create a new report
    createReport: async (reportData) => {
        return await apiClient.post('/reports', reportData);
    },

    // Check if user has reported an item
    checkUserReported: async (type, itemId) => {
        return await apiClient.get(`/reports/check/${type}/${itemId}`);
    },

    // Admin: Get all reports
    getReports: async (status = null, type = null, page = 1, limit = 10) => {
        return await apiClient.get('/reports', {
            params: { status, type, page, limit }
        });
    },

    // Admin: Get report statistics
    getReportStats: async () => {
        return await apiClient.get('/reports/stats');
    },

    // Admin: Get pending report count
    getPendingCount: async () => {
        return await apiClient.get('/reports/pending/count');
    },

    // Admin: Get report by ID
    getReportById: async (id) => {
        return await apiClient.get(`/reports/${id}`);
    },

    // Admin: Update report status
    updateReportStatus: async (id, status) => {
        return await apiClient.put(`/reports/${id}/status`, { status });
    },

    // Admin: Delete a report
    deleteReport: async (id) => {
        return await apiClient.delete(`/reports/${id}`);
    }
};

export default reportService;