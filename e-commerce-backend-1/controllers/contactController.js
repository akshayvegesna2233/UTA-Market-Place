// controllers/contactController.js
const { sendContactFormHtmlEmail } = require('../services/emailService');
const Setting = require('../models/Setting');
const { ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Send contact form message
 * @route   POST /api/contact
 * @access  Public
 */
exports.sendContactMessage = async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return next(
                new ApiError('Please provide all required fields', 400)
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(new ApiError('Please provide a valid email address', 400));
        }

        // Validate message length
        if (message.length < 10) {
            return next(
                new ApiError('Message must be at least 10 characters', 400)
            );
        }

        // Prepare form data
        const formData = {
            name,
            email,
            subject,
            message
        };

        // Send email using direct HTML instead of template
        await sendContactFormHtmlEmail(formData);

        res.status(200).json({
            success: true,
            message: 'Your message has been sent. We will get back to you soon.'
        });
    } catch (error) {
        console.error('Error in sendContactMessage:', error);
        next(error);
    }
};

/**
 * @desc    Send contact form email directly
 * @route   POST /api/contact/send
 * @access  Public
 */
exports.sendContactForm = async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return next(
                new ApiError('Please provide all required fields', 400)
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(new ApiError('Please provide a valid email address', 400));
        }

        // Validate message length
        if (message.length < 10) {
            return next(
                new ApiError('Message must be at least 10 characters', 400)
            );
        }

        // Prepare form data
        const formData = {
            name,
            email,
            subject,
            message
        };

        // Send email using direct HTML
        await sendContactFormHtmlEmail(formData);

        res.status(200).json({
            success: true,
            message: 'Your message has been sent. We will get back to you soon.'
        });
    } catch (error) {
        console.error('Error in sendContactForm:', error);
        next(error);
    }
};

/**
 * @desc    Get contact information
 * @route   GET /api/contact
 * @access  Public
 */
exports.getContactInfo = async (req, res, next) => {
    try {
        // Get settings
        const settings = await Setting.getAll();

        // Prepare contact info
        const contactInfo = {
            email: settings ? settings.support_email : 'support@utamarketplace.edu',
            phone: '(817) 123-4567',
            address: {
                street: 'University of Texas at Arlington',
                address: '701 S Nedderman Dr',
                city: 'Arlington',
                state: 'TX',
                zipCode: '76019'
            },
            hours: {
                weekdays: '9:00 AM - 5:00 PM',
                weekend: 'Closed'
            },
            socialMedia: {
                facebook: 'https://facebook.com/utamarketplace',
                twitter: 'https://twitter.com/utamarketplace',
                instagram: 'https://instagram.com/utamarketplace'
            }
        };

        res.status(200).json({
            success: true,
            contactInfo
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get FAQ
 * @route   GET /api/contact/faq
 * @access  Public
 */
exports.getFAQ = async (req, res, next) => {
    try {
        // In a real app, these would come from a database
        const faqItems = [
            {
                id: 1,
                question: 'How do I create an account?',
                answer: 'To create an account, click on the "Register" button in the top-right corner of the page. You will need to use your UTA email address ending with @mavs.uta.edu to register.'
            },
            {
                id: 2,
                question: 'How can I sell an item?',
                answer: 'After logging in, navigate to the "Sell" section, click on "New Listing," and fill out the form with details about your item including its description, price, and photos.'
            },
            {
                id: 3,
                question: 'Is there a fee for using the platform?',
                answer: 'UTA Market Place charges a 5% service fee on all transactions. This fee helps us maintain the platform and provide secure payment processing.'
            },
            {
                id: 4,
                question: 'How does payment work?',
                answer: 'The platform supports secure online payments through various payment methods. You can also arrange for cash payments when meeting with the seller if both parties agree.'
            },
            {
                id: 5,
                question: 'What items are prohibited?',
                answer: 'Prohibited items include alcohol, tobacco, drugs, weapons, counterfeit goods, stolen property, and adult content. See our Terms of Service for a complete list.'
            },
            {
                id: 6,
                question: 'How do I report an inappropriate listing?',
                answer: 'On any product page, click the "Report" button. Fill out the form explaining why you believe the listing violates our policies, and our team will review it promptly.'
            },
            {
                id: 7,
                question: 'What should I do if a seller is unresponsive?',
                answer: 'If a seller hasn\'t responded within 48 hours, you can report the issue through our contact form. We recommend looking for alternative listings in the meantime.'
            },
            {
                id: 8,
                question: 'Can I cancel an order?',
                answer: 'You can cancel an order before the seller has processed it. Go to your Orders page, find the order, and click "Cancel Order." Once an order is marked as completed, it cannot be cancelled.'
            }
        ];

        // Group FAQs by categories (optional)
        const faqCategories = [
            {
                id: 1,
                name: 'Account & Registration',
                items: [faqItems[0]]
            },
            {
                id: 2,
                name: 'Buying & Selling',
                items: [faqItems[1], faqItems[2], faqItems[3]]
            },
            {
                id: 3,
                name: 'Policies & Safety',
                items: [faqItems[4], faqItems[5]]
            },
            {
                id: 4,
                name: 'Troubleshooting',
                items: [faqItems[6], faqItems[7]]
            }
        ];

        res.status(200).json({
            success: true,
            faq: {
                items: faqItems,
                categories: faqCategories
            }
        });
    } catch (error) {
        next(error);
    }
};