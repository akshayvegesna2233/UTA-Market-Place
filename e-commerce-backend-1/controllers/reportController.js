// controllers/reportController.js
const Report = require('../models/Report');
const User = require('../models/User');
const Product = require('../models/Product');
const { ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Create a new report
 * @route   POST /api/reports
 * @access  Private
 */
exports.createReport = async (req, res, next) => {
    try {
        const { type, itemId, reason } = req.body;
        const userId = req.user.id;

        // Validate report type
        if (!['User', 'Listing'].includes(type)) {
            return next(new ApiError('Invalid report type', 400));
        }

        // Validate reason
        if (!reason || reason.trim() === '') {
            return next(new ApiError('Reason is required', 400));
        }

        // Check if item exists
        if (type === 'User') {
            const user = await User.findById(itemId);
            if (!user) {
                return next(new ApiError('User not found', 404));
            }

            // Cannot report yourself
            if (user.id === userId) {
                return next(new ApiError('You cannot report yourself', 400));
            }
        } else if (type === 'Listing') {
            const product = await Product.findById(itemId);
            if (!product) {
                return next(new ApiError('Product not found', 404));
            }

            // Cannot report your own listing
            if (product.seller_id === userId) {
                return next(new ApiError('You cannot report your own listing', 400));
            }
        }

        // Check if user has already reported this item
        const hasReported = await Report.hasUserReportedItem(userId, type, itemId);
        if (hasReported) {
            return next(
                new ApiError('You have already reported this item', 400)
            );
        }

        // Create report
        const reportData = {
            type,
            itemId,
            reportedById: userId,
            reason
        };

        const reportId = await Report.create(reportData);

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully. Our team will review it.',
            reportId
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all reports (admin only)
 * @route   GET /api/reports
 * @access  Private (Admin)
 */
exports.getReports = async (req, res, next) => {
    try {
        const status = req.query.status; // Optional status filter
        const type = req.query.type; // Optional type filter
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get reports
        const reports = await Report.getAll(status, type, limit, offset);

        // Get total count
        const total = await Report.count(status, type);

        // Calculate total pages
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            count: reports.length,
            totalReports: total,
            totalPages,
            currentPage: page,
            reports
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get report by ID (admin only)
 * @route   GET /api/reports/:id
 * @access  Private (Admin)
 */
exports.getReportById = async (req, res, next) => {
    try {
        const reportId = req.params.id;

        // Get report
        const report = await Report.findById(reportId);

        if (!report) {
            return next(new ApiError('Report not found', 404));
        }

        res.status(200).json({
            success: true,
            report
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update report status (admin only)
 * @route   PUT /api/reports/:id/status
 * @access  Private (Admin)
 */
exports.updateReportStatus = async (req, res, next) => {
    try {
        const reportId = req.params.id;
        const { status } = req.body;

        // Validate status
        if (!['pending', 'resolved', 'dismissed'].includes(status)) {
            return next(new ApiError('Invalid status', 400));
        }

        // Check if report exists
        const report = await Report.findById(reportId);

        if (!report) {
            return next(new ApiError('Report not found', 404));
        }

        // Update status
        const updated = await Report.updateStatus(reportId, status);

        if (!updated) {
            return next(new ApiError('Failed to update report status', 500));
        }

        // Take action based on status and type if needed
        if (status === 'resolved') {
            // For example, if a listing is reported and the report is resolved,
            // you might want to suspend the listing
            if (report.type === 'Listing') {
                await Product.updateStatus(report.item_id, 'suspended');
            }
            // If a user is reported, you might want to flag their account for review
            else if (report.type === 'User') {
                // This would depend on your business rules
                // await User.updateStatus(report.item_id, 'flagged');
            }
        }

        res.status(200).json({
            success: true,
            message: `Report status updated to ${status}`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete report (admin only)
 * @route   DELETE /api/reports/:id
 * @access  Private (Admin)
 */
exports.deleteReport = async (req, res, next) => {
    try {
        const reportId = req.params.id;

        // Check if report exists
        const report = await Report.findById(reportId);

        if (!report) {
            return next(new ApiError('Report not found', 404));
        }

        // Delete report
        const deleted = await Report.delete(reportId);

        if (!deleted) {
            return next(new ApiError('Failed to delete report', 500));
        }

        res.status(200).json({
            success: true,
            message: 'Report deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get report statistics (admin only)
 * @route   GET /api/reports/stats
 * @access  Private (Admin)
 */
exports.getReportStats = async (req, res, next) => {
    try {
        // Get stats
        const stats = await Report.getStats();

        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get pending reports count (admin only)
 * @route   GET /api/reports/pending/count
 * @access  Private (Admin)
 */
exports.getPendingCount = async (req, res, next) => {
    try {
        // Get count
        const count = await Report.getPendingCount();

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Check if user has reported an item
 * @route   GET /api/reports/check/:type/:itemId
 * @access  Private
 */
exports.checkUserReported = async (req, res, next) => {
    try {
        const { type, itemId } = req.params;
        const userId = req.user.id;

        // Validate report type
        if (!['User', 'Listing'].includes(type)) {
            return next(new ApiError('Invalid report type', 400));
        }

        // Check if user has reported the item
        const hasReported = await Report.hasUserReportedItem(userId, type, itemId);

        res.status(200).json({
            success: true,
            hasReported
        });
    } catch (error) {
        next(error);
    }
};