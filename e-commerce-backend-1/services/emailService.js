const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');
require('dotenv').config();

// Create email transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verify transporter
const verifyTransporter = async () => {
    try {
        await transporter.verify();
        console.log('Email service is ready');
        return true;
    } catch (error) {
        console.error('Email service error:', error);
        return false;
    }
};

// Load email template
const loadTemplate = (templateName) => {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    return handlebars.compile(templateSource);
};

// Send email
const sendEmail = async (options) => {
    try {
        const { to, subject, template, context } = options;

        // Compile template
        let html;
        if (template) {
            const compiledTemplate = loadTemplate(template);
            html = compiledTemplate(context);
        }

        // Set up email options
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"UTA Market Place" <support@utamarketplace.edu>',
            to,
            subject,
            html: html || options.html,
            text: options.text || ''
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

// Send welcome email
const sendWelcomeEmail = async (user, verificationUrl) => {
    return sendEmail({
        to: user.email,
        subject: 'Welcome to UTA Market Place',
        template: 'welcome',
        context: {
            firstName: user.first_name,
            verificationUrl
        }
    });
};

// Send email verification
const sendVerificationEmail = async (user, verificationUrl) => {
    return sendEmail({
        to: user.email,
        subject: 'Verify Your Email Address',
        template: 'verification',
        context: {
            firstName: user.first_name,
            verificationUrl
        }
    });
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetUrl) => {
    return sendEmail({
        to: user.email,
        subject: 'Reset Your Password',
        template: 'password-reset',
        context: {
            firstName: user.first_name,
            resetUrl
        }
    });
};

// Send order confirmation
const sendOrderConfirmation = async (user, order, items) => {
    return sendEmail({
        to: user.email,
        subject: 'Order Confirmation - UTA Market Place',
        template: 'order-confirmation',
        context: {
            firstName: user.first_name,
            orderId: order.id,
            orderDate: new Date(order.created_at).toLocaleDateString(),
            items,
            subtotal: order.total - order.service_fee,
            serviceFee: order.service_fee,
            total: order.total
        }
    });
};

// Send new message notification
const sendMessageNotification = async (user, sender, conversationId, productName) => {
    return sendEmail({
        to: user.email,
        subject: 'New Message - UTA Market Place',
        template: 'message-notification',
        context: {
            firstName: user.first_name,
            senderName: `${sender.first_name} ${sender.last_name}`,
            productName,
            messageUrl: `${process.env.CLIENT_URL}/messages/${conversationId}`
        }
    });
};

// Send contact form email
const sendContactFormEmail = async (formData) => {
    return sendEmail({
        to: process.env.CONTACT_EMAIL || 'support@utamarketplace.edu',
        subject: `Contact Form: ${formData.subject}`,
        template: 'contact-form',
        context: {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message
        }
    });
};

// Send contact form email with direct HTML (no template)
const sendContactFormHtmlEmail = async (formData) => {
    try {
        // Create HTML email content directly
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Contact Form Submission</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                    }
                    .email-container {
                        border: 1px solid #e0e0e0;
                        border-radius: 5px;
                        overflow: hidden;
                    }
                    .email-header {
                        background-color: #bf5700; /* UTA orange */
                        color: white;
                        padding: 20px;
                        text-align: center;
                    }
                    .email-body {
                        padding: 20px;
                        background-color: #fff;
                    }
                    .email-footer {
                        background-color: #f5f5f5;
                        padding: 15px;
                        text-align: center;
                        font-size: 12px;
                        color: #777;
                    }
                    .message-box {
                        background-color: #f9f9f9;
                        border-left: 3px solid #bf5700;
                        padding: 15px;
                        margin: 20px 0;
                    }
                    .field-name {
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .btn {
                        display: inline-block;
                        background-color: #bf5700;
                        color: white;
                        padding: 10px 20px;
                        text-decoration: none;
                        border-radius: 4px;
                        margin-top: 15px;
                    }
                    .field-details {
                        margin-bottom: 15px;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="email-header">
                        <h2>UTA Market Place Contact Form</h2>
                    </div>
                    <div class="email-body">
                        <h3>New Contact Form Submission</h3>
                        <p>You have received a new message from the UTA Market Place contact form:</p>
                        
                        <div class="field-details">
                            <div class="field-name">Name:</div>
                            <p>${formData.name}</p>
                        </div>
                        
                        <div class="field-details">
                            <div class="field-name">Email:</div>
                            <p><a href="mailto:${formData.email}">${formData.email}</a></p>
                        </div>
                        
                        <div class="field-details">
                            <div class="field-name">Subject:</div>
                            <p>${formData.subject}</p>
                        </div>
                        
                        <div class="message-box">
                            <div class="field-name">Message:</div>
                            <p>${formData.message.replace(/\n/g, '<br>')}</p>
                        </div>
                        
                        <p>Please respond to this inquiry as soon as possible.</p>
                        
                        <a href="mailto:${formData.email}" class="btn">Reply to ${formData.name}</a>
                    </div>
                    <div class="email-footer">
                        <p>&copy; ${new Date().getFullYear()} UTA Market Place. All rights reserved.</p>
                        <p>University of Texas at Arlington, 701 S Nedderman Dr, Arlington, TX 76019</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send the email
        return await sendEmail({
            to: 'wdmecomm@gmail.com',
            subject: `UTA Market Place: Contact Form - ${formData.subject}`,
            html: htmlContent
        });
    } catch (error) {
        console.error('Error sending contact form HTML email:', error);
        throw error;
    }
};

module.exports = {
    verifyTransporter,
    sendEmail,
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendOrderConfirmation,
    sendMessageNotification,
    sendContactFormEmail,
    sendContactFormHtmlEmail
};