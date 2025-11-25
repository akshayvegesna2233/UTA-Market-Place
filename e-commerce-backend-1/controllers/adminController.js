// controllers/adminController.js
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Report = require('../models/Report');
const Setting = require('../models/Setting');
const { ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Get admin dashboard overview
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin)
 */
exports.getDashboardOverview = async (req, res, next) => {
    try {
        // Get user stats
        const userStats = {
            totalUsers: await User.count(),
            newUsersToday: await User.getNewUsersCount(1)
        };

        // Get product stats
        const productStats = await Product.getStats();

        // Get order stats
        const orderStats = await Order.getStats();

        // Get report stats
        const reportStats = await Report.getStats();

        // Get pending reports count
        const pendingReports = await Report.getPendingCount();

        // Get recent activity (most recent listings, orders, reports)
        const [recentListings] = await pool.execute(
            `SELECT p.id, p.name, p.price, p.status, p.created_at, 
       u.first_name as seller_first_name, u.last_name as seller_last_name
       FROM products p
       JOIN users u ON p.seller_id = u.id
       ORDER BY p.created_at DESC
       LIMIT 5`
        );

        const [recentOrders] = await pool.execute(
            `SELECT o.id, o.total, o.status, o.created_at,
       u.first_name as buyer_first_name, u.last_name as buyer_last_name
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 5`
        );

        res.status(200).json({
            success: true,
            dashboardStats: {
                userStats,
                productStats,
                orderStats,
                reportStats,
                pendingReports,
                recentActivity: {
                    listings: recentListings,
                    orders: recentOrders
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
exports.getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get users
        const users = await User.getAll(limit, offset);

        // Get total count
        const total = await User.count();

        // Calculate total pages
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            count: users.length,
            totalUsers: total,
            totalPages,
            currentPage: page,
            users
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update user status (admin only)
 * @route   PUT /api/admin/users/:id/status
 * @access  Private (Admin)
 */
exports.updateUserStatus = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { status } = req.body;

        // Validate status
        if (!['active', 'inactive', 'suspended'].includes(status)) {
            return next(new ApiError('Invalid status', 400));
        }

        // Check if user exists
        const user = await User.findById(userId);

        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        // Prevent changing admin status
        if (user.role === 'admin' && req.user.id !== userId) {
            return next(
                new ApiError('Cannot change the status of another admin user', 403)
            );
        }

        // Update status
        const updated = await User.updateStatus(userId, status);

        if (!updated) {
            return next(new ApiError('Failed to update user status', 500));
        }

        res.status(200).json({
            success: true,
            message: `User status updated to ${status}`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update user role (admin only)
 * @route   PUT /api/admin/users/:id/role
 * @access  Private (Admin)
 */
exports.updateUserRole = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;

        // Validate role
        if (!['user', 'admin'].includes(role)) {
            return next(new ApiError('Invalid role', 400));
        }

        // Check if user exists
        const user = await User.findById(userId);

        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        // Prevent changing your own role
        if (req.user.id === userId) {
            return next(
                new ApiError('You cannot change your own role', 403)
            );
        }

        // Update role
        const updated = await User.updateRole(userId, role);

        if (!updated) {
            return next(new ApiError('Failed to update user role', 500));
        }

        res.status(200).json({
            success: true,
            message: `User role updated to ${role}`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get pending products (admin only)
 * @route   GET /api/admin/products/pending
 * @access  Private (Admin)
 */
exports.getPendingProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get pending products
        const products = await Product.getPending(limit, offset);

        // Get total count
        const total = await Product.countPending();

        // Calculate total pages
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            count: products.length,
            totalProducts: total,
            totalPages,
            currentPage: page,
            products
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Approve or reject product (admin only)
 * @route   PUT /api/admin/products/:id/review
 * @access  Private (Admin)
 */
exports.reviewProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const { status, reason } = req.body;

        // Validate status
        if (!['active', 'rejected'].includes(status)) {
            return next(new ApiError('Invalid status', 400));
        }

        // Check if product exists
        const product = await Product.findById(productId);

        if (!product) {
            return next(new ApiError('Product not found', 404));
        }

        // Check if product is pending
        if (product.status !== 'pending') {
            return next(
                new ApiError('Only pending products can be approved or rejected', 400)
            );
        }

        // Update status
        const updated = await Product.updateStatus(productId, status);

        if (!updated) {
            return next(new ApiError('Failed to update product status', 500));
        }

        // If rejecting, could store reason in a separate table or send notification to seller

        res.status(200).json({
            success: true,
            message: status === 'active' ? 'Product approved' : 'Product rejected'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get platform settings (admin only)
 * @route   GET /api/admin/settings
 * @access  Private (Admin)
 */
exports.getSettings = async (req, res, next) => {
    try {
        // Get settings
        const settings = await Setting.getAll();

        if (!settings) {
            // Initialize default settings if none exist
            await Setting.initialize();
            const defaultSettings = await Setting.getAll();

            return res.status(200).json({
                success: true,
                settings: defaultSettings
            });
        }

        res.status(200).json({
            success: true,
            settings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update platform settings (admin only)
 * @route   PUT /api/admin/settings
 * @access  Private (Admin)
 */
exports.updateSettings = async (req, res, next) => {
    try {
        const {
            platformName,
            supportEmail,
            itemsPerPage,
            commissionRate,
            minCommission,
            requireEmailVerification,
            requireAdminApproval,
            enableTwoFactor
        } = req.body;

        // Update settings
        const updated = await Setting.update({
            platformName,
            supportEmail,
            itemsPerPage,
            commissionRate,
            minCommission,
            requireEmailVerification,
            requireAdminApproval,
            enableTwoFactor
        });

        if (!updated) {
            return next(new ApiError('Failed to update settings', 500));
        }

        // Get updated settings
        const settings = await Setting.getAll();

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            settings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reset platform settings to defaults (admin only)
 * @route   POST /api/admin/settings/reset
 * @access  Private (Admin)
 */
exports.resetSettings = async (req, res, next) => {
    try {
        // Reset to defaults
        const reset = await Setting.resetToDefaults();

        if (!reset) {
            return next(new ApiError('Failed to reset settings', 500));
        }

        // Get updated settings
        const settings = await Setting.getAll();

        res.status(200).json({
            success: true,
            message: 'Settings reset to defaults',
            settings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Generate sales report (admin only)
 * @route   GET /api/admin/reports/sales
 * @access  Private (Admin)
 */
exports.getSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // Validate dates
        if (!startDate || !endDate) {
            return next(new ApiError('Start date and end date are required', 400));
        }

        // Get sales data
        const [salesData] = await pool.execute(
            `SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total) as revenue,
        SUM(service_fee) as fees
       FROM orders
       WHERE status = 'completed'
       AND created_at BETWEEN ? AND ?
       GROUP BY DATE(created_at)
       ORDER BY date`,
            [startDate, endDate]
        );

        // Get totals
        const [totals] = await pool.execute(
            `SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        SUM(service_fee) as total_fees
       FROM orders
       WHERE status = 'completed'
       AND created_at BETWEEN ? AND ?`,
            [startDate, endDate]
        );

        // Get top categories
        const [topCategories] = await pool.execute(
            `SELECT 
        c.name as category,
        COUNT(DISTINCT oi.order_id) as orders,
        SUM(oi.price_at_purchase * oi.quantity) as revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 'completed'
       AND o.created_at BETWEEN ? AND ?
       GROUP BY c.id
       ORDER BY revenue DESC
       LIMIT 5`,
            [startDate, endDate]
        );

        // Get top sellers
        const [topSellers] = await pool.execute(
            `SELECT 
        CONCAT(u.first_name, ' ', u.last_name) as seller,
        COUNT(DISTINCT oi.order_id) as orders,
        SUM(oi.price_at_purchase * oi.quantity) as revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN users u ON p.seller_id = u.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 'completed'
       AND o.created_at BETWEEN ? AND ?
       GROUP BY u.id
       ORDER BY revenue DESC
       LIMIT 5`,
            [startDate, endDate]
        );

        res.status(200).json({
            success: true,
            report: {
                dateRange: {
                    startDate,
                    endDate
                },
                salesData,
                totals: totals[0],
                topCategories,
                topSellers
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Generate user activity report (admin only)
 * @route   GET /api/admin/reports/users
 * @access  Private (Admin)
 */
exports.getUserActivityReport = async (req, res, next) => {
    try {
        const { days = 30 } = req.query;

        // Get new users per day
        const [newUsers] = await pool.execute(
            `SELECT 
        DATE(join_date) as date,
        COUNT(*) as count
       FROM users
       WHERE join_date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
       GROUP BY DATE(join_date)
       ORDER BY date`,
            [days]
        );

        // Get active users (those who placed orders)
        const [activeUsers] = await pool.execute(
            `SELECT 
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.buyer_id) as count
       FROM orders o
       WHERE o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
       GROUP BY DATE(o.created_at)
       ORDER BY date`,
            [days]
        );

        // Get user roles distribution
        const [roleDistribution] = await pool.execute(
            `SELECT 
        role,
        COUNT(*) as count
       FROM users
       GROUP BY role`
        );

        // Get user status distribution
        const [statusDistribution] = await pool.execute(
            `SELECT 
        status,
        COUNT(*) as count
       FROM users
       GROUP BY status`
        );

        res.status(200).json({
            success: true,
            report: {
                newUsers,
                activeUsers,
                roleDistribution,
                statusDistribution
            }
        });
    } catch (error) {
        next(error);
    }
};