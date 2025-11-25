// controllers/productController.js
const Product = require('../models/Product');
const Category = require('../models/Category');
const Setting = require('../models/Setting');
const { pool } = require('../config/database'); // Added this missing import
const { uploadImage, deleteFile } = require('../config/multer');
const { ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Get all products with filtering
 * @route   GET /api/products
 * @access  Public
 */
exports.getProducts = async (req, res, next) => {
    try {
        // Extract query parameters
        const {
            search = '',
            category = '',
            minPrice = '',
            maxPrice = '',
            seller = '',
            condition = '',
            sort = 'newest',
            page = 1,
            limit = 10
        } = req.query;

        // Set up options
        const options = {
            searchTerm: search,
            categoryId: category || null,
            minPrice: minPrice ? parseFloat(minPrice) : null,
            maxPrice: maxPrice ? parseFloat(maxPrice) : null,
            sellerId: seller || null,
            condition: condition || null,
            sortBy: sort,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };

        // Get products
        const products = await Product.search(options);

        // Get total count for pagination
        const total = await Product.count(options);

        // Calculate total pages
        const totalPages = Math.ceil(total / parseInt(limit));

        res.status(200).json({
            success: true,
            count: products.length,
            totalProducts: total,
            totalPages,
            currentPage: parseInt(page),
            products
        });
    } catch (error) {
        console.error('Error in getProducts:', error);
        next(error);
    }
};

/**
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProductById = async (req, res, next) => {
    try {
        const productId = req.params.id;

        // Get product details
        const product = await Product.findById(productId);

        if (!product) {
            return next(new ApiError('Product not found', 404));
        }

        // Get product images
        let images = [];
        try {
            images = await Product.getImages(productId);
        } catch (imageError) {
            console.error('Error fetching product images:', imageError);
            // Continue without images if there's an error
        }

        // Get product specifications
        let specifications = [];
        try {
            specifications = await Product.getSpecifications(productId);
        } catch (specError) {
            console.error('Error fetching product specifications:', specError);
            // Continue without specifications if there's an error
        }

        // Get related products
        let relatedProducts = [];
        try {
            relatedProducts = await Product.getRelated(productId);
        } catch (relatedError) {
            console.error('Error fetching related products:', relatedError);
            // Continue without related products if there's an error
        }

        res.status(200).json({
            success: true,
            product: {
                ...product,
                images,
                specifications,
                relatedProducts
            }
        });
    } catch (error) {
        console.error('Error in getProductById:', error);
        next(error);
    }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private
 */
exports.createProduct = async (req, res, next) => {
    try {
        // Check if admin approval required for listings
        const adminApprovalRequired = await Setting.isAdminApprovalRequired();

        // Process product data
        const {
            name,
            description,
            price,
            categoryId,
            itemCondition,
            location,
            specifications = []
        } = req.body;

        // Verify category exists
        const category = await Category.findById(categoryId);
        if (!category) {
            return next(new ApiError('Invalid category', 400));
        }

        // Set initial status (pending if admin approval required)
        const initialStatus = adminApprovalRequired ? 'pending' : 'active';

        // Create product
        const productData = {
            name,
            description,
            price,
            sellerId: req.user.id,
            categoryId,
            itemCondition,
            location,
            status: initialStatus
        };

        // For now, assume no images until we process them
        const images = [];

        // Parse specifications
        const parsedSpecs = specifications.length > 0
            ? JSON.parse(specifications)
            : [];

        // Create product
        const productId = await Product.create(productData, images, parsedSpecs);

        res.status(201).json({
            success: true,
            message: adminApprovalRequired
                ? 'Product created and pending admin approval'
                : 'Product created successfully',
            productId
        });
    } catch (error) {
        console.error('Error in createProduct:', error);
        next(error);
    }
};

/**
 * @desc    Upload product images
 * @route   POST /api/products/:id/images
 * @access  Private
 */
exports.uploadProductImages = async (req, res, next) => {
    try {
        const productId = req.params.id;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return next(new ApiError('Product not found', 404));
        }

        // Check if current user is the seller
        if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to upload images for this product', 403));
        }

        // Handle multiple file uploads
        uploadImage.array('images', 5)(req, res, async (err) => {
            if (err) {
                return next(new ApiError(err.message, 400));
            }

            if (!req.files || req.files.length === 0) {
                return next(new ApiError('Please upload at least one image', 400));
            }

            // Get existing images
            const existingImages = await Product.getImages(productId);
            const isMainImage = existingImages.length === 0;

            // Store uploaded images
            const uploadedImages = [];

            for (const file of req.files) {
                const imagePath = `/uploads/${file.filename}`;
                const imageId = await Product.addImage(
                    productId,
                    imagePath,
                    isMainImage && uploadedImages.length === 0
                );

                uploadedImages.push({
                    id: imageId,
                    url: imagePath
                });
            }

            res.status(200).json({
                success: true,
                message: 'Images uploaded successfully',
                images: uploadedImages
            });
        });
    } catch (error) {
        console.error('Error in uploadProductImages:', error);
        next(error);
    }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private
 */
exports.updateProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return next(new ApiError('Product not found', 404));
        }

        // Check if current user is the seller
        if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to update this product', 403));
        }

        // Process update data
        const {
            name,
            description,
            price,
            categoryId,
            itemCondition,
            location,
            status
        } = req.body;

        // Only admin can change status directly
        const updatedStatus = req.user.role === 'admin' ? status : undefined;

        // If changing category, verify it exists
        if (categoryId && categoryId !== product.category_id) {
            const category = await Category.findById(categoryId);
            if (!category) {
                return next(new ApiError('Invalid category', 400));
            }
        }

        console.log("Data to update:", {
            name,
            description,
            price,
            categoryId,
            itemCondition,
            location,
            status: updatedStatus
        });

        // Update product
        const updated = await Product.update(productId, {
            name,
            description,
            price,
            categoryId,
            itemCondition,
            location,
            status: updatedStatus
        });

        if (!updated) {
            return next(new ApiError('Failed to update product', 500));
        }

        res.status(200).json({
            success: true,
            message: 'Product updated successfully'
        });
    } catch (error) {
        console.error('Error in updateProduct:', error);
        next(error);
    }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private
 */
exports.deleteProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return next(new ApiError('Product not found', 404));
        }

        // Check if current user is the seller
        if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to delete this product', 403));
        }

        // Get product images to delete files
        const images = await Product.getImages(productId);

        // Delete product
        const deleted = await Product.delete(productId);

        if (!deleted) {
            return next(new ApiError('Failed to delete product', 500));
        }

        // Delete image files
        images.forEach(image => {
            if (image.image_url.startsWith('/uploads/')) {
                deleteFile(image.image_url);
            }
        });

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteProduct:', error);
        next(error);
    }
};

/**
 * @desc    Update product status (admin only)
 * @route   PUT /api/products/:id/status
 * @access  Private (Admin only)
 */
exports.updateProductStatus = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const { status } = req.body;

        // Validate status
        if (!['active', 'pending', 'sold', 'rejected'].includes(status)) {
            return next(new ApiError('Invalid status', 400));
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return next(new ApiError('Product not found', 404));
        }

        // Update status
        const updated = await Product.updateStatus(productId, status);

        if (!updated) {
            return next(new ApiError('Failed to update product status', 500));
        }

        res.status(200).json({
            success: true,
            message: `Product status updated to ${status}`
        });
    } catch (error) {
        console.error('Error in updateProductStatus:', error);
        next(error);
    }
};

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
exports.getFeaturedProducts = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 4;
        // Get featured products
        if (isNaN(limit) || limit < 1) {
            return res.status(400).json({ error: 'Invalid limit value' });
        }
        const products = await Product.getFeatured(limit);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        console.error('Error in getFeaturedProducts:', error);
        next(error);
    }
};

/**
 * @desc    Get recent products
 * @route   GET /api/products/recent
 * @access  Public
 */
exports.getRecentProducts = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 8;

        // Get recent products
        const products = await Product.getRecent(limit);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        console.error('Error in getRecentProducts:', error);
        next(error);
    }
};

/**
 * @desc    Remove product image
 * @route   DELETE /api/products/:productId/images/:imageId
 * @access  Private
 */
exports.removeProductImage = async (req, res, next) => {
    try {
        const { productId, imageId } = req.params;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return next(new ApiError('Product not found', 404));
        }

        // Check if current user is the seller
        if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to remove images from this product', 403));
        }

        // Get image to delete file
        const [imageRows] = await pool.execute(
            'SELECT * FROM product_images WHERE id = ? AND product_id = ?',
            [imageId, productId]
        );

        if (imageRows.length === 0) {
            return next(new ApiError('Image not found', 404));
        }

        const image = imageRows[0];

        // Delete image
        const deleted = await Product.removeImage(imageId);

        if (!deleted) {
            return next(new ApiError('Failed to remove image', 500));
        }

        // Delete file
        if (image.image_url.startsWith('/uploads/')) {
            deleteFile(image.image_url);
        }

        res.status(200).json({
            success: true,
            message: 'Image removed successfully'
        });
    } catch (error) {
        console.error('Error in removeProductImage:', error);
        next(error);
    }
};

/**
 * @desc    Set main product image
 * @route   PUT /api/products/:productId/images/:imageId/main
 * @access  Private
 */
exports.setMainProductImage = async (req, res, next) => {
    try {
        const { productId, imageId } = req.params;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return next(new ApiError('Product not found', 404));
        }

        // Check if current user is the seller
        if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to modify this product', 403));
        }

        // Check if image exists
        const [imageRows] = await pool.execute(
            'SELECT * FROM product_images WHERE id = ? AND product_id = ?',
            [imageId, productId]
        );

        if (imageRows.length === 0) {
            return next(new ApiError('Image not found', 404));
        }

        // Unset current main image
        await pool.execute(
            'UPDATE product_images SET is_main = 0 WHERE product_id = ?',
            [productId]
        );

        // Set new main image
        await pool.execute(
            'UPDATE product_images SET is_main = 1 WHERE id = ?',
            [imageId]
        );

        res.status(200).json({
            success: true,
            message: 'Main image updated successfully'
        });
    } catch (error) {
        console.error('Error in setMainProductImage:', error);
        next(error);
    }
};

/**
 * @desc    Add product specification
 * @route   POST /api/products/:id/specifications
 * @access  Private
 */
exports.addProductSpecification = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const { name, value } = req.body;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return next(new ApiError('Product not found', 404));
        }

        // Check if current user is the seller
        if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to modify this product', 403));
        }

        // Add specification
        const specId = await Product.addSpecification(productId, name, value);

        res.status(201).json({
            success: true,
            message: 'Specification added successfully',
            specificationId: specId
        });
    } catch (error) {
        console.error('Error in addProductSpecification:', error);
        next(error);
    }
};

/**
 * @desc    Update product specification
 * @route   PUT /api/products/:productId/specifications/:specId
 * @access  Private
 */
exports.updateProductSpecification = async (req, res, next) => {
    try {
        const { productId, specId } = req.params;
        const { value } = req.body;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return next(new ApiError('Product not found', 404));
        }

        // Check if current user is the seller
        if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to modify this product', 403));
        }

        // Check if specification exists
        const [specRows] = await pool.execute(
            'SELECT * FROM product_specifications WHERE id = ? AND product_id = ?',
            [specId, productId]
        );

        if (specRows.length === 0) {
            return next(new ApiError('Specification not found', 404));
        }

        // Update specification
        const updated = await Product.updateSpecification(specId, value);

        if (!updated) {
            return next(new ApiError('Failed to update specification', 500));
        }

        res.status(200).json({
            success: true,
            message: 'Specification updated successfully'
        });
    } catch (error) {
        console.error('Error in updateProductSpecification:', error);
        next(error);
    }
};

/**
 * @desc    Remove product specification
 * @route   DELETE /api/products/:productId/specifications/:specId
 * @access  Private
 */
exports.removeProductSpecification = async (req, res, next) => {
    try {
        const { productId, specId } = req.params;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return next(new ApiError('Product not found', 404));
        }

        // Check if current user is the seller
        if (product.seller_id !== req.user.id && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to modify this product', 403));
        }

        // Check if specification exists
        const [specRows] = await pool.execute(
            'SELECT * FROM product_specifications WHERE id = ? AND product_id = ?',
            [specId, productId]
        );

        if (specRows.length === 0) {
            return next(new ApiError('Specification not found', 404));
        }

        // Remove specification
        const deleted = await Product.removeSpecification(specId);

        if (!deleted) {
            return next(new ApiError('Failed to remove specification', 500));
        }

        res.status(200).json({
            success: true,
            message: 'Specification removed successfully'
        });
    } catch (error) {
        console.error('Error in removeProductSpecification:', error);
        next(error);
    }
};