// adminRoutes.js - Admin dashboard routes
const express = require('express');
const {
    getDashboardOverview, getUsers, updateUserStatus, updateUserRole,
    getPendingProducts, reviewProduct, getSettings, updateSettings,
    resetSettings, getSalesReport, getUserActivityReport
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All routes require admin privileges
router.use(protect);
router.use(restrictTo('admin'));

router.get('/dashboard', getDashboardOverview);
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.get('/products/pending', getPendingProducts);
router.put('/products/:id/review', reviewProduct);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/settings/reset', resetSettings);
router.get('/reports/sales', getSalesReport);
router.get('/reports/users', getUserActivityReport);

module.exports = router;