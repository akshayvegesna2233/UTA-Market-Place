// src/services/contactService.js
import apiClient from './api';

const contactService = {
    // Send contact form message
    sendContactMessage: async (formData) => {
        return await apiClient.post('/contact', formData);
    },

    // Get contact information
    getContactInfo: async () => {
        return await apiClient.get('/contact');
    },

    // Send contact form (direct HTML email)
    sendContactForm: async (formData) => {
        return await apiClient.post('/contact/send', formData);
    },

    // Get FAQ
    getFAQ: async () => {
        return await apiClient.get('/contact/faq');
    }
};

export default contactService;