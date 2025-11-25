// productRoutes.js - Product management routes
const express = require('express');
const {
    getProducts, getProductById, createProduct, updateProduct,
    deleteProduct, uploadProductImages, updateProductStatus,
    getFeaturedProducts, getRecentProducts, removeProductImage,
    setMainProductImage, addProductSpecification,
    updateProductSpecification, removeProductSpecification
} = require('../controllers/productController');
const { protect, restrictTo, verifyOwnership } = require('../middleware/auth');
const Product = require('../models/Product');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/recent', getRecentProducts);
router.get('/:id', getProductById);

// Protected routes
router.post('/', protect, createProduct);
router.put('/:id', protect, verifyOwnership(async (req) => {
    const product = await Product.findById(req.params.id);
    return product ? product.seller_id : null;
}), updateProduct);
router.delete('/:id', protect, verifyOwnership(async (req) => {
    const product = await Product.findById(req.params.id);
    return product ? product.seller_id : null;
}), deleteProduct);

// Image routes
router.post('/:id/images', protect, verifyOwnership(async (req) => {
    const product = await Product.findById(req.params.id);
    return product ? product.seller_id : null;
}), uploadProductImages);
router.delete('/:productId/images/:imageId', protect, verifyOwnership(async (req) => {
    const product = await Product.findById(req.params.productId);
    return product ? product.seller_id : null;
}), removeProductImage);
router.put('/:productId/images/:imageId/main', protect, verifyOwnership(async (req) => {
    const product = await Product.findById(req.params.productId);
    return product ? product.seller_id : null;
}), setMainProductImage);

// Specification routes
router.post('/:id/specifications', protect, verifyOwnership(async (req) => {
    const product = await Product.findById(req.params.id);
    return product ? product.seller_id : null;
}), addProductSpecification);
router.put('/:productId/specifications/:specId', protect, verifyOwnership(async (req) => {
    const product = await Product.findById(req.params.productId);
    return product ? product.seller_id : null;
}), updateProductSpecification);
router.delete('/:productId/specifications/:specId', protect, verifyOwnership(async (req) => {
    const product = await Product.findById(req.params.productId);
    return product ? product.seller_id : null;
}), removeProductSpecification);

// Admin routes
router.put('/:id/status', protect, restrictTo('admin'), updateProductStatus);

module.exports = router;
