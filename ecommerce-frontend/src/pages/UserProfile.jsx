import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userService, orderService } from '../services'
import authService from '../services/authService'
import '../css/UserProfile.css'

const UserProfile = () => {
    const { user: authUser, logout } = useAuth()
    const navigate = useNavigate()

    // State for user data
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // State for orders
    const [orderHistory, setOrderHistory] = useState([])
    const [ordersLoading, setOrdersLoading] = useState(true)
    const [ordersError, setOrdersError] = useState(null)

    // State for active tab
    const [activeTab, setActiveTab] = useState('profile')

    // State for edit mode
    const [isEditing, setIsEditing] = useState(false)

    // State for form data during edit
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        notifications: {
            emailAlerts: false,
            textAlerts: false,
            newMessages: false,
            newListings: false,
            marketingEmails: false
        }
    })

    // State for password reset
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [passwordError, setPasswordError] = useState(null)
    const [passwordSuccess, setPasswordSuccess] = useState(null)

    // State for forgot password
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
    const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(null)
    const [forgotPasswordError, setForgotPasswordError] = useState(null)
    const [showForgotPassword, setShowForgotPassword] = useState(false)

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true)
                const response = await userService.getUserProfile(authUser.id)

                // Format the data to match our component structure
                const user = response.data.user
                console.log(response.data)

                setUserData({
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: authUser.email, // From auth context since API might not return it
                    phone: user.phone || '',
                    avatar: user.avatar,
                    joinDate: user.joinDate,
                    address: {
                        street: user.streetAddress || '',
                        city: user.city || '',
                        state: user.state || '',
                        zipCode: user.zipCode || ''
                    },
                    notifications: {
                        emailAlerts: user.notifications?.emailAlerts || false,
                        textAlerts: user.notifications?.textAlerts || false,
                        newMessages: user.notifications?.newMessageNotifications || false,
                        newListings: user.notifications?.newListingNotifications || false,
                        marketingEmails: user.notifications?.marketingEmails || false
                    }
                })

                // Setup form data for editing
                setFormData({
                    name: `${user.firstName} ${user.lastName}`,
                    email: authUser.email,
                    phone: user.phone || '',
                    street: user.streetAddress || '',
                    city: user.city || '',
                    state: user.state || '',
                    zipCode: user.zipCode || '',
                    notifications: {
                        emailAlerts: user.notifications?.emailAlerts || false,
                        textAlerts: user.notifications?.textAlerts || false,
                        newMessages: user.notifications?.newMessageNotifications || false,
                        newListings: user.notifications?.newListingNotifications || false,
                        marketingEmails: user.notifications?.marketingEmails || false
                    }
                })

                setLoading(false)
            } catch (err) {
                console.error("Error fetching user data:", err)
                setError('Failed to load profile information')
                setLoading(false)
            }
        }

        if (authUser && authUser.id) {
            fetchUserData()
        }
    }, [authUser])

    // Load notification settings from local storage (only once on mount)
    useEffect(() => {
        const loadLocalNotificationSettings = () => {
            try {
                const storedSettings = localStorage.getItem('notificationSettings')
                if (storedSettings) {
                    const parsedSettings = JSON.parse(storedSettings)

                    // Update form data with local settings
                    setFormData(prevData => ({
                        ...prevData,
                        notifications: {
                            ...prevData.notifications,
                            ...parsedSettings
                        }
                    }))

                    // If the user data is loaded, also update the UI display
                    if (userData) {
                        // Check if values are actually different before updating
                        const needsUpdate = Object.entries(parsedSettings).some(
                            ([key, value]) => userData.notifications[key] !== value
                        )

                        if (needsUpdate) {
                            setUserData(prevUserData => ({
                                ...prevUserData,
                                notifications: {
                                    ...prevUserData.notifications,
                                    ...parsedSettings
                                }
                            }))
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading notification settings from local storage:", error)
            }
        }

        loadLocalNotificationSettings()
    }, []) // Empty dependency array - only run once on mount

// Separate effect to update userData when it becomes available
    useEffect(() => {
        if (userData) {
            try {
                const storedSettings = localStorage.getItem('notificationSettings')
                if (storedSettings) {
                    const parsedSettings = JSON.parse(storedSettings)

                    // Check if values are actually different before updating
                    const needsUpdate = Object.entries(parsedSettings).some(
                        ([key, value]) => userData.notifications[key] !== value
                    )

                    if (needsUpdate) {
                        setUserData(prevUserData => ({
                            ...prevUserData,
                            notifications: {
                                ...prevUserData.notifications,
                                ...parsedSettings
                            }
                        }))
                    }
                }
            } catch (error) {
                console.error("Error syncing notification settings:", error)
            }
        }
    }, [userData]) // This will run only when userData changes

    // Fetch order history
    useEffect(() => {
        const fetchOrderHistory = async () => {
            try {
                setOrdersLoading(true)
                const response = await orderService.getUserOrders()

                // Format orders to match our component structure
                const formattedOrders = response.data.orders.map(order => ({
                    id: order.id,
                    date: order.created_at,
                    items: Array.isArray(order.items) ? order.items.map(item => ({
                        name: item.product_name,
                        price: item.price_at_purchase
                    })) : [],
                    total: order.total,
                    seller: Array.isArray(order.items) && order.items.length > 0
                        ? order.items[0].seller_name || 'Unknown Seller'
                        : 'Unknown Seller',
                    status: order.status,
                    image: order.image
                }))

                setOrderHistory(formattedOrders)
                setOrdersLoading(false)
            } catch (err) {
                console.error("Error fetching order history:", err)
                setOrdersError('Failed to load purchase history')
                setOrdersLoading(false)
            }
        }

        if (activeTab === 'orders' && authUser) {
            fetchOrderHistory()
        }
    }, [activeTab, authUser])

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })
    }

    // Handle notification toggle with local storage
    const handleNotificationToggle = (e) => {
        const { name, checked } = e.target

        // Update formData state
        setFormData({
            ...formData,
            notifications: {
                ...formData.notifications,
                [name]: checked
            }
        })

        // Save to local storage
        try {
            // Get current settings
            const currentSettings = localStorage.getItem('notificationSettings')
                ? JSON.parse(localStorage.getItem('notificationSettings'))
                : {}

            // Update with new setting
            const updatedSettings = {
                ...currentSettings,
                [name]: checked
            }

            // Save back to local storage
            localStorage.setItem('notificationSettings', JSON.stringify(updatedSettings))
        } catch (error) {
            console.error("Error saving notification settings to local storage:", error)
        }
    }

    // Handle password input changes
    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target
        setPasswordData({
            ...passwordData,
            [name]: value
        })
    }

    // Handle password reset
    const handlePasswordReset = async (e) => {
        e.preventDefault()

        // Clear previous messages
        setPasswordError(null)
        setPasswordSuccess(null)

        // Validate passwords match
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match')
            return
        }

        // Validate password strength (example: at least 8 characters)
        if (passwordData.newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters long')
            return
        }

        try {
            // Call the API to change password
            await authService.changePassword(
                passwordData.currentPassword,
                passwordData.newPassword
            )

            setPasswordSuccess('Password changed successfully')

            // Reset password form
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            })
        } catch (err) {
            console.error("Error changing password:", err)
            setPasswordError(err.response?.data?.message || 'Failed to change password. Please check your current password and try again.')
        }
    }

    // Handle forgot password
    const handleForgotPassword = async (e) => {
        e.preventDefault()

        // Clear previous messages
        setForgotPasswordError(null)
        setForgotPasswordSuccess(null)

        // Validate email
        if (!forgotPasswordEmail || !forgotPasswordEmail.includes('@')) {
            setForgotPasswordError('Please enter a valid email address')
            return
        }

        try {
            // Call the API to initiate password reset
            await authService.forgotPassword(forgotPasswordEmail)

            setForgotPasswordSuccess('Password reset initiated. Please check your email for further instructions.')

            // Reset form
            setForgotPasswordEmail('')
        } catch (err) {
            console.error("Error initiating password reset:", err)
            setForgotPasswordError(err.response?.data?.message || 'Failed to initiate password reset. Please try again.')
        }
    }

    // Handle save profile
    const handleSaveProfile = async (e) => {
        e.preventDefault()

        try {
            // Split name into first and last name
            const [firstName, ...lastNameParts] = formData.name.trim().split(' ')
            const lastName = lastNameParts.join(' ')

            const profileData = {
                firstName,
                lastName,
                phone: formData.phone,
                streetAddress: formData.street,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
                emailAlerts: formData.notifications.emailAlerts,
                textAlerts: formData.notifications.textAlerts,
                newMessageNotifications: formData.notifications.newMessages,
                newListingNotifications: formData.notifications.newListings,
                marketingEmails: formData.notifications.marketingEmails
            }

            const response = await userService.updateProfile(userData.id, profileData)

            // Update local storage with notification settings
            localStorage.setItem('notificationSettings', JSON.stringify(formData.notifications))

            // Update local state with new data
            setUserData({
                ...userData,
                name: formData.name,
                phone: formData.phone,
                address: {
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode
                },
                notifications: formData.notifications
            })

            setIsEditing(false)
        } catch (err) {
            console.error("Error updating profile:", err)
            alert("Failed to update profile. Please try again.")
        }
    }

    // Handle account deletion
    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            try {
                await userService.deleteUser(userData.id)
                // After successful deletion, log out the user
                logout()
                // Redirect to home page
                navigate('/')
            } catch (err) {
                console.error("Error deleting account:", err)
                alert("Failed to delete account. Please try again.")
            }
        }
    }

    // Function to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    // Toggle forgot password form
    const toggleForgotPassword = () => {
        setShowForgotPassword(!showForgotPassword)
        // Clear messages when toggling
        setForgotPasswordError(null)
        setForgotPasswordSuccess(null)
    }

    // Show loading state while fetching user data
    if (loading) {
        return <div className="loading-container">Loading profile information...</div>
    }

    // Show error state if something went wrong
    if (error) {
        return <div className="error-container">{error}</div>
    }

    // Don't render if no userData is available
    if (!userData) {
        return <div className="error-container">No profile information available</div>
    }

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="profile-avatar">
                    <img src={userData.avatar || '/default-avatar.png'} alt={userData.name} />
                </div>
                <div className="profile-info">
                    <h1>{userData.name}</h1>
                    <p className="profile-email">{userData.email}</p>
                    <p className="profile-member-since">Member since {formatDate(userData.joinDate)}</p>
                </div>
            </div>

            <div className="profile-tabs">
                <button
                    className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    Personal Information
                </button>
                <button
                    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Purchase History
                </button>
                <button
                    className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    Security
                </button>
            </div>

            <div className="profile-content">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="profile-tab">
                        <div className="tab-header">
                            <h2>Personal Information</h2>
                            {!isEditing && (
                                <button
                                    className="btn btn-outline edit-btn"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form className="profile-form" onSubmit={handleSaveProfile}>
                                <div className="form-section">
                                    <h3>Basic Information</h3>

                                    <div className="form-group">
                                        <label htmlFor="name">Full Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="form-control"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="email">Email Address</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="form-control"
                                            disabled
                                        />
                                        <small className="help-text">Your UTA email cannot be changed.</small>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="phone">Phone Number</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="form-control"
                                        />
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>Address Information</h3>

                                    <div className="form-group">
                                        <label htmlFor="street">Street Address</label>
                                        <input
                                            type="text"
                                            id="street"
                                            name="street"
                                            value={formData.street}
                                            onChange={handleInputChange}
                                            className="form-control"
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="city">City</label>
                                            <input
                                                type="text"
                                                id="city"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className="form-control"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="state">State</label>
                                            <input
                                                type="text"
                                                id="state"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                className="form-control"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="zipCode">ZIP Code</label>
                                            <input
                                                type="text"
                                                id="zipCode"
                                                name="zipCode"
                                                value={formData.zipCode}
                                                onChange={handleInputChange}
                                                className="form-control"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>Notification Preferences</h3>

                                    <div className="form-group form-check">
                                        <input
                                            type="checkbox"
                                            id="emailAlerts"
                                            name="emailAlerts"
                                            checked={formData.notifications.emailAlerts}
                                            onChange={handleNotificationToggle}
                                            className="form-check-input"
                                        />
                                        <label htmlFor="emailAlerts" className="form-check-label">
                                            Email Alerts
                                        </label>
                                    </div>

                                    <div className="form-group form-check">
                                        <input
                                            type="checkbox"
                                            id="textAlerts"
                                            name="textAlerts"
                                            checked={formData.notifications.textAlerts}
                                            onChange={handleNotificationToggle}
                                            className="form-check-input"
                                        />
                                        <label htmlFor="textAlerts" className="form-check-label">
                                            Text Message Alerts
                                        </label>
                                    </div>

                                    <div className="form-group form-check">
                                        <input
                                            type="checkbox"
                                            id="newMessages"
                                            name="newMessages"
                                            checked={formData.notifications.newMessages}
                                            onChange={handleNotificationToggle}
                                            className="form-check-input"
                                        />
                                        <label htmlFor="newMessages" className="form-check-label">
                                            New Message Notifications
                                        </label>
                                    </div>

                                    <div className="form-group form-check">
                                        <input
                                            type="checkbox"
                                            id="newListings"
                                            name="newListings"
                                            checked={formData.notifications.newListings}
                                            onChange={handleNotificationToggle}
                                            className="form-check-input"
                                        />
                                        <label htmlFor="newListings" className="form-check-label">
                                            New Listing Alerts in Your Categories
                                        </label>
                                    </div>

                                    <div className="form-group form-check">
                                        <input
                                            type="checkbox"
                                            id="marketingEmails"
                                            name="marketingEmails"
                                            checked={formData.notifications.marketingEmails}
                                            onChange={handleNotificationToggle}
                                            className="form-check-input"
                                        />
                                        <label htmlFor="marketingEmails" className="form-check-label">
                                            Marketing Emails
                                        </label>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn btn-primary">
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="profile-details">
                                <div className="details-section">
                                    <h3>Basic Information</h3>
                                    <div className="details-grid">
                                        <div className="details-item">
                                            <span className="details-label">Full Name</span>
                                            <span className="details-value">{userData.name}</span>
                                        </div>
                                        <div className="details-item">
                                            <span className="details-label">Email Address</span>
                                            <span className="details-value">{userData.email}</span>
                                        </div>
                                        <div className="details-item">
                                            <span className="details-label">Phone Number</span>
                                            <span className="details-value">{userData.phone || 'Not provided'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="details-section">
                                    <h3>Address Information</h3>
                                    <div className="details-grid">
                                        <div className="details-item">
                                            <span className="details-label">Street Address</span>
                                            <span className="details-value">{userData.address.street || 'Not provided'}</span>
                                        </div>
                                        <div className="details-item">
                                            <span className="details-label">City</span>
                                            <span className="details-value">{userData.address.city || 'Not provided'}</span>
                                        </div>
                                        <div className="details-item">
                                            <span className="details-label">State</span>
                                            <span className="details-value">{userData.address.state || 'Not provided'}</span>
                                        </div>
                                        <div className="details-item">
                                            <span className="details-label">ZIP Code</span>
                                            <span className="details-value">{userData.address.zipCode || 'Not provided'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="details-section">
                                    <h3>Notification Preferences</h3>
                                    <div className="details-grid">
                                        <div className="details-item">
                                            <span className="details-label">Email Alerts</span>
                                            <span className="details-value">
                                                {userData.notifications.emailAlerts ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                        <div className="details-item">
                                            <span className="details-label">Text Alerts</span>
                                            <span className="details-value">
                                                {userData.notifications.textAlerts ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                        <div className="details-item">
                                            <span className="details-label">New Message Notifications</span>
                                            <span className="details-value">
                                                {userData.notifications.newMessages ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                        <div className="details-item">
                                            <span className="details-label">New Listing Alerts</span>
                                            <span className="details-value">
                                                {userData.notifications.newListings ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                        <div className="details-item">
                                            <span className="details-label">Marketing Emails</span>
                                            <span className="details-value">
                                                {userData.notifications.marketingEmails ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div className="orders-tab">
                        <div className="tab-header">
                            <h2>Purchase History</h2>
                        </div>

                        {ordersLoading && <div className="loading-container">Loading purchase history...</div>}

                        {ordersError && <div className="error-container">{ordersError}</div>}

                        {!ordersLoading && !ordersError && (
                            <>
                                {orderHistory.length > 0 ? (
                                    <div className="orders-list">
                                        {orderHistory.map(order => (
                                            <div className="order-card" key={order.id}>
                                                <div className="order-header">
                                                    <div className="order-id">
                                                        <h3>Order #{order.id}</h3>
                                                        <span className={`order-status ${order.status}`}>
                                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                        </span>
                                                    </div>
                                                    <div className="order-date">
                                                        {formatDate(order.date)}
                                                    </div>
                                                </div>

                                                <div className="order-items">
                                                    {order.items.map((item, index) => (
                                                        <div className="order-item" key={index}>
                                                            <span className="item-name">{item.name}</span>
                                                            <span className="item-price">${item.price}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="order-footer">
                                                    <div className="order-seller">
                                                        Seller: {order.seller}
                                                    </div>
                                                    <div className="order-total">
                                                        Total: <span>${order.total}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-orders">
                                        <p>You haven't made any purchases yet.</p>
                                        <Link to="/buyer" className="btn btn-primary">
                                            Start Shopping
                                        </Link>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Security Tab with Password Reset */}
                {activeTab === 'security' && (
                    <div className="security-tab">
                        <div className="tab-header">
                            <h2>Security Settings</h2>
                        </div>

                        {/* Password Reset Section */}
                        <div className="security-section">
                            <h3>Password Management</h3>

                            {/* Change Password Form */}
                            <div className="reset-password-form">
                                <form onSubmit={handlePasswordReset}>
                                    <div className="form-group">
                                        <label htmlFor="currentPassword">Current Password</label>
                                        <input
                                            type="password"
                                            id="currentPassword"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordInputChange}
                                            className="form-control"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="newPassword">New Password</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordInputChange}
                                            className="form-control"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="confirmPassword">Confirm New Password</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordInputChange}
                                            className="form-control"
                                            required
                                        />
                                    </div>
                                    {passwordError && <div className="form-error">{passwordError}</div>}
                                    {passwordSuccess && <div className="form-success">{passwordSuccess}</div>}
                                    <button type="submit" className="btn btn-primary">
                                        Change Password
                                    </button>
                                </form>

                                {/*<div className="forgot-password-link">*/}
                                {/*    <button*/}
                                {/*        type="button"*/}
                                {/*        className="btn-link"*/}
                                {/*        onClick={toggleForgotPassword}*/}
                                {/*    >*/}
                                {/*        Forgot your password?*/}
                                {/*    </button>*/}
                                {/*</div>*/}
                            </div>

                            {/* Forgot Password Form */}
                            {showForgotPassword && (
                                <div className="forgot-password-form">
                                    <h4>Reset Password</h4>
                                    <p>Enter your email address and we'll send you a link to reset your password.</p>

                                    <form onSubmit={handleForgotPassword}>
                                        <div className="form-group">
                                            <label htmlFor="forgotPasswordEmail">Email Address</label>
                                            <input
                                                type="email"
                                                id="forgotPasswordEmail"
                                                value={forgotPasswordEmail}
                                                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                                className="form-control"
                                                required
                                            />
                                        </div>
                                        {forgotPasswordError && <div className="form-error">{forgotPasswordError}</div>}
                                        {forgotPasswordSuccess && <div className="form-success">{forgotPasswordSuccess}</div>}
                                        <div className="form-actions">
                                            <button type="submit" className="btn btn-primary">
                                                Send Reset Link
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline"
                                                onClick={toggleForgotPassword}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        <div className="security-section danger-zone">
                            <h3>Delete Account</h3>
                            <p>Permanently delete your account and all associated data.</p>
                            <button className="btn btn-danger" onClick={handleDeleteAccount}>
                                Delete Account
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default UserProfile