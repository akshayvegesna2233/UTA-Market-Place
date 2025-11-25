// src/services/orderService.js
import apiClient from './api';

const orderService = {
    // Create a new order
    createOrder: async (orderData) => {
        return await apiClient.post('/orders', orderData);
    },

    // Get user's orders with optional status filter
    getUserOrders: async (status = null) => {
        return await apiClient.get('/orders', {
            params: status ? { status } : {}
        });
    },

    // Get order by ID
    getOrderById: async (id) => {
        return await apiClient.get(`/orders/${id}`);
    },

    // Update payment status
    updatePaymentStatus: async (id, paymentStatus) => {
        return await apiClient.put(`/orders/${id}/payment`, { paymentStatus });
    },

    // Process checkout
    processCheckout: async (id, paymentData) => {
        return await apiClient.post(`/orders/${id}/checkout`, paymentData);
    },

    // Cancel order
    cancelOrder: async (id) => {
        return await apiClient.put(`/orders/${id}/cancel`);
    },

    // Format an order object for display
    formatOrderForDisplay: (order) => {
        // Make sure order exists
        if (!order) return null;

        return {
            id: order.id,
            date: order.created_at,
            status: order.status,
            total: order.total,
            serviceFee: order.service_fee,
            paymentMethod: order.payment_method,
            paymentStatus: order.payment_status,
            deliveryAddress: order.delivery_address,
            deliveryCity: order.delivery_city,
            deliveryState: order.delivery_state,
            deliveryZip: order.delivery_zip,
            items: Array.isArray(order.items) ? order.items.map(item => ({
                id: item.id,
                name: item.product_name || 'Unknown Item',
                price: item.price_at_purchase,
                quantity: item.quantity,
                productId: item.product_id,
                sellerId: item.seller_id,
                sellerName: item.seller_name,
                image: item.image
            })) : [],
            // Compute main image from first item
            image: Array.isArray(order.items) && order.items.length > 0 && order.items[0].image
                ? order.items[0].image
                : order.image || null,
            // Calculate item count
            itemCount: Array.isArray(order.items) ? order.items.length : (order.item_count || 0),
            // Extract seller name from first item
            seller: Array.isArray(order.items) && order.items.length > 0 && order.items[0].seller_name
                ? order.items[0].seller_name
                : 'Unknown Seller'
        };
    },

    // Format a list of orders
    formatOrderList: (orders) => {
        if (!Array.isArray(orders)) return [];
        return orders.map(orderService.formatOrderForDisplay);
    }
};

export default orderService;