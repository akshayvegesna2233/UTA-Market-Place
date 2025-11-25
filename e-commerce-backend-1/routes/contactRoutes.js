// routes/contactRoutes.js
const express = require('express');
const {
    sendContactMessage,
    getContactInfo,
    getFAQ,
    sendContactForm
} = require('../controllers/contactController');

const router = express.Router();

// Base routes
router.post('/', sendContactMessage);
router.get('/', getContactInfo);

// Additional routes
router.post('/send', sendContactForm);
router.get('/faq', getFAQ);

module.exports = router;