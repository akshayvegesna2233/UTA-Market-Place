// config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Define storage strategy
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename to prevent collisions
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Define file filter for images
const imageFileFilter = (req, file, cb) => {
    // Accept only image files
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Create multer instance for image uploads
const uploadImage = multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
});

// Create multer instance for general file uploads
const uploadFile = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB file size limit
    }
});

// Helper function to delete a file
const deleteFile = (filePath) => {
    const fullPath = path.join(__dirname, '../', filePath);

    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
    }

    return false;
};

// Get file path for uploads
const getFilePath = (filename) => {
    return `/uploads/${filename}`;
};

// Custom error handler for multer
const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File too large. Maximum file size is 5MB for images and 10MB for other files.'
            });
        }
        return res.status(400).json({ message: err.message });
    } else if (err) {
        // An unknown error occurred
        return res.status(500).json({ message: err.message });
    }

    // If no error, continue
    next();
};

module.exports = {
    uploadImage,
    uploadFile,
    deleteFile,
    getFilePath,
    multerErrorHandler
};