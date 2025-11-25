import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import '../css/Auth.css'

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const navigate = useNavigate()

    const validateForm = () => {
        // Reset previous errors
        setError(null)

        // Validate email
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address')
            return false
        }

        // Validate password
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long')
            return false
        }

        // Confirm passwords match
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return false
        }

        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validate form inputs
        if (!validateForm()) return

        try {
            setLoading(true)

            // Call the direct password reset endpoint
            await authService.directPasswordReset(email, newPassword)

            setSuccess(true)
            setError(null)

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login')
            }, 3000)
        } catch (err) {
            console.error('Error resetting password:', err)
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Reset Password</h2>

                {success ? (
                    <div className="success-message">
                        <p>Password has been reset successfully!</p>
                        <p>Redirecting to login page...</p>
                    </div>
                ) : (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-control"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="form-control"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="form-control"
                                required
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>

                        <div className="auth-links">
                            <Link to="/login">Back to Login</Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default ForgotPasswordPage