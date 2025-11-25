// src/services/cartService.js
import apiClient from './api';

const cartService = {
    // Get cart contents
    getCart: async () => {
        return await apiClient.get('/cart');
    },

    // Add item to cart
    addCartItem: async (productId, quantity = 1) => {
        return await apiClient.post('/cart/items', { productId, quantity });
    },

    // Update cart item quantity
    updateCartItem: async (itemId, quantity) => {
        return await apiClient.put(`/cart/items/${itemId}`, { quantity });
    },

    // Remove item from cart
    removeCartItem: async (itemId) => {
        return await apiClient.delete(`/cart/items/${itemId}`);
    },

    // Clear cart
    clearCart: async () => {
        return await apiClient.delete('/cart');
    },

    // Validate cart items (check if all items are still available)
    validateCart: async () => {
        return await apiClient.get('/cart/validate');
    },

    // Get cart item count
    getCartItemCount: async () => {
        return await apiClient.get('/cart/count');
    },

    // Check if product is in cart
    checkProductInCart: async (productId) => {
        return await apiClient.get(`/cart/check/${productId}`);
    }
};

export default cartService;