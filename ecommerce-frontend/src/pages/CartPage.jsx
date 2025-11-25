// src/pages/CartPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService, productService } from '../services';
import { useAuth } from '../context/AuthContext';
import '../css/CartPage.css';

const CartPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // State for cart data
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cartTotals, setCartTotals] = useState({
        subtotal: 0,
        serviceFee: 0,
        total: 0,
        itemCount: 0
    });

    // State for operations
    const [updateLoading, setUpdateLoading] = useState({});
    const [removeLoading, setRemoveLoading] = useState({});
    const [clearLoading, setClearLoading] = useState(false);

    // State for recommended products
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [addingToCart, setAddingToCart] = useState({});

    // Fetch cart data on component mount
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const fetchCartData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await cartService.getCart();
                setCartItems(response.data.cart.items);
                setCartTotals({
                    subtotal: response.data.cart.subtotal,
                    serviceFee: response.data.cart.serviceFee,
                    total: response.data.cart.total,
                    itemCount: response.data.cart.itemCount
                });

                // After updating cart, fetch recommended products
                fetchRecommendedProducts();

            } catch (err) {
                console.error('Error fetching cart:', err);
                setError('Failed to load your cart. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchCartData();
    }, [isAuthenticated, navigate]);

    // Fetch recommended products
    const fetchRecommendedProducts = async () => {
        try {
            const response = await productService.getFeaturedProducts(4);
            setRecommendedProducts(response.data.products);
        } catch (err) {
            console.error('Error fetching recommended products:', err);
        }
    };

    // Handle quantity change
    const handleQuantityChange = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;

        try {
            setUpdateLoading(prev => ({ ...prev, [itemId]: true }));

            // Update UI optimistically
            const updatedItems = cartItems.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            );
            setCartItems(updatedItems);

            // Call API to update quantity
            const response = await cartService.updateCartItem(itemId, newQuantity);

            // Update totals with response data
            setCartTotals({
                subtotal: response.data.totals.subtotal,
                serviceFee: response.data.totals.serviceFee,
                total: response.data.totals.total,
                itemCount: response.data.totals.itemCount
            });

            // Update cart count in navbar by triggering a refresh
            refreshNavbarCartCount();

        } catch (err) {
            console.error('Error updating quantity:', err);
            setError('Failed to update item quantity. Please try again.');
            // Revert on error - refetch cart
            refreshCart();
        } finally {
            setUpdateLoading(prev => ({ ...prev, [itemId]: false }));
        }
    };

    // Handle remove item
    const handleRemoveItem = async (itemId) => {
        try {
            setRemoveLoading(prev => ({ ...prev, [itemId]: true }));

            // Update UI optimistically
            const updatedItems = cartItems.filter(item => item.id !== itemId);
            setCartItems(updatedItems);

            // Call API to remove item
            const response = await cartService.removeCartItem(itemId);

            // Update totals with response data
            setCartTotals({
                subtotal: response.data.totals.subtotal,
                serviceFee: response.data.totals.serviceFee,
                total: response.data.totals.total,
                itemCount: response.data.totals.itemCount
            });

            // Update cart count in navbar
            refreshNavbarCartCount();

        } catch (err) {
            console.error('Error removing item:', err);
            setError('Failed to remove item from cart. Please try again.');
            // Revert on error - refetch cart
            refreshCart();
        } finally {
            setRemoveLoading(prev => ({ ...prev, [itemId]: false }));
        }
    };

    // Handle clear cart
    const handleClearCart = async () => {
        try {
            setClearLoading(true);

            await cartService.clearCart();
            setCartItems([]);
            setCartTotals({
                subtotal: 0,
                serviceFee: 0,
                total: 0,
                itemCount: 0
            });

            // Update cart count in navbar
            refreshNavbarCartCount();

        } catch (err) {
            console.error('Error clearing cart:', err);
            setError('Failed to clear cart. Please try again.');
            // Revert on error - refetch cart
            refreshCart();
        } finally {
            setClearLoading(false);
        }
    };

    // Add recommended product to cart
    const handleAddRecommended = async (productId) => {
        try {
            setAddingToCart(prev => ({ ...prev, [productId]: true }));

            // Call API to add item
            await cartService.addCartItem(productId, 1);

            // Refresh cart to show the new item
            refreshCart();

            // Update cart count in navbar
            refreshNavbarCartCount();

        } catch (err) {
            console.error('Error adding product to cart:', err);
            setError('Failed to add product to cart. Please try again.');
        } finally {
            setAddingToCart(prev => ({ ...prev, [productId]: false }));
        }
    };

    // Refresh cart data
    const refreshCart = async () => {
        try {
            setLoading(true);
            const response = await cartService.getCart();
            setCartItems(response.data.cart.items);
            setCartTotals({
                subtotal: response.data.cart.subtotal,
                serviceFee: response.data.cart.serviceFee,
                total: response.data.cart.total,
                itemCount: response.data.cart.itemCount
            });
        } catch (err) {
            console.error('Error refreshing cart:', err);
            setError('Failed to refresh cart data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Update cart count in the navbar
    const refreshNavbarCartCount = async () => {
        try {
            // Force refresh the cart count for the navbar
            await cartService.getCartItemCount();
        } catch (err) {
            console.error('Error refreshing cart count:', err);
        }
    };

    // Helper to get image URL
    const getImageUrl = (item) => {
        let imageUrl = item.image
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

    // Get featured product image URL
    const getRecommendedImageUrl = (product) => {
        return product.image || '/placeholder-image.jpg';
    };

    // Dismiss error
    const dismissError = () => {
        setError(null);
    };

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="cart-page">
            <div className="cart-header">
                <h1>Your Shopping Cart</h1>
                {!loading && cartItems.length > 0 && (
                    <p>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
                )}
            </div>

            {error && (
                <div className="error-container">
                    <p className="error-message">{error}</p>
                    <button className="error-dismiss" onClick={dismissError}>×</button>
                </div>
            )}

            {loading ? (
                <div className="loading-message">Loading your cart...</div>
            ) : cartItems.length > 0 ? (
                <div className="cart-container">
                    <div className="cart-items">
                        <div className="cart-items-header">
                            <div className="item-product">Product</div>
                            <div className="item-price">Price</div>
                            <div className="item-quantity">Quantity</div>
                            <div className="item-total">Total</div>
                            <div className="item-actions">Actions</div>
                        </div>

                        {cartItems.map(item => (
                            <div className="cart-item" key={item.id}>
                                <div className="item-product">
                                    <img src={getImageUrl(item)} alt={item.name} className="item-image" />
                                    <div className="item-details">
                                        <h3 className="item-name">{item.name}</h3>
                                        <p className="item-seller">
                                            Seller: {item.seller_first_name} {item.seller_last_name}
                                        </p>
                                    </div>
                                </div>

                                <div className="item-price">${parseFloat(item.price).toFixed(2)}</div>

                                <div className="item-quantity">
                                    <div className="quantity-control">
                                        <button
                                            className="quantity-btn"
                                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                            disabled={item.quantity <= 1 || updateLoading[item.id]}
                                        >
                                            -
                                        </button>
                                        <span className="quantity-value">
                                            {updateLoading[item.id] ? '...' : item.quantity}
                                        </span>
                                        <button
                                            className="quantity-btn"
                                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                            disabled={updateLoading[item.id]}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="item-total">
                                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                                </div>

                                <div className="item-actions">
                                    <button
                                        className="remove-btn"
                                        onClick={() => handleRemoveItem(item.id)}
                                        disabled={removeLoading[item.id]}
                                        aria-label="Remove item"
                                    >
                                        {removeLoading[item.id] ? '...' : '×'}
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="cart-actions">
                            <button
                                className="btn btn-outline clear-btn"
                                onClick={handleClearCart}
                                disabled={clearLoading}
                            >
                                {clearLoading ? 'Clearing...' : 'Clear Cart'}
                            </button>
                            <Link to="/buyer" className="continue-shopping">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>

                    <div className="cart-summary">
                        <h2>Order Summary</h2>

                        <div className="summary-item">
                            <span>Subtotal</span>
                            <span>${cartTotals.subtotal.toFixed(2)}</span>
                        </div>

                        <div className="summary-item">
                            <span>Service Fee</span>
                            <span>${cartTotals.serviceFee.toFixed(2)}</span>
                        </div>

                        <div className="summary-total">
                            <span>Total</span>
                            <span>${cartTotals.total.toFixed(2)}</span>
                        </div>

                        <Link to="/checkout" className="btn btn-primary checkout-btn">
                            Proceed to Checkout
                        </Link>

                        <div className="payment-methods">
                            <p>We accept:</p>
                            <div className="payment-icons">
                                <span className="payment-icon">💳</span>
                                <span className="payment-icon">🏦</span>
                                <span className="payment-icon">📱</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="empty-cart">
                    <div className="empty-cart-icon">🛒</div>
                    <h2>Your cart is empty</h2>
                    <p>Looks like you haven't added any items to your cart yet.</p>
                    <Link to="/buyer" className="btn btn-primary">
                        Start Shopping
                    </Link>
                </div>
            )}

            {/* Product Recommendations */}
            {!loading && recommendedProducts.length > 0 && (
                <div className="recommendations">
                    <h2>You Might Also Like</h2>
                    <div className="recommended-products">
                        {recommendedProducts.map(product => (
                            <div className="recommended-product" key={product.id}>
                                <img
                                    src={getRecommendedImageUrl(product)}
                                    alt={product.name}
                                />
                                <h3>{product.name}</h3>
                                <p className="recommended-price">${parseFloat(product.price).toFixed(2)}</p>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => handleAddRecommended(product.id)}
                                    disabled={addingToCart[product.id]}
                                >
                                    {addingToCart[product.id] ? 'Adding...' : 'Add to Cart'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;