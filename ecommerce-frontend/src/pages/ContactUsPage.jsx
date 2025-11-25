import { useState } from 'react'
import { contactService } from '../services' // Make sure to import the service
import '../css/ContactUsPage.css'

const ContactUsPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })

    const [errors, setErrors] = useState({})
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            })
        }
    }

    const validateForm = () => {
        const newErrors = {}

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required'
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email address is invalid'
        }

        // Subject validation
        if (!formData.subject.trim()) {
            newErrors.subject = 'Subject is required'
        }

        // Message validation
        if (!formData.message.trim()) {
            newErrors.message = 'Message is required'
        } else if (formData.message.trim().length < 10) {
            newErrors.message = 'Message must be at least 10 characters'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (validateForm()) {
            setIsSubmitting(true)
            setSubmitError(null)

            try {
                // Use the contact service to send the email
                const response = await contactService.sendContactForm(formData)

                console.log('Form data submitted:', formData)
                setIsSubmitted(true)

                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    message: ''
                })
            } catch (error) {
                console.error('Error submitting form:', error)
                setSubmitError(
                    error.response?.data?.message ||
                    'There was a problem sending your message. Please try again later.'
                )
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    return (
        <div className="contact-page">
            <div className="contact-header">
                <h1>Contact Us</h1>
                <p>Have questions or feedback? We'd love to hear from you.</p>
            </div>

            <div className="contact-container">
                {/* Contact Information */}
                <div className="contact-info">
                    <h2>Get In Touch</h2>

                    <div className="info-item">
                        <div className="info-icon">📧</div>
                        <div className="info-content">
                            <h3>Email</h3>
                            <p><a href="mailto:wdmecomm@gmail.com">wdmecomm@gmail.com</a></p>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">📞</div>
                        <div className="info-content">
                            <h3>Phone</h3>
                            <p>(817) 123-4567</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">📍</div>
                        <div className="info-content">
                            <h3>Location</h3>
                            <p>University of Texas at Arlington</p>
                            <p>701 S Nedderman Dr, Arlington, TX 76019</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">⏰</div>
                        <div className="info-content">
                            <h3>Office Hours</h3>
                            <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
                            <p>Saturday - Sunday: Closed</p>
                        </div>
                    </div>

                    <div className="map-container">
                        <img
                            src="https://via.placeholder.com/600x300?text=UTA+Campus+Map"
                            alt="UTA Campus Map"
                            className="campus-map"
                        />
                    </div>
                </div>

                {/* Contact Form */}
                <div className="contact-form-container">
                    <h2>Send Us a Message</h2>

                    {isSubmitted ? (
                        <div className="success-message">
                            <div className="success-icon">✓</div>
                            <h3>Thank you for your message!</h3>
                            <p>We have received your inquiry and will respond as soon as possible.</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => setIsSubmitted(false)}
                            >
                                Send Another Message
                            </button>
                        </div>
                    ) : (
                        <form className="contact-form" onSubmit={handleSubmit}>
                            {submitError && (
                                <div className="form-error-message">
                                    {submitError}
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="name">Your Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`form-control ${errors.name ? 'error-input' : ''}`}
                                    placeholder="Enter your name"
                                    disabled={isSubmitting}
                                />
                                {errors.name && <div className="error-message">{errors.name}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`form-control ${errors.email ? 'error-input' : ''}`}
                                    placeholder="Enter your email"
                                    disabled={isSubmitting}
                                />
                                {errors.email && <div className="error-message">{errors.email}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="subject">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className={`form-control ${errors.subject ? 'error-input' : ''}`}
                                    placeholder="Enter message subject"
                                    disabled={isSubmitting}
                                />
                                {errors.subject && <div className="error-message">{errors.subject}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    className={`form-control ${errors.message ? 'error-input' : ''}`}
                                    rows="6"
                                    placeholder="Type your message here..."
                                    disabled={isSubmitting}
                                ></textarea>
                                {errors.message && <div className="error-message">{errors.message}</div>}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary submit-btn"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* FAQ Section */}
            <div className="faq-section">
                <h2>Frequently Asked Questions</h2>

                <div className="faq-grid">
                    <div className="faq-item">
                        <h3>How do I create an account?</h3>
                        <p>To create an account, click on the "Register" button in the top-right corner of the page. You will need to use your UTA email address ending with @mavs.uta.edu to register.</p>
                    </div>

                    <div className="faq-item">
                        <h3>How can I sell an item?</h3>
                        <p>After logging in, navigate to the "Sell" section, click on "New Listing," and fill out the form with details about your item including its description, price, and photos.</p>
                    </div>

                    <div className="faq-item">
                        <h3>Is there a fee for using the platform?</h3>
                        <p>No, UTA Market Place is completely free for UTA students to use. We do not charge any listing fees or commissions on sales.</p>
                    </div>

                    <div className="faq-item">
                        <h3>How does payment work?</h3>
                        <p>The platform supports secure online payments through various payment methods. You can also arrange for cash payments when meeting with the seller if both parties agree.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ContactUsPage