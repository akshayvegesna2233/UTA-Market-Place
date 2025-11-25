// src/pages/SellerPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userService, productService, messageService } from '../services';
import { useAuth } from '../context/AuthContext';
import '../css/SellerPage.css';

const SellerPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // State for active tab
    const [activeTab, setActiveTab] = useState('listings');

    // State for data
    const [listings, setListings] = useState([]);
    const [sales, setSales] = useState([]);
    const [messages, setMessages] = useState([]);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);

    // Loading and error states
    const [loading, setLoading] = useState({
        listings: false,
        sales: false,
        messages: false
    });
    const [error, setError] = useState({
        listings: null,
        sales: null,
        messages: null
    });

    // Fetch listings when component mounts
    useEffect(() => {
        const fetchListings = async () => {
            if (!user?.id) return;

            setLoading(prev => ({ ...prev, listings: true }));
            try {
                const response = await userService.getUserListings(user.id);
                setListings(response.data.listings);
                setError(prev => ({ ...prev, listings: null }));
            } catch (err) {
                console.error('Error fetching listings:', err);
                setError(prev => ({ ...prev, listings: 'Failed to load listings' }));
            } finally {
                setLoading(prev => ({ ...prev, listings: false }));
            }
        };

        fetchListings();
    }, [user]);

    // Fetch sales history when sales tab is active
    useEffect(() => {
        const fetchSales = async () => {
            if (!user?.id || activeTab !== 'sales') return;

            setLoading(prev => ({ ...prev, sales: true }));
            try {
                const response = await userService.getUserSales(user.id);
                setSales(response.data.sales);
                setError(prev => ({ ...prev, sales: null }));
            } catch (err) {
                console.error('Error fetching sales:', err);
                setError(prev => ({ ...prev, sales: 'Failed to load sales history' }));
            } finally {
                setLoading(prev => ({ ...prev, sales: false }));
            }
        };

        fetchSales();
    }, [user, activeTab]);

    // Fetch messages when messages tab is active
    useEffect(() => {
        const fetchMessages = async () => {
            if (activeTab !== 'messages') return;

            setLoading(prev => ({ ...prev, messages: true }));
            try {
                const [conversationsResponse, unreadCountResponse] = await Promise.all([
                    messageService.getUserConversations(),
                    messageService.getUnreadCount()
                ]);

                setMessages(conversationsResponse.data.conversations);
                setUnreadMessageCount(unreadCountResponse.data.count);
                setError(prev => ({ ...prev, messages: null }));
            } catch (err) {
                console.error('Error fetching messages:', err);
                setError(prev => ({ ...prev, messages: 'Failed to load messages' }));
            } finally {
                setLoading(prev => ({ ...prev, messages: false }));
            }
        };

        fetchMessages();

        // Set up interval to check for new messages periodically
        const intervalId = setInterval(fetchMessages, 60000); // Every minute

        return () => clearInterval(intervalId);
    }, [activeTab]);

    // Function to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Function to handle new listing
    const handleNewListing = () => {
        navigate('/create-listing');
    };

    function getProductImageUrl(product) {
        let imageUrl = product.main_image || product.images[0];
        if (!imageUrl) return '/placeholder-image.jpg';

        // Check if the image URL is already a full URL
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }

        if (imageUrl.startsWith('/uploads/')) {
            const apiBase = import.meta.env.VITE_API_URL
                ? import.meta.env.VITE_API_URL.replace('/api', '')
                : '';
            return `${apiBase}${imageUrl}`;
        }

        // If it's an absolute path but not starting with /uploads/
        if (imageUrl.startsWith('/')) {
            return imageUrl;
        }

        // Return placeholder if image is not available
        return '/placeholder-image.jpg';
    }

    // Function to handle message reply
    const handleMessageReply = (conversationId) => {
        navigate(`/messages/${conversationId}`);
    };

    // Function to handle delete listing
    const handleDeleteListing = async (listingId) => {
        if (!window.confirm('Are you sure you want to delete this listing?')) {
            return;
        }

        try {
            await productService.deleteProduct(listingId);
            // Remove deleted listing from state
            setListings(listings.filter(listing => listing.id !== listingId));
            alert('Listing deleted successfully');
        } catch (err) {
            console.error('Error deleting listing:', err);
            alert('Failed to delete listing');
        }
    };

    if (!user) {
        return (
            <div className="seller-page">
                <div className="loading-message">Loading user data...</div>
            </div>
        );
    }

    return (
        <div className="seller-page">
            <div className="seller-header">
                <div className="seller-profile">
                    {user.avatar ? (
                        <img
                            src={`${process.env.REACT_APP_UPLOADS_URL}/${user.avatar}`}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="seller-avatar"
                        />
                    ) : (
                        <div className="seller-avatar-placeholder">
                            {user.firstName ? user.firstName.charAt(0) : '?'}
                        </div>
                    )}
                    <div className="seller-info">
                        <h1>{user.firstName} {user.lastName}</h1>
                        <p className="seller-email">{user.email}</p>
                        <p className="seller-stats">
                            <span>Member since: {formatDate(user.joinDate)}</span>
                            <span>Rating: {user.rating}/5</span>
                            <span>Total Sales: {user.totalSales || 0}</span>
                        </p>
                    </div>
                </div>
                <button
                    className="btn btn-primary new-listing-btn"
                    onClick={handleNewListing}
                >
                    + New Listing
                </button>
            </div>

            <div className="seller-tabs">
                <button
                    className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('listings')}
                >
                    My Listings
                </button>
                <button
                    className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sales')}
                >
                    Sales History
                </button>
                <button
                    className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
                    onClick={() => setActiveTab('messages')}
                >
                    Messages
                    {unreadMessageCount > 0 && <span className="message-badge">{unreadMessageCount}</span>}
                </button>
            </div>

            <div className="seller-content">
                {/* Listings Tab */}
                {activeTab === 'listings' && (
                    <div className="listings-tab">
                        <h2>My Listings</h2>

                        {error.listings && <p className="error-message">{error.listings}</p>}

                        {loading.listings ? (
                            <div className="loading-message">Loading your listings...</div>
                        ) : listings.length > 0 ? (
                            <div className="listings-grid">
                                {listings.map(listing => (
                                    <div
                                        key={listing.id}
                                        className={`listing-card ${listing.status === 'sold' ? 'sold' : ''}`}
                                    >
                                        <div className="listing-image">
                                            <img
                                                src={getProductImageUrl(listing)}
                                                alt={listing.name}
                                            />
                                            {listing.status === 'sold' && <div className="sold-badge">SOLD</div>}
                                            {listing.status === 'pending' && <div className="pending-badge">PENDING</div>}
                                        </div>
                                        <div className="listing-details">
                                            <h3>{listing.name}</h3>
                                            <p className="listing-price">${parseFloat(listing.price).toFixed(2)}</p>
                                            <p className="listing-category">{listing.category_name}</p>
                                            <div className="listing-stats">
                                                <span title="Date Listed">{formatDate(listing.created_at)}</span>
                                                <span title="Views"><i className="icon">👁️</i> {listing.views}</span>
                                                <span title="Interested Buyers"><i className="icon">👤</i> {listing.interested}</span>
                                            </div>
                                        </div>
                                        <div className="listing-actions">
                                            <Link to={`/product/${listing.id}`} className="btn btn-secondary">View</Link>
                                            <Link to={`/edit-listing/${listing.id}`} className="btn btn-outline">Edit</Link>
                                            <button
                                                className="btn btn-outline delete-btn"
                                                onClick={() => handleDeleteListing(listing.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-listings-message">
                                <p>You don't have any listings yet.</p>
                                <button className="btn btn-primary" onClick={handleNewListing}>
                                    Create Your First Listing
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Sales Tab */}
                {activeTab === 'sales' && (
                    <div className="sales-tab">
                        <h2>Sales History</h2>

                        {error.sales && <p className="error-message">{error.sales}</p>}

                        {loading.sales ? (
                            <div className="loading-message">Loading your sales history...</div>
                        ) : sales.length > 0 ? (
                            <div className="sales-table-container">
                                <table className="sales-table">
                                    <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Product</th>
                                        <th>Price</th>
                                        <th>Buyer</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {sales.map(sale => (
                                        <tr key={sale.id}>
                                            <td>{formatDate(sale.created_at)}</td>
                                            <td>{sale.product_name}</td>
                                            <td>${parseFloat(sale.price_at_purchase).toFixed(2)}</td>
                                            <td>{sale.buyer_first_name} {sale.buyer_last_name}</td>
                                            <td>
                                                <span className={`status-badge ${sale.status}`}>
                                                    {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>
                                                <Link to={`/order/${sale.order_id}`} className="btn btn-sm btn-outline">
                                                    Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="no-sales-message">
                                <p>You haven't made any sales yet.</p>
                                <p>Create listings to start selling your items.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Messages Tab */}
                {activeTab === 'messages' && (
                    <div className="messages-tab">
                        <h2>Messages</h2>

                        {error.messages && <p className="error-message">{error.messages}</p>}

                        {loading.messages ? (
                            <div className="loading-message">Loading your messages...</div>
                        ) : messages.length > 0 ? (
                            <div className="messages-list">
                                {messages.map(message => (
                                    <div
                                        key={message.id}
                                        className={`message-card ${message.unread_count > 0 ? 'unread' : ''}`}
                                    >
                                        <div className="message-sender">
                                            {message.other_user_avatar ? (
                                                <img
                                                    src={`${process.env.REACT_APP_UPLOADS_URL}/${message.other_user_avatar}`}
                                                    alt={message.other_user_name}
                                                    className="sender-avatar"
                                                />
                                            ) : (
                                                <div className="sender-avatar-placeholder">
                                                    {message.other_user_name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="message-content">
                                            <div className="message-header">
                                                <h3>{message.other_user_name}</h3>
                                                <span className="message-date">{formatDate(message.last_message_time)}</span>
                                            </div>
                                            <p className="message-product">Re: {message.product_name}</p>
                                            <p className="message-text">
                                                {message.last_message.length > 60
                                                    ? `${message.last_message.substring(0, 60)}...`
                                                    : message.last_message}
                                            </p>
                                        </div>
                                        <div className="message-actions">
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleMessageReply(message.id)}
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-messages-message">
                                <p>You don't have any messages yet.</p>
                                <p>Messages from interested buyers will appear here.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerPage;