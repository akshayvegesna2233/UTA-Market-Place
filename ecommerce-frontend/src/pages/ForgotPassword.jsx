// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import '../css/ResetPassword.css'; // Reuse styles from ResetPassword.css

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear previous errors
        setError(null);

        // Validate email
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        try {
            setIsSubmitting(true);

            // Call the API to request password reset
            await authService.forgotPassword(email);

            // Request successful
            setSuccess(true);

            // Reset form
            setEmail('');
        } catch (err) {
            console.error('Error requesting password reset:', err);
            setError(err.response?.data?.message || 'Failed to request password reset. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="reset-password-page">
            <div className="reset-password-container">
                <h1>Forgot Your Password?</h1>

                {success ? (
                    <div className="success-message">
                        <p>Password reset instructions have been sent to your email.</p>
                        <p>Please check your inbox and follow the instructions.</p>
                        <Link to="/login" className="btn btn-primary">
                            Return to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="instructions">
                            Enter your email address below and we'll send you instructions to reset your password.
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="form-control"
                                    required
                                    disabled={isSubmitting}
                                    placeholder="Enter your UTA email"
                                />
                                <small className="help-text">Enter the email address you use to sign in</small>
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
                            </button>
                        </form>

                        <div className="links">
                            <Link to="/login">Back to Login</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;