// src/pages/CheckoutPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService, orderService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import '../css/CheckoutPage.css';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { clearCart, fetchCartCount } = useCart();

    // State for data loading
    const [loading, setLoading] = useState(true);
    const [orderLoading, setOrderLoading] = useState(false);
    const [error, setError] = useState(null);
    const [orderComplete, setOrderComplete] = useState(false);
    const [orderId, setOrderId] = useState(null);

    // State for cart items and totals
    const [cartItems, setCartItems] = useState([]);
    const [cartTotals, setCartTotals] = useState({
        subtotal: 0,
        serviceFee: 0,
        total: 0
    });

    // Form state
    const [formData, setFormData] = useState({
        name: user?.firstName + ' ' + user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.streetAddress || '',
        city: user?.city || '',
        state: user?.state || '',
        zip: user?.zipCode || '',
        paymentMethod: 'credit',
        cardNumber: '',
        cardName: '',
        expiry: '',
        cvv: ''
    });

    // Error state
    const [errors, setErrors] = useState({});

    // Current step
    const [step, setStep] = useState(1);

    // Fetch cart data on component mount
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/checkout' } });
            return;
        }

        const fetchCartData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await cartService.getCart();

                // Check if cart is empty
                if (!response.data.cart.items || response.data.cart.items.length === 0) {
                    navigate('/cart');
                    return;
                }

                setCartItems(response.data.cart.items);
                setCartTotals({
                    subtotal: response.data.cart.subtotal,
                    serviceFee: response.data.cart.serviceFee,
                    total: response.data.cart.total
                });
            } catch (err) {
                console.error('Error fetching cart:', err);
                setError('Failed to load cart data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchCartData();
    }, [isAuthenticated, navigate]);

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Validate step 1
    const validateStep1 = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }

        if (!formData.state.trim()) {
            newErrors.state = 'State is required';
        }

        if (!formData.zip.trim()) {
            newErrors.zip = 'ZIP code is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validate step 2
    const validateStep2 = () => {
        const newErrors = {};

        if (formData.paymentMethod === 'credit') {
            if (!formData.cardNumber.trim()) {
                newErrors.cardNumber = 'Card number is required';
            } else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
                newErrors.cardNumber = 'Card number must be 16 digits';
            }

            if (!formData.cardName.trim()) {
                newErrors.cardName = 'Name on card is required';
            }

            if (!formData.expiry.trim()) {
                newErrors.expiry = 'Expiry date is required';
            } else if (!/^\d{2}\/\d{2}$/.test(formData.expiry)) {
                newErrors.expiry = 'Expiry date should be in MM/YY format';
            }

            if (!formData.cvv.trim()) {
                newErrors.cvv = 'CVV is required';
            } else if (!/^\d{3,4}$/.test(formData.cvv)) {
                newErrors.cvv = 'CVV must be 3 or 4 digits';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle next step
    const handleNextStep = () => {
        if (step === 1) {
            if (validateStep1()) {
                setStep(2);
                window.scrollTo(0, 0);
            }
        }
    };

    // Handle previous step
    const handlePrevStep = () => {
        if (step === 2) {
            setStep(1);
            window.scrollTo(0, 0);
        }
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (step === 2 && validateStep2()) {
            setOrderLoading(true);
            setError(null);

            try {
                // Prepare order data
                const orderData = {
                    paymentMethod: formData.paymentMethod,
                    paymentStatus: 'pending',
                    deliveryAddress: formData.address,
                    deliveryCity: formData.city,
                    deliveryState: formData.state,
                    deliveryZip: formData.zip
                };

                // Create order
                const response = await orderService.createOrder(orderData);

                // Process payment if needed
                if (formData.paymentMethod === 'credit') {
                    const paymentData = {
                        paymentMethodId: formData.cardNumber.replace(/\s/g, ''),
                        paymentType: 'card'
                    };

                    await orderService.processCheckout(response.data.orderId, paymentData);
                }

                // Order created successfully
                setOrderId(response.data.orderId);
                setOrderComplete(true);

                // Clear cart
                await clearCart();
                fetchCartCount();

            } catch (err) {
                console.error('Error creating order:', err);
                setError(err.response?.data?.message || 'Failed to process your order. Please try again.');
            } finally {
                setOrderLoading(false);
            }
        }
    };

    // Format card number with spaces
    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    // Handle card number input
    const handleCardNumberChange = (e) => {
        const formattedValue = formatCardNumber(e.target.value);
        setFormData({
            ...formData,
            cardNumber: formattedValue
        });
    };

    // Format expiry date
    const formatExpiryDate = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');

        if (v.length > 2) {
            return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
        }

        return v;
    };

    // Handle expiry date input
    const handleExpiryChange = (e) => {
        const formattedValue = formatExpiryDate(e.target.value);
        setFormData({
            ...formData,
            expiry: formattedValue
        });
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

    // If still loading cart data
    if (loading) {
        return (
            <div className="checkout-page">
                <div className="checkout-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading your order details...</p>
                </div>
            </div>
        );
    }

    // If order is complete, show success message
    if (orderComplete) {
        return (
            <div className="checkout-page">
                <div className="checkout-success">
                    <div className="success-icon">✓</div>
                    <h2>Order Placed Successfully!</h2>
                    <p>Your order has been received and is being processed.</p>
                    <p>Order ID: <strong>{orderId}</strong></p>
                    <p>We've sent a confirmation email to <strong>{formData.email}</strong>.</p>
                    <div>
                        <Link to="/" className="btn btn-primary">Return to Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="checkout-header">
                <h1>Checkout</h1>
                <div className="checkout-steps">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>
                        <div className="step-number">1</div>
                        <span className="step-name">Delivery Information</span>
                    </div>
                    <div className="step-divider"></div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>
                        <div className="step-number">2</div>
                        <span className="step-name">Payment Information</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="checkout-error">
                    <p>{error}</p>
                </div>
            )}

            <div className="checkout-container">
                <div className="checkout-form-container">
                    <form onSubmit={handleSubmit} className="checkout-form">
                        {/* Step 1: Delivery Information */}
                        {step === 1 && (
                            <div className="form-step">
                                <h2>Delivery Information</h2>

                                <div className="form-group">
                                    <label htmlFor="name">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        className={`form-control ${errors.name ? 'error' : ''}`}
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                    {errors.name && <div className="error-message">{errors.name}</div>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        className={`form-control ${errors.email ? 'error' : ''}`}
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                    {errors.email && <div className="error-message">{errors.email}</div>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        className={`form-control ${errors.phone ? 'error' : ''}`}
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                    {errors.phone && <div className="error-message">{errors.phone}</div>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="address">Street Address</label>
                                    <input
                                        type="text"
                                        id="address"
                                        name="address"
                                        className={`form-control ${errors.address ? 'error' : ''}`}
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                    {errors.address && <div className="error-message">{errors.address}</div>}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="city">City</label>
                                        <input
                                            type="text"
                                            id="city"
                                            name="city"
                                            className={`form-control ${errors.city ? 'error' : ''}`}
                                            value={formData.city}
                                            onChange={handleChange}
                                        />
                                        {errors.city && <div className="error-message">{errors.city}</div>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="state">State</label>
                                        <input
                                            type="text"
                                            id="state"
                                            name="state"
                                            className={`form-control ${errors.state ? 'error' : ''}`}
                                            value={formData.state}
                                            onChange={handleChange}
                                        />
                                        {errors.state && <div className="error-message">{errors.state}</div>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="zip">ZIP Code</label>
                                        <input
                                            type="text"
                                            id="zip"
                                            name="zip"
                                            className={`form-control ${errors.zip ? 'error' : ''}`}
                                            value={formData.zip}
                                            onChange={handleChange}
                                        />
                                        {errors.zip && <div className="error-message">{errors.zip}</div>}
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <Link to="/cart" className="btn btn-outline">Back to Cart</Link>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleNextStep}
                                    >
                                        Continue to Payment
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Payment Information */}
                        {step === 2 && (
                            <div className="form-step">
                                <h2>Payment Information</h2>

                                <div className="payment-methods">
                                    <div
                                        className={`payment-method ${formData.paymentMethod === 'credit' ? 'selected' : ''}`}
                                        onClick={() => setFormData({...formData, paymentMethod: 'credit'})}
                                    >
                                        <input
                                            type="radio"
                                            id="credit"
                                            name="paymentMethod"
                                            value="credit"
                                            checked={formData.paymentMethod === 'credit'}
                                            onChange={handleChange}
                                        />
                                        <label htmlFor="credit">Credit / Debit Card</label>
                                        <img src="https://equestrio.co.nz/wp-content/uploads/2019/01/Credit-Card-Icons.png" alt="Credit Cards" className="payment-logo" />
                                    </div>

                                    <div
                                        className={`payment-method ${formData.paymentMethod === 'paypal' ? 'selected' : ''}`}
                                        onClick={() => setFormData({...formData, paymentMethod: 'paypal'})}
                                    >
                                        <input
                                            type="radio"
                                            id="paypal"
                                            name="paymentMethod"
                                            value="paypal"
                                            checked={formData.paymentMethod === 'paypal'}
                                            onChange={handleChange}
                                        />
                                        <label htmlFor="paypal">PayPal</label>
                                        <img src="https://pngimg.com/uploads/paypal/paypal_PNG4.png" alt="PayPal" className="payment-logo" />
                                    </div>
                                </div>

                                {formData.paymentMethod === 'credit' && (
                                    <div className="credit-card-form">
                                        <div className="form-group">
                                            <label htmlFor="cardNumber">Card Number</label>
                                            <input
                                                type="text"
                                                id="cardNumber"
                                                name="cardNumber"
                                                className={`form-control ${errors.cardNumber ? 'error' : ''}`}
                                                placeholder="1234 5678 9012 3456"
                                                value={formData.cardNumber}
                                                onChange={handleCardNumberChange}
                                                maxLength="19"
                                            />
                                            {errors.cardNumber && <div className="error-message">{errors.cardNumber}</div>}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="cardName">Name on Card</label>
                                            <input
                                                type="text"
                                                id="cardName"
                                                name="cardName"
                                                className={`form-control ${errors.cardName ? 'error' : ''}`}
                                                value={formData.cardName}
                                                onChange={handleChange}
                                            />
                                            {errors.cardName && <div className="error-message">{errors.cardName}</div>}
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="expiry">Expiry Date</label>
                                                <input
                                                    type="text"
                                                    id="expiry"
                                                    name="expiry"
                                                    className={`form-control ${errors.expiry ? 'error' : ''}`}
                                                    placeholder="MM/YY"
                                                    value={formData.expiry}
                                                    onChange={handleExpiryChange}
                                                    maxLength="5"
                                                />
                                                {errors.expiry && <div className="error-message">{errors.expiry}</div>}
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="cvv">CVV</label>
                                                <input
                                                    type="text"
                                                    id="cvv"
                                                    name="cvv"
                                                    className={`form-control ${errors.cvv ? 'error' : ''}`}
                                                    placeholder="123"
                                                    value={formData.cvv}
                                                    onChange={handleChange}
                                                    maxLength="4"
                                                />
                                                {errors.cvv && <div className="error-message">{errors.cvv}</div>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {formData.paymentMethod === 'paypal' && (
                                    <div className="paypal-instructions">
                                        <p>You will be redirected to PayPal to complete your payment after clicking "Place Order".</p>
                                    </div>
                                )}

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={handlePrevStep}
                                        disabled={orderLoading}
                                    >
                                        Back to Delivery
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={orderLoading}
                                    >
                                        {orderLoading ? (
                                            <>
                                                <span className="loading-spinner-sm"></span>
                                                Processing...
                                            </>
                                        ) : (
                                            'Place Order'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="order-summary">
                    <h2>Order Summary</h2>

                    <div className="order-items">
                        {cartItems.map(item => (
                            <div className="order-item" key={item.id}>
                                <div className="item-image">
                                    <img src={getImageUrl(item)} alt={item.name} />
                                </div>
                                <div className="item-details">
                                    <h3>{item.name}</h3>
                                    <p className="item-seller">
                                        Seller: {item.seller_first_name} {item.seller_last_name}
                                    </p>
                                    <div className="item-price-qty">
                                        <span className="item-price">${parseFloat(item.price).toFixed(2)}</span>
                                        <span className="item-qty">Qty: {item.quantity}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="order-totals">
                        <div className="total-row">
                            <span>Subtotal</span>
                            <span>${cartTotals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="total-row">
                            <span>Service Fee (5%)</span>
                            <span>${cartTotals.serviceFee.toFixed(2)}</span>
                        </div>
                        <div className="total-row grand-total">
                            <span>Total</span>
                            <span>${cartTotals.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="order-notes">
                        <p>By completing your purchase, you agree to the <Link to="/terms">Terms of Service</Link>.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;