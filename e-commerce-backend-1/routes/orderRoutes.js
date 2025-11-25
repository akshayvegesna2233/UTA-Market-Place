// orderRoutes.js - Order management routes
const express = require('express');
const {
    createOrder, getUserOrders, getOrderById, updateOrderStatus,
    updatePaymentStatus, getAllOrders, getOrderStats, processCheckout, cancelOrder
} = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// User routes (require authentication)
router.post('/', protect, createOrder);
router.get('/', protect, getUserOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/payment', protect, updatePaymentStatus);
router.post('/:id/checkout', protect, processCheckout);
router.put('/:id/cancel', protect, cancelOrder);

// Admin routes
router.get('/all', protect, restrictTo('admin'), getAllOrders);
router.get('/stats', protect, restrictTo('admin'), getOrderStats);
router.put('/:id/status', protect, restrictTo('admin'), updateOrderStatus);

module.exports = router;