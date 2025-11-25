// categoryRoutes.js - Category management routes
const express = require('express');
const {
    getCategories, getCategoryById, createCategory,
    updateCategory, deleteCategory, getProductCounts, getPopularCategories
} = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/popular', getPopularCategories);
router.get('/product-counts', getProductCounts);
router.get('/:id', getCategoryById);

// Admin routes
router.post('/', protect, restrictTo('admin'), createCategory);
router.put('/:id', protect, restrictTo('admin'), updateCategory);
router.delete('/:id', protect, restrictTo('admin'), deleteCategory);

module.exports = router;