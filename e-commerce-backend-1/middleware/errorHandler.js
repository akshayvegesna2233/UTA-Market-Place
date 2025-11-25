// middleware/errorHandler.js

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
    constructor(message, statusCode, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Handle duplicate key errors from MySQL
 * @param {Error} err - MySQL error
 * @returns {ApiError} Formatted API error
 */
const handleDuplicateFieldsDB = (err) => {
    const message = 'Duplicate field value';
    return new ApiError(message, 400);
};

/**
 * Handle validation errors
 * @param {Error} err - Validation error
 * @returns {ApiError} Formatted API error
 */
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(val => val.message);
    const message = `Validation failed: ${errors.join(', ')}`;
    return new ApiError(message, 400, errors);
};

/**
 * Handle JWT errors
 * @param {Error} err - JWT error
 * @returns {ApiError} Formatted API error
 */
const handleJWTError = () => {
    return new ApiError('Invalid token. Please log in again.', 401);
};

/**
 * Handle JWT expired error
 * @returns {ApiError} Formatted API error
 */
const handleJWTExpiredError = () => {
    return new ApiError('Your token has expired. Please log in again.', 401);
};

/**
 * Send error response in development environment
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode || 500).json({
        success: false,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

/**
 * Send error response in production environment
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
            errors: err.errors || []
        });
    } else {
        // Programming or other unknown error: don't leak error details
        console.error('ERROR:', err);
        res.status(500).json({
            success: false,
            message: 'Something went wrong'
        });
    }
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message;

        // Handle specific error types
        if (err.code === 'ER_DUP_ENTRY') error = handleDuplicateFieldsDB(err);
        if (err.name === 'ValidationError') error = handleValidationError(err);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};

module.exports = {
    errorHandler,
    ApiError
};

// Export as default for middleware use
module.exports.default = errorHandler;