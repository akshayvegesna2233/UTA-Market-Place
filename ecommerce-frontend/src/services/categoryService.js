// src/services/categoryService.js
import apiClient from './api';

const categoryService = {
    // Get all categories
    getCategories: async () => {
        return await apiClient.get('/categories');
    },

    // Get category by ID
    getCategoryById: async (id) => {
        return await apiClient.get(`/categories/${id}`);
    },

    // Get product counts by category
    getProductCounts: async () => {
        return await apiClient.get('/categories/product-counts');
    },

    // Get popular categories
    getPopularCategories: async (limit) => {
        return await apiClient.get('/categories/popular', {
            params: { limit }
        });
    },

    // Admin: Create a new category
    createCategory: async (categoryData) => {
        return await apiClient.post('/categories', categoryData);
    },

    // Admin: Update a category
    updateCategory: async (id, categoryData) => {
        return await apiClient.put(`/categories/${id}`, categoryData);
    },

    // Admin: Delete a category
    deleteCategory: async (id) => {
        return await apiClient.delete(`/categories/${id}`);
    }
};

export default categoryService;