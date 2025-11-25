// src/pages/ProductDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService, cartService, reviewService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import '../css/ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { addToCart, fetchCartCount } = useCart();

    // Product data state
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI interaction state
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [mainImage, setMainImage] = useState(0);
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const [addingToCart, setAddingToCart] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Review state
    const [reviewText, setReviewText] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [canReview, setCanReview] = useState(false);
    const [userReview, setUserReview] = useState(null);

    // Fetch product data
    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await productService.getProductById(id);

                if (!response.data || !response.data.product) {
                    throw new Error('Invalid product data received from server');
                }

                setProduct(response.data.product);

                // If there are images, find the main image index
                if (response.data.product.images && response.data.product.images.length > 0) {
                    const mainIdx = response.data.product.images.findIndex(img => img.is_main);
                    setMainImage(mainIdx >= 0 ? mainIdx : 0);
                }

                // Check if user can review this product (has purchased it)
                if (isAuthenticated && user) {
                    try {
                        const eligibilityResponse = await reviewService.checkReviewEligibility(id);
                        setCanReview(eligibilityResponse.data.eligible);

                        // Check if user has already reviewed this product
                        const userReviewResponse = await reviewService.getUserReviewForProduct(user.id, id);
                        if (userReviewResponse.data.review) {
                            setUserReview(userReviewResponse.data.review);
                            setCanReview(false); // Can't review again if already reviewed
                        }
                    } catch (err) {
                        console.error('Error checking review eligibility:', err);
                        // Don't show error to user, just don't allow reviewing
                    }
                }
            } catch (err) {
                console.error('Error fetching product:', err);

                // If we haven't retried too many times, try again
                if (retryCount < 2) {
                    setRetryCount(prevCount => prevCount + 1);
                    setTimeout(() => fetchProductData(), 1000); // Retry after 1 second
                    return;
                }

                setError(
                    err.response?.data?.message ||
                    'Failed to load product details. Please try again later.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [id, retryCount, isAuthenticated, user]);

    // Function to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (err) {
            console.error('Error formatting date:', err);
            return 'Invalid date';
        }
    };

    // Format price with proper currency display
    const formatPrice = (price) => {
        if (!price && price !== 0) return '$0.00';

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(price);
    };

    // Handle quantity change
    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            setQuantity(value);
        }
    };

    // Handle add to cart
    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/product/${id}` } });
            return;
        }

        try {
            setAddingToCart(true);

            // Check if you're trying to buy your own product
            if (user && product && product.seller_id === user.id) {
                alert("You cannot add your own product to your cart");
                return;
            }

            if (addToCart) {
                await addToCart(product.id, quantity);
                // Re-fetch cart count to update UI
                if (fetchCartCount) fetchCartCount();
                setSuccess(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart!`);
            } else {
                // Fallback if context functions aren't available
                await cartService.addCartItem(product.id, quantity);
                setSuccess(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart!`);
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
            setError('Failed to add product to cart. Please try again.');
        } finally {
            setAddingToCart(false);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        }
    };

    // Handle message seller
    const handleMessageSeller = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/product/${id}` } });
            return;
        }

        // If user is trying to message themselves
        if (user && product && product.seller_id === user.id) {
            alert("You cannot message yourself");
            return;
        }

        // Navigate to messages with pre-selected product/seller
        navigate(`/messages/new?product=${product.id}&seller=${product.seller_id}`);
    };

    // Handle submitting a review
    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/product/${id}` } });
            return;
        }

        if (!reviewText.trim()) {
            setError('Please enter a review comment.');
            return;
        }

        try {
            setSubmittingReview(true);

            const reviewData = {
                productId: id,
                sellerId: product.seller_id,
                rating: reviewRating,
                comment: reviewText
            };

            await reviewService.createReview(reviewData);

            // Update UI
            setUserReview({
                id: Date.now(), // Temporary ID for rendering
                rating: reviewRating,
                comment: reviewText,
                date: new Date().toISOString(),
                reviewer_first_name: user.firstName,
                reviewer_last_name: user.lastName
            });

            setCanReview(false);
            setReviewText('');
            setSuccess('Your review has been submitted successfully!');

            // Add review to product state to show it immediately
            setProduct(prev => {
                const reviews = prev.reviews || [];
                return {
                    ...prev,
                    reviews: [...reviews, {
                        id: Date.now(), // Temporary ID for rendering
                        rating: reviewRating,
                        comment: reviewText,
                        date: new Date().toISOString(),
                        reviewer_first_name: user.firstName,
                        reviewer_last_name: user.lastName
                    }]
                };
            });

        } catch (err) {
            console.error('Error submitting review:', err);
            setError('Failed to submit review. Please try again.');
        } finally {
            setSubmittingReview(false);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        }
    };

    // Handle deleting the product
    const handleDeleteProduct = async () => {
        if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            await productService.deleteProduct(id);
            setSuccess('Listing deleted successfully!');

            // Redirect to seller dashboard after 2 seconds
            setTimeout(() => {
                navigate('/seller');
            }, 2000);
        } catch (err) {
            console.error('Error deleting product:', err);
            setError('Failed to delete listing. Please try again.');
            setLoading(false);
        }
    };

    // Helper to get image URL
    const getImageUrl = (imageUrl) => {
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

    // Message state for success/error notifications
    const [success, setSuccess] = useState(null);

    // Retry function for users
    const handleRetry = () => {
        setRetryCount(0); // Reset retry count
        setError(null);    // Clear error
        setLoading(true);  // Show loading state
    };

    if (loading) {
        return (
            <div className="product-detail-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <h2>Loading Product Details</h2>
                    <p>Please wait while we fetch the latest information...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="product-detail-page">
                <div className="error-container">
                    <div className="error-icon">❌</div>
                    <h2>Something Went Wrong</h2>
                    <p>{error}</p>
                    <div className="error-actions">
                        <button
                            className="btn btn-primary"
                            onClick={handleRetry}
                        >
                            Try Again
                        </button>
                        <Link to="/buyer" className="btn btn-outline">
                            Browse Other Products
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="product-detail-page">
                <div className="not-found-container">
                    <div className="not-found-icon">🔍</div>
                    <h2>Product Not Found</h2>
                    <p>The product you're looking for does not exist or has been removed.</p>
                    <Link to="/buyer" className="btn btn-primary">
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    // Get the appropriate image array for the product
    const images = product.images || [];
    const hasImages = images.length > 0;

    // Get the current main image URL
    const currentMainImageUrl = hasImages && images[mainImage]
        ? getImageUrl(images[mainImage].image_url)
        : '/placeholder-image.jpg';

    // Safely get specifications
    const specifications = product.specifications || [];

    // Safely get related products
    const relatedProducts = product.relatedProducts || [];

    // Safely get reviews
    const reviews = product.reviews || [];

    return (
        <div className="product-detail-page">
            {/* Notification banners */}
            {success && (
                <div className="notification success-notification">
                    <span className="notification-icon">✓</span>
                    <span className="notification-message">{success}</span>
                    <button className="close-notification" onClick={() => setSuccess(null)}>×</button>
                </div>
            )}

            {error && (
                <div className="notification error-notification">
                    <span className="notification-icon">!</span>
                    <span className="notification-message">{error}</span>
                    <button className="close-notification" onClick={() => setError(null)}>×</button>
                </div>
            )}

            {/* Fullscreen image modal */}
            {fullscreenImage !== null && (
                <div className="fullscreen-image-modal" onClick={() => setFullscreenImage(null)}>
                    <div className="fullscreen-image-content">
                        <button className="close-fullscreen" onClick={() => setFullscreenImage(null)}>×</button>
                        <img
                            src={getImageUrl(images[fullscreenImage].image_url)}
                            alt={product.name}
                            className="fullscreen-image"
                        />

                        {/* Navigation buttons if there are multiple images */}
                        {images.length > 1 && (
                            <div className="fullscreen-navigation">
                                <button
                                    className="fullscreen-nav-btn prev"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFullscreenImage(prev =>
                                            prev === 0 ? images.length - 1 : prev - 1
                                        );
                                    }}
                                >
                                    ‹
                                </button>
                                <span className="fullscreen-counter">
                  {fullscreenImage + 1} / {images.length}
                </span>
                                <button
                                    className="fullscreen-nav-btn next"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFullscreenImage(prev =>
                                            prev === images.length - 1 ? 0 : prev + 1
                                        );
                                    }}
                                >
                                    ›
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Product breadcrumb navigation */}
            <div className="product-breadcrumbs">
                <Link to="/">Home</Link> /
                <Link to="/buyer">Products</Link> /
                <Link to={`/buyer?category=${product.category_id}`}>{product.category_name}</Link> /
                <span className="current-page">{product.name}</span>
            </div>

            {/* Product Overview */}
            <div className="product-overview">
                {/* Product Images - Left Column */}
                <div className="product-images">
                    <div
                        className="main-image"
                        onClick={() => hasImages && setFullscreenImage(mainImage)}
                    >
                        <img src={currentMainImageUrl} alt={product.name} />
                        {hasImages && (
                            <div className="image-zoom-hint">
                                <span className="zoom-icon">🔍</span>
                                <span>Click to zoom</span>
                            </div>
                        )}
                    </div>

                    {hasImages && images.length > 1 && (
                        <div className="thumbnail-images">
                            {images.map((image, index) => (
                                <div
                                    key={index}
                                    className={`thumbnail ${mainImage === index ? 'active' : ''}`}
                                    onClick={() => setMainImage(index)}
                                >
                                    <img
                                        src={getImageUrl(image.image_url)}
                                        alt={`${product.name} - View ${index + 1}`}
                                        onError={(e) => {
                                            e.target.src = '/placeholder-image.jpg';
                                            e.target.onerror = null;
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info - Right Column */}
                <div className="product-info">
                    {/* Product Header - Title, Price and Main Info */}
                    <div className="product-header">
                        <h1 className="product-title">{product.name}</h1>

                        <div className="product-essential-info">
                            <p className="product-price">{formatPrice(product.price)}</p>
                            <div className="product-condition-badge">
                                {product.item_condition || 'Not specified'}
                            </div>
                        </div>

                        <div className="product-meta">
                            <div className="meta-item">
                                <span className="meta-label">Category</span>
                                <span className="meta-value">
                  <Link to={`/buyer?category=${product.category_id}`}>
                    {product.category_name || 'Uncategorized'}
                  </Link>
                </span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Location</span>
                                <span className="meta-value">{product.location || 'Not specified'}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Listed On</span>
                                <span className="meta-value">{formatDate(product.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Seller Information Card */}
                    <div className="seller-card">
                        <div className="seller-card-header">
                            <h3>Seller Information</h3>
                            {isAuthenticated && user && product.seller_id !== user.id && (
                                <button
                                    className="btn btn-text seller-contact-btn"
                                    onClick={handleMessageSeller}
                                >
                                    Contact Seller
                                </button>
                            )}
                        </div>

                        <div className="seller-profile">
                            <div className="seller-avatar">
                                {product.seller_avatar ? (
                                    <img
                                        src={getImageUrl(product.seller_avatar)}
                                        alt={`${product.seller_first_name || ''} ${product.seller_last_name || ''}`}
                                        onError={(e) => {
                                            e.target.src = '/placeholder-avatar.jpg';
                                            e.target.onerror = null;
                                        }}
                                    />
                                ) : (
                                    <span className="avatar-placeholder">
                    {(product.seller_first_name || '?').charAt(0)}
                  </span>
                                )}
                            </div>
                            <div className="seller-details">
                                <p className="seller-name">
                                    {product.seller_first_name || ''} {product.seller_last_name || ''}
                                </p>
                                <div className="seller-stats">
                                    <div className="seller-rating">
                                        <div className="stars-container">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <span
                                                    key={star}
                                                    className={`star ${star <= Math.round(product.seller_rating || 0) ? 'filled' : ''}`}
                                                >
                          ★
                        </span>
                                            ))}
                                        </div>
                                        <span className="rating-text">
                      {parseFloat(product.seller_rating || 0).toFixed(1)} out of 5
                    </span>
                                    </div>
                                    <div className="seller-joined">
                                        <span className="joined-label">Member since:</span>
                                        <span className="joined-date">{formatDate(product.seller_join_date)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Actions */}
                    <div className="purchase-section">
                        {(!isAuthenticated || (user && product.seller_id !== user.id)) && (
                            <>
                                <div className="quantity-control">
                                    <label htmlFor="quantity">Quantity:</label>
                                    <div className="quantity-input-group">
                                        <button
                                            className="quantity-btn decrement"
                                            onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                                            disabled={quantity <= 1 || addingToCart}
                                            aria-label="Decrease quantity"
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            id="quantity"
                                            min="1"
                                            value={quantity}
                                            onChange={handleQuantityChange}
                                            disabled={addingToCart}
                                            aria-label="Product quantity"
                                        />
                                        <button
                                            className="quantity-btn increment"
                                            onClick={() => setQuantity(quantity + 1)}
                                            disabled={addingToCart}
                                            aria-label="Increase quantity"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="cart-action">
                                    <button
                                        className="btn btn-primary btn-large"
                                        onClick={handleAddToCart}
                                        disabled={addingToCart || (isAuthenticated && user && product.seller_id === user.id)}
                                    >
                                        {addingToCart ? (
                                            <>
                                                <span className="btn-spinner"></span>
                                                Adding to Cart...
                                            </>
                                        ) : (
                                            <>
                                                <span className="cart-icon">🛒</span>
                                                Add to Cart
                                            </>
                                        )}
                                    </button>
                                    {isAuthenticated ? (
                                        <div className="purchase-note">
                                            Item will be added to your cart
                                        </div>
                                    ) : (
                                        <div className="purchase-note">
                                            <Link to="/login" className="login-link">Log in</Link> to purchase this item
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {isAuthenticated && user && product.seller_id === user.id && (
                            <div className="own-product-message">
                                <p>This is your product listing</p>
                                <div className="owner-actions">
                                    <Link to={`/edit-listing/${product.id}`} className="btn btn-outline">
                                        Edit Listing
                                    </Link>
                                    <button
                                        className="btn btn-danger-outline"
                                        onClick={handleDeleteProduct}
                                    >
                                        Remove Listing
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Product Tabs */}
            <div className="product-tabs">
                <div className="tabs-header">
                    <button
                        className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                        onClick={() => setActiveTab('description')}
                    >
                        Description
                    </button>
                    {specifications.length > 0 && (
                        <button
                            className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`}
                            onClick={() => setActiveTab('specifications')}
                        >
                            Specifications
                        </button>
                    )}
                    <button
                        className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reviews')}
                    >
                        Reviews {reviews.length > 0 ? `(${reviews.length})` : ''}
                    </button>
                </div>

                <div className="tab-content">
                    {/* Description Tab */}
                    {activeTab === 'description' && (
                        <div className="description-tab">
                            {product.description ? (
                                <p>{product.description}</p>
                            ) : (
                                <p className="no-description">No description provided.</p>
                            )}
                        </div>
                    )}

                    {/* Specifications Tab */}
                    {activeTab === 'specifications' && (
                        <div className="specifications-tab">
                            {specifications.length > 0 ? (
                                <table className="specs-table">
                                    <tbody>
                                    {specifications.map((spec, index) => (
                                        <tr key={index}>
                                            <td className="spec-name">{spec.name || 'Unknown'}</td>
                                            <td className="spec-value">{spec.value || 'Not specified'}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="no-specs">No specifications available.</p>
                            )}
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                        <div className="reviews-tab">
                            {/* Write review form if eligible */}
                            {isAuthenticated && canReview && (
                                <div className="write-review-container">
                                    <h3>Write a Review</h3>
                                    <form onSubmit={handleSubmitReview} className="review-form">
                                        <div className="rating-input">
                                            <label>Your Rating:</label>
                                            <div className="star-rating">
                                                {[5, 4, 3, 2, 1].map((star) => (
                                                    <label key={star} className="star-label">
                                                        <input
                                                            type="radio"
                                                            name="rating"
                                                            value={star}
                                                            checked={reviewRating === star}
                                                            onChange={() => setReviewRating(star)}
                                                        />
                                                        <span className={`star ${reviewRating >= star ? 'selected' : ''}`}>★</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="review-input">
                                            <label htmlFor="reviewText">Your Review:</label>
                                            <textarea
                                                id="reviewText"
                                                value={reviewText}
                                                onChange={(e) => setReviewText(e.target.value)}
                                                placeholder="Share your experience with this product..."
                                                rows="4"
                                                required
                                            ></textarea>
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={submittingReview || !reviewText.trim()}
                                        >
                                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* User's review if they already submitted one */}
                            {isAuthenticated && userReview && (
                                <div className="your-review">
                                    <h3>Your Review</h3>
                                    <div className="review-card highlighted">
                                        <div className="review-header">
                                            <div className="reviewer-info">
                                                <div className="reviewer-avatar">
                                                    {user.firstName ? user.firstName.charAt(0) : '?'}
                                                </div>
                                                <div className="reviewer-details">
                                                    <p className="reviewer-name">
                                                        {user.firstName} {user.lastName}
                                                    </p>
                                                    <p className="review-date">{formatDate(userReview.date)}</p>
                                                </div>
                                            </div>
                                            <div className="review-rating">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <span key={i} className={i < (userReview.rating || 0) ? 'star filled' : 'star'}>
                            ★
                          </span>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="review-text">{userReview.comment}</p>
                                    </div>
                                </div>
                            )}

                            {/* All reviews list */}
                            <div className="all-reviews">
                                <h3>Customer Reviews</h3>
                                {reviews.length > 0 ? (
                                    <div className="reviews-list">
                                        {reviews
                                            // Don't show the user's review again if it's in the list
                                            .filter(review => !userReview || review.id !== userReview.id)
                                            .map((review, idx) => (
                                                <div className="review-card" key={review.id || idx}>
                                                    <div className="review-header">
                                                        <div className="reviewer-info">
                                                            <div className="reviewer-avatar">
                                                                {review.reviewer_first_name ?
                                                                    review.reviewer_first_name.charAt(0) : '?'}
                                                            </div>
                                                            <div className="reviewer-details">
                                                                <p className="reviewer-name">
                                                                    {review.reviewer_first_name || ''} {review.reviewer_last_name || ''}
                                                                </p>
                                                                <p className="review-date">{formatDate(review.date)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="review-rating">
                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                <span key={i} className={i < (review.rating || 0) ? 'star filled' : 'star'}>
                                  ★
                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="review-text">{review.comment || 'No comment provided.'}</p>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="no-reviews">
                                        {isAuthenticated && canReview ?
                                            'Be the first to review this product!' :
                                            'No reviews yet.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="related-products">
                    <h2>Related Products</h2>
                    <div className="related-products-grid">
                        {relatedProducts.map((relatedProduct, idx) => (
                            <Link
                                to={`/product/${relatedProduct.id}`}
                                className="related-product-card"
                                key={relatedProduct.id || idx}
                            >
                                <div className="related-product-image">
                                    <img
                                        src={getImageUrl(relatedProduct.image)}
                                        alt={relatedProduct.name || 'Related product'}
                                        onError={(e) => {
                                            e.target.src = '/placeholder-image.jpg';
                                            e.target.onerror = null;
                                        }}
                                    />
                                </div>
                                <div className="related-product-info">
                                    <h3>{relatedProduct.name || 'Unnamed product'}</h3>
                                    <p className="related-product-price">
                                        {formatPrice(relatedProduct.price)}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;