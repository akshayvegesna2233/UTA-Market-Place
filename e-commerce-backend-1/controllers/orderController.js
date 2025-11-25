// controllers/orderController.js
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendOrderConfirmation } = require('../services/emailService');
const { ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private
 */
exports.createOrder = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Validate body
        const {
            paymentMethod,
            paymentStatus = 'pending',
            deliveryAddress,
            deliveryCity,
            deliveryState,
            deliveryZip
        } = req.body;

        // Validate payment method
        if (!['credit', 'paypal', 'other'].includes(paymentMethod)) {
            return next(new ApiError('Invalid payment method', 400));
        }

        // Get cart items
        const cartItems = await Cart.getItems(userId);

        // Check if cart is empty
        if (cartItems.length === 0) {
            return next(new ApiError('Your cart is empty', 400));
        }

        // Prepare order items
        const orderItems = cartItems.map(item => ({
            productId: item.product_id,
            quantity: item.quantity,
            price: item.price
        }));

        // Calculate totals
        const { subtotal, serviceFee, total } = await Cart.calculateTotals(userId);

        // Create order
        const orderData = {
            buyerId: userId,
            total,
            serviceFee,
            paymentMethod,
            paymentStatus,
            deliveryAddress,
            deliveryCity,
            deliveryState,
            deliveryZip
        };

        const orderId = await Order.create(orderData, orderItems);

        // Clear cart
        await Cart.clearCart(userId);

        // Send confirmation email
        const user = await User.findById(userId);

        //await sendOrderConfirmation(user, { id: orderId, created_at: new Date(), total, service_fee: serviceFee }, cartItems);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            orderId
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user's orders
 * @route   GET /api/orders
 * @access  Private
 */
exports.getUserOrders = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const status = req.query.status; // Optional status filter

        // Get orders
        const orders = await Order.getUserOrders(userId, status);

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get order details
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrderById = async (req, res, next) => {
    try {
        const orderId = req.params.id;

        // Get order
        const order = await Order.findById(orderId);

        if (!order) {
            return next(new ApiError('Order not found', 404));
        }

        // Check if user is authorized to view this order
        if (order.buyer_id !== req.user.id && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to view this order', 403));
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin only)
 */
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        // Validate status
        if (!['pending', 'completed', 'cancelled'].includes(status)) {
            return next(new ApiError('Invalid status', 400));
        }

        // Check if order exists
        const order = await Order.findById(orderId);

        if (!order) {
            return next(new ApiError('Order not found', 404));
        }

        // Update status
        const updated = await Order.updateStatus(orderId, status);

        if (!updated) {
            return next(new ApiError('Failed to update order status', 500));
        }

        // For completed orders, update seller's sales count
        if (status === 'completed' && order.status !== 'completed') {
            // Extract unique seller IDs from order items
            const sellerIds = [...new Set(order.items.map(item => item.seller_id))];

            // Increment sales count for each seller
            for (const sellerId of sellerIds) {
                await User.incrementSales(sellerId);
            }
        }

        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update payment status
 * @route   PUT /api/orders/:id/payment
 * @access  Private (Admin or Order Owner)
 */
exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const { paymentStatus } = req.body;

        // Validate payment status
        if (!['pending', 'paid'].includes(paymentStatus)) {
            return next(new ApiError('Invalid payment status', 400));
        }

        // Check if order exists
        const order = await Order.findById(orderId);

        if (!order) {
            return next(new ApiError('Order not found', 404));
        }

        // Check authorization
        if (order.buyer_id !== req.user.id && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to update this order', 403));
        }

        // Update payment status
        const updated = await Order.updatePaymentStatus(orderId, paymentStatus);

        if (!updated) {
            return next(new ApiError('Failed to update payment status', 500));
        }

        // If payment is completed, update order status if needed
        if (paymentStatus === 'paid' && order.status === 'pending') {
            await Order.updateStatus(orderId, 'completed');
        }

        res.status(200).json({
            success: true,
            message: `Payment status updated to ${paymentStatus}`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all orders (admin only)
 * @route   GET /api/orders/all
 * @access  Private (Admin)
 */
exports.getAllOrders = async (req, res, next) => {
    try {
        const status = req.query.status; // Optional status filter
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get orders
        const orders = await Order.getAll(status, limit, offset);

        // Get total count
        const total = await Order.count(status);

        // Calculate total pages
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            count: orders.length,
            totalOrders: total,
            totalPages,
            currentPage: page,
            orders
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get order statistics (admin only)
 * @route   GET /api/orders/stats
 * @access  Private (Admin)
 */
exports.getOrderStats = async (req, res, next) => {
    try {
        // Get stats
        const stats = await Order.getStats();

        // Get monthly sales data
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const monthlySales = await Order.getMonthlySales(year);

        res.status(200).json({
            success: true,
            stats,
            monthlySales
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Process order checkout (payment integration)
 * @route   POST /api/orders/:id/checkout
 * @access  Private
 */
exports.processCheckout = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const { paymentMethodId, paymentType } = req.body;

        // Get order
        const order = await Order.findById(orderId);

        if (!order) {
            return next(new ApiError('Order not found', 404));
        }

        // Check authorization
        if (order.buyer_id !== req.user.id) {
            return next(new ApiError('Not authorized to checkout this order', 403));
        }

        // Check if order is already paid
        if (order.payment_status === 'paid') {
            return next(new ApiError('This order has already been paid', 400));
        }

        // Process payment (this would integrate with a payment gateway in a real app)
        // This is a simplified mock implementation

        let paymentSuccessful = true;
        let errorMessage = '';

        // Simulate payment processing
        if (paymentType === 'card') {
            // Process card payment
            // In a real implementation, this would call a payment gateway API
            if (!paymentMethodId) {
                paymentSuccessful = false;
                errorMessage = 'Payment method ID is required';
            }
        } else if (paymentType === 'paypal') {
            // Process PayPal payment
            // In a real implementation, this would redirect to PayPal
            if (!paymentMethodId) {
                paymentSuccessful = false;
                errorMessage = 'PayPal token is required';
            }
        } else {
            paymentSuccessful = false;
            errorMessage = 'Invalid payment type';
        }

        if (!paymentSuccessful) {
            return next(new ApiError(`Payment failed: ${errorMessage}`, 400));
        }

        // Update payment status
        await Order.updatePaymentStatus(orderId, 'paid');

        // Update order status
        await Order.updateStatus(orderId, 'completed');

        res.status(200).json({
            success: true,
            message: 'Payment processed successfully',
            paymentStatus: 'paid',
            orderStatus: 'completed'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
exports.cancelOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;

        // Get order
        const order = await Order.findById(orderId);

        if (!order) {
            return next(new ApiError('Order not found', 404));
        }

        // Check authorization
        if (order.buyer_id !== req.user.id && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to cancel this order', 403));
        }

        // Check if order can be cancelled
        if (order.status === 'completed') {
            return next(new ApiError('Completed orders cannot be cancelled', 400));
        }

        if (order.status === 'cancelled') {
            return next(new ApiError('Order is already cancelled', 400));
        }

        // Update status
        const updated = await Order.updateStatus(orderId, 'cancelled');

        if (!updated) {
            return next(new ApiError('Failed to cancel order', 500));
        }

        // Restore product status if needed
        for (const item of order.items) {
            await Product.updateStatus(item.product_id, 'active');
        }

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        next(error);
    }
};