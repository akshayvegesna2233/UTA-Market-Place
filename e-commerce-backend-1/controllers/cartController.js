// controllers/cartController.js
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { pool } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
exports.getCart = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Remove unavailable products
        await Cart.removeUnavailableItems(userId);

        // Get cart items
        const cartItems = await Cart.getItems(userId);

        // Calculate totals
        const totals = await Cart.calculateTotals(userId);

        res.status(200).json({
            success: true,
            cart: {
                items: cartItems,
                itemCount: cartItems.length,
                ...totals
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/items
 * @access  Private
 */
exports.addCartItem = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { productId, quantity = 1 } = req.body;

        // Check if product exists and is active
        const product = await Product.findById(productId);

        if (!product) {
            return next(new ApiError('Product not found', 404));
        }

        if (product.status !== 'active') {
            return next(new ApiError('Product is not available for purchase', 400));
        }

        // Check if user is trying to buy their own product
        if (product.seller_id === userId) {
            return next(new ApiError('You cannot add your own product to your cart', 400));
        }

        // Add to cart
        const cartItemId = await Cart.addItem(userId, productId, quantity);

        // Calculate updated totals
        const totals = await Cart.calculateTotals(userId);

        // Increment interested count for the product
        await Product.incrementInterested(productId);

        res.status(200).json({
            success: true,
            message: 'Item added to cart',
            cartItemId,
            totals
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/items/:id
 * @access  Private
 */
exports.updateCartItem = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const itemId = req.params.id;
        const { quantity } = req.body;

        // Check if quantity is valid
        if (!quantity || quantity < 1) {
            return next(new ApiError('Quantity must be at least 1', 400));
        }

        // Check if cart item belongs to user
        const [cartItemResult] = await pool.execute(
            'SELECT * FROM cart_items WHERE id = ?',
            [itemId]
        );

        if (cartItemResult.length === 0) {
            return next(new ApiError('Cart item not found', 404));
        }

        const cartItem = cartItemResult[0];

        if (cartItem.user_id !== userId) {
            return next(new ApiError('Not authorized to update this cart item', 403));
        }

        // Update quantity
        const updated = await Cart.updateItemQuantity(itemId, quantity);

        if (!updated) {
            return next(new ApiError('Failed to update cart item', 500));
        }

        // Calculate updated totals
        const totals = await Cart.calculateTotals(userId);

        res.status(200).json({
            success: true,
            message: 'Cart item updated',
            totals
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/items/:id
 * @access  Private
 */
exports.removeCartItem = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const itemId = req.params.id;

        // Check if cart item belongs to user
        const [cartItemResult] = await pool.execute(
            'SELECT * FROM cart_items WHERE id = ?',
            [itemId]
        );

        if (cartItemResult.length === 0) {
            return next(new ApiError('Cart item not found', 404));
        }

        const cartItem = cartItemResult[0];

        if (cartItem.user_id !== userId) {
            return next(new ApiError('Not authorized to remove this cart item', 403));
        }

        // Remove item
        const removed = await Cart.removeItem(itemId);

        if (!removed) {
            return next(new ApiError('Failed to remove cart item', 500));
        }

        // Calculate updated totals
        const totals = await Cart.calculateTotals(userId);

        res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            totals
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart
 * @access  Private
 */
exports.clearCart = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Clear cart
        await Cart.clearCart(userId);

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Validate cart items
 * @route   GET /api/cart/validate
 * @access  Private
 */
exports.validateCart = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Check for unavailable items
        const unavailableItems = await Cart.validateItems(userId);

        if (unavailableItems.length > 0) {
            return res.status(200).json({
                success: false,
                message: 'Some items in your cart are no longer available',
                unavailableItems
            });
        }

        // Get cart items
        const cartItems = await Cart.getItems(userId);

        // Check if cart is empty
        if (cartItems.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'Your cart is empty'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cart is valid',
            itemCount: cartItems.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get cart item count
 * @route   GET /api/cart/count
 * @access  Private
 */
exports.getCartItemCount = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get count
        const count = await Cart.getItemCount(userId);

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Check if product is in cart
 * @route   GET /api/cart/check/:productId
 * @access  Private
 */
exports.checkProductInCart = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const productId = req.params.productId;

        // Check if product is in cart
        const isInCart = await Cart.isProductInCart(userId, productId);

        res.status(200).json({
            success: true,
            isInCart
        });
    } catch (error) {
        next(error);
    }
};