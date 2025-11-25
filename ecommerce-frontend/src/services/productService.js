// src/services/productService.js
import apiClient from './api';

const productService = {
    // Get all products with filtering
    getProducts: async (filters = {}) => {
        return await apiClient.get('/products', { params: filters });
    },

    // Get product by ID
    getProductById: async (id) => {
        return await apiClient.get(`/products/${id}`);
    },

    // Create a new product
    createProduct: async (productData) => {
        return await apiClient.post('/products', productData);
    },

    // Update a product
    updateProduct: async (id, productData) => {
        return await apiClient.put(`/products/${id}`, productData);
    },

    // Delete a product
    deleteProduct: async (id) => {
        return await apiClient.delete(`/products/${id}`);
    },

    // Upload product images
    uploadProductImages: async (id, formData) => {
        return await apiClient.post(`/products/${id}/images`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // Remove product image
    removeProductImage: async (productId, imageId) => {
        return await apiClient.delete(`/products/${productId}/images/${imageId}`);
    },

    // Set main product image
    setMainProductImage: async (productId, imageId) => {
        return await apiClient.put(`/products/${productId}/images/${imageId}/main`);
    },

    // Add product specification
    addProductSpecification: async (productId, specData) => {
        return await apiClient.post(`/products/${productId}/specifications`, specData);
    },

    // Update product specification
    updateProductSpecification: async (productId, specId, value) => {
        return await apiClient.put(`/products/${productId}/specifications/${specId}`, { value });
    },

    // Remove product specification
    removeProductSpecification: async (productId, specId) => {
        return await apiClient.delete(`/products/${productId}/specifications/${specId}`);
    },

    // Get featured products
    getFeaturedProducts: async (limit) => {
        return await apiClient.get('/products/featured', { params: { limit } });
    },

    // Get recent products
    getRecentProducts: async (limit) => {
        return await apiClient.get('/products/recent', { params: { limit } });
    }
};

export default productService;