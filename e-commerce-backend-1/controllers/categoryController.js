// controllers/categoryController.js
const Category = require('../models/Category');
const { ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
exports.getCategories = async (req, res, next) => {
    try {
        // Get all categories
        const categories = await Category.getAll();

        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
exports.getCategoryById = async (req, res, next) => {
    try {
        const categoryId = req.params.id;

        // Get category
        const category = await Category.findById(categoryId);

        if (!category) {
            return next(new ApiError('Category not found', 404));
        }

        res.status(200).json({
            success: true,
            category
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new category (admin only)
 * @route   POST /api/categories
 * @access  Private (Admin)
 */
exports.createCategory = async (req, res, next) => {
    try {
        const { name, icon } = req.body;

        // Check if category exists
        const existingCategory = await Category.findByName(name);
        if (existingCategory) {
            return next(new ApiError('Category already exists', 400));
        }

        // Create category
        const categoryId = await Category.create({ name, icon });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            categoryId
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update category (admin only)
 * @route   PUT /api/categories/:id
 * @access  Private (Admin)
 */
exports.updateCategory = async (req, res, next) => {
    try {
        const categoryId = req.params.id;
        const { name, icon } = req.body;

        // Check if category exists
        const category = await Category.findById(categoryId);
        if (!category) {
            return next(new ApiError('Category not found', 404));
        }

        // Check if name already exists (if changing name)
        if (name && name !== category.name) {
            const existingCategory = await Category.findByName(name);
            if (existingCategory) {
                return next(new ApiError('Category name already exists', 400));
            }
        }

        // Update category
        const updated = await Category.update(categoryId, { name, icon });

        if (!updated) {
            return next(new ApiError('Failed to update category', 500));
        }

        res.status(200).json({
            success: true,
            message: 'Category updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete category (admin only)
 * @route   DELETE /api/categories/:id
 * @access  Private (Admin)
 */
exports.deleteCategory = async (req, res, next) => {
    try {
        const categoryId = req.params.id;

        // Check if category exists
        const category = await Category.findById(categoryId);
        if (!category) {
            return next(new ApiError('Category not found', 404));
        }

        // Check if there are products in this category
        const [productCountResult] = await pool.execute(
            'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
            [categoryId]
        );

        if (productCountResult[0].count > 0) {
            return next(
                new ApiError('Cannot delete category with existing products', 400)
            );
        }

        // Delete category
        const deleted = await Category.delete(categoryId);

        if (!deleted) {
            return next(new ApiError('Failed to delete category', 500));
        }

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get product counts by category
 * @route   GET /api/categories/product-counts
 * @access  Public
 */
exports.getProductCounts = async (req, res, next) => {
    try {
        // Get product counts
        const categoryCounts = await Category.getProductCounts();

        res.status(200).json({
            success: true,
            categories: categoryCounts
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get popular categories
 * @route   GET /api/categories/popular
 * @access  Public
 */
exports.getPopularCategories = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        // Get popular categories
        const categories = await Category.getPopular(limit);

        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        next(error);
    }
};