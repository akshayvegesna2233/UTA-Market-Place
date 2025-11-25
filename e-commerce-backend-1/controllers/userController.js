// controllers/userController.js
const User = require('../models/User');
const { uploadImage, deleteFile } = require('../config/multer');
const { ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Get user profile
 * @route   GET /api/users/:id
 * @access  Public
 */
exports.getUserProfile = async (req, res, next) => {
    try {
        const userId = req.params.id;
        // Get user
        const user = await User.findById(userId);
        console.log(user);

        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                fullName: user.first_name + ' ' + user.last_name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                streetAddress: user.street_address,
                city: user.city,
                state: user.state,
                zipCode: user.zip_code,
                joinDate: user.join_date,
                role: user.role,
                status: user.status,
                notifications: {
                    emailAlerts: user.email_alerts,
                    textAlerts: user.text_alerts,
                    newMessageNotifications: user.new_message_notifications,
                    newListingNotifications: user.new_listing_notifications,
                    marketingEmails: user.marketing_emails
                },
                rating: user.rating,
                totalSales: user.total_sales
            }
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/:id
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.params.id;

        console.log('Request body:', req.body);
        console.log('Auth user ID:', req.user.id);
        console.log('URL param ID:', req.params.id);

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        // Check authorization
        if (req.user.id.toString() !== userId && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to update this profile', 403));
        }

        // Update user
        const {
            firstName, lastName, phone,
            streetAddress, city, state, zipCode,
            emailAlerts, textAlerts, newMessageNotifications,
            newListingNotifications, marketingEmails
        } = req.body;

        const updated = await User.update(userId, {
            firstName: firstName || null,
            lastName: lastName || null,
            phone: phone || null,
            streetAddress: streetAddress || null,
            city: city || null,
            state: state || null,
            zipCode: zipCode || null,
            emailAlerts: emailAlerts === undefined ? null : emailAlerts,
            textAlerts: textAlerts === undefined ? null : textAlerts,
            newMessageNotifications: newMessageNotifications === undefined ? null : newMessageNotifications,
            newListingNotifications: newListingNotifications === undefined ? null : newListingNotifications,
            marketingEmails: marketingEmails === undefined ? null : marketingEmails
        });

        if (!updated) {
            return next(new ApiError('Failed to update profile', 500));
        }

        // Get updated user
        const updatedUser = await User.findById(userId);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                avatar: updatedUser.avatar,
                streetAddress: updatedUser.street_address,
                city: updatedUser.city,
                state: updatedUser.state,
                zipCode: updatedUser.zip_code,
                notifications: {
                    emailAlerts: updatedUser.email_alerts,
                    textAlerts: updatedUser.text_alerts,
                    newMessageNotifications: updatedUser.new_message_notifications,
                    newListingNotifications: updatedUser.new_listing_notifications,
                    marketingEmails: updatedUser.marketing_emails
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Upload avatar
 * @route   POST /api/users/:id/avatar
 * @access  Private
 */
exports.uploadAvatar = async (req, res, next) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        // Check authorization
        if (req.user.id.toString() !== userId && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to update this profile', 403));
        }

        // Handle file upload
        uploadImage.single('avatar')(req, res, async (err) => {
            if (err) {
                return next(new ApiError(err.message, 400));
            }

            if (!req.file) {
                return next(new ApiError('Please upload an image file', 400));
            }

            // Delete old avatar if exists
            if (user.avatar && user.avatar.startsWith('/uploads/')) {
                deleteFile(user.avatar);
            }

            // Update user with new avatar
            const avatarPath = `/uploads/${req.file.filename}`;

            const updated = await User.update(userId, { avatar: avatarPath });

            if (!updated) {
                return next(new ApiError('Failed to update avatar', 500));
            }

            res.status(200).json({
                success: true,
                message: 'Avatar uploaded successfully',
                avatarUrl: avatarPath
            });
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user's listings
 * @route   GET /api/users/:id/listings
 * @access  Public
 */
exports.getUserListings = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const status = req.query.status || 'active'; // Default to active listings

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        // Get listings
        const listings = await User.getListings(userId, status);

        res.status(200).json({
            success: true,
            count: listings.length,
            listings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user's sales history
 * @route   GET /api/users/:id/sales
 * @access  Private
 */
exports.getUserSales = async (req, res, next) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        // Check authorization
        if (req.user.id.toString() !== userId && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to view this sales history', 403));
        }

        // Get sales
        const sales = await User.getSalesHistory(userId);

        res.status(200).json({
            success: true,
            count: sales.length,
            sales
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private
 */
exports.deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        // Check authorization
        if (req.user.id.toString() !== userId && req.user.role !== 'admin') {
            return next(new ApiError('Not authorized to delete this user', 403));
        }

        // Delete user
        const deleted = await User.delete(userId);

        if (!deleted) {
            return next(new ApiError('Failed to delete user', 500));
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};