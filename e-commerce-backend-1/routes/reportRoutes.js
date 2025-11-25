// reportRoutes.js - Report management routes
const express = require('express');
const {
    createReport, getReports, getReportById, updateReportStatus,
    deleteReport, getReportStats, getPendingCount, checkUserReported
} = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// User routes
router.post('/', protect, createReport);
router.get('/check/:type/:itemId', protect, checkUserReported);

// Admin routes
router.get('/', protect, restrictTo('admin'), getReports);
router.get('/stats', protect, restrictTo('admin'), getReportStats);
router.get('/pending/count', protect, restrictTo('admin'), getPendingCount);
router.get('/:id', protect, restrictTo('admin'), getReportById);
router.put('/:id/status', protect, restrictTo('admin'), updateReportStatus);
router.delete('/:id', protect, restrictTo('admin'), deleteReport);

module.exports = router;
