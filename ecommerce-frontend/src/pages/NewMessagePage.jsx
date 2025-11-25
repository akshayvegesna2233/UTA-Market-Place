// src/pages/NewMessagePage.jsx
import { useState, useEffect } from 'react';
import {useParams, useNavigate, Link, useLocation} from 'react-router-dom';
import { userService } from '../services';
import { useAuth } from '../context/AuthContext';
import '../css/NewMessagePage.css';

const NewMessagePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user } = useAuth();

    // Extract query parameters
    const queryParams = new URLSearchParams(location.search);
    const queryProductId = queryParams.get('product');
    const queryUserId = queryParams.get('seller');

    // If we have both product and seller in query params, redirect to messages page
    useEffect(() => {
        if (queryProductId && queryUserId) {
            navigate(`/messages?product=${queryProductId}&seller=${queryUserId}`, { replace: true });
        }
    }, [queryProductId, queryUserId, navigate]);

    const [seller, setSeller] = useState(null);
    const [sellerProducts, setSellerProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/messages/${userId}` } });
        }
    }, [isAuthenticated, navigate, userId]);

    // Fetch user and their products
    useEffect(() => {
        const fetchSellerAndProducts = async () => {
            if (!userId || !isAuthenticated) return;

            setLoading(true);
            setError(null);

            try {
                // Check if trying to message yourself
                if (user.id.toString() === userId) {
                    setError("You cannot message yourself");
                    setLoading(false);
                    return;
                }

                // Fetch user details
                try {
                    const userResponse = await userService.getUserProfile(userId);
                    if (userResponse.data && userResponse.data.user) {
                        setSeller(userResponse.data.user);
                    } else {
                        setError("User not found");
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.error("Error fetching user profile:", err);
                    setError("User not found or unable to access profile");
                    setLoading(false);
                    return;
                }

                // Fetch user's active listings
                try {
                    const listingsResponse = await userService.getUserListings(userId, 'active');
                    if (listingsResponse.data && listingsResponse.data.listings) {
                        // Only consider active listings
                        const activeListings = listingsResponse.data.listings.filter(
                            listing => listing.status === 'active'
                        );

                        if (activeListings.length === 0) {
                            setError("This user has no active listings to message about");
                        }

                        setSellerProducts(activeListings);
                    }
                } catch (err) {
                    console.error('Error fetching user listings:', err);
                    setError("Failed to load user's listings. Please try again.");
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error('Error fetching seller data:', err);
                setError("Failed to load user data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchSellerAndProducts();
    }, [userId, isAuthenticated, user]);

    // Function to handle product selection
    const handleProductSelect = (product) => {
        setSelectedProduct(product);
    };

    // Function to start conversation
    const handleStartConversation = () => {
        if (!selectedProduct) return;

        // Redirect to messages page with query params
        navigate(`/messages?product=${selectedProduct.id}&seller=${userId}`);
    };

    // Format date
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (err) {
            return '';
        }
    };

    // Helper function to get image URL
    const getImageUrl = (product) => {
        let imageUrl = product.main_image;
        if (!imageUrl) return '/placeholder-image.jpg';

        // Check if the image URL is already a full URL
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }

        // If it starts with /uploads/, prepend the API URL
        if (imageUrl.startsWith('/uploads/')) {
            // For Vite, use import.meta.env instead of process.env
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
    };

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="new-message-page">
            <div className="container">
                <div className="page-header">
                    <h1>New Message</h1>
                    <Link to="/messages" className="back-link">
                        <i className="icon">←</i> Back to Messages
                    </Link>
                </div>

                {error && (
                    <div className="error-container">
                        <div className="error-message">{error}</div>
                        <Link to="/buyer" className="btn btn-primary">Browse Products</Link>
                    </div>
                )}

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading seller information...</p>
                    </div>
                ) : !error && seller ? (
                    <div className="message-content">
                        <div className="seller-info">
                            <div className="seller-avatar">
                                {seller.avatar ? (
                                    <img
                                        src={getImageUrl({ main_image: seller.avatar })}
                                        alt={`${seller.firstName} ${seller.lastName}`}
                                    />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {seller.firstName ? seller.firstName.charAt(0) : '?'}
                                    </div>
                                )}
                            </div>
                            <div className="seller-details">
                                <h2>{seller.firstName} {seller.lastName}</h2>
                                <div className="seller-meta">
                                    <span><i className="icon">⭐</i> {seller.rating}</span>
                                    <span><i className="icon">📅</i> Member since {formatDate(seller.joinDate)}</span>
                                    <span><i className="icon">🛒</i> {seller.totalSales} sales</span>
                                </div>
                            </div>
                        </div>

                        <div className="product-selection">
                            <h3>Select a product to discuss:</h3>

                            {sellerProducts.length > 0 ? (
                                <div className="product-grid">
                                    {sellerProducts.map(product => (
                                        <div
                                            key={product.id}
                                            className={`product-card ${selectedProduct && selectedProduct.id === product.id ? 'selected' : ''}`}
                                            onClick={() => handleProductSelect(product)}
                                        >
                                            <div className="product-image">
                                                <img src={getImageUrl(product)} alt={product.name} />
                                            </div>
                                            <div className="product-info">
                                                <h4>{product.name}</h4>
                                                <p className="product-price">${parseFloat(product.price).toFixed(2)}</p>
                                                <p className="product-condition">{product.item_condition}</p>
                                            </div>
                                            {selectedProduct && selectedProduct.id === product.id && (
                                                <div className="selected-indicator">✓</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-products-message">
                                    <p>This seller doesn't have any active listings.</p>
                                </div>
                            )}
                        </div>

                        <div className="action-container">
                            <button
                                className="btn btn-primary start-conversation-btn"
                                onClick={handleStartConversation}
                                disabled={!selectedProduct}
                            >
                                Start Conversation about {selectedProduct ? selectedProduct.name : "Selected Product"}
                            </button>

                            <p className="message-help-text">
                                After selecting a product, you'll be able to write your message.
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default NewMessagePage;