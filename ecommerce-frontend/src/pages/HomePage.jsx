// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService, categoryService } from '../services';
import { useAuth } from '../context/AuthContext';
import '../css/HomePage.css';

const HomePage = () => {
    const { isAuthenticated } = useAuth();
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch data in parallel
                const [productsResponse, categoriesResponse] = await Promise.all([
                    productService.getFeaturedProducts(4),
                    categoryService.getCategories()
                ]);

                setFeaturedProducts(productsResponse.data.products);
                setCategories(categoriesResponse.data.categories);
                setError(null);
            } catch (err) {
                console.error('Error fetching homepage data:', err);
                setError('Failed to load homepage data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    function getProductImageUrl(product) {
        return product.image;
    }

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1 style={{ color: '#fff' }}>
                        Welcome to UTA Market Place
                    </h1>
                    <p>A safe and convenient way for UTA students to buy and sell items</p>
                    <div className="hero-buttons">
                        <Link to="/buyer" className="btn btn-primary">Start Shopping</Link>
                        {isAuthenticated ? (
                            <Link to="/seller" className="btn btn-outline">Sell an Item</Link>
                        ) : (
                            <Link to="/login" className="btn btn-outline">Login to Sell</Link>
                        )}
                    </div>
                </div>
            </section>

            {/* Error Message */}
            {error && (
                <div className="error-container">
                    <p className="error-message">{error}</p>
                </div>
            )}

            {/* Categories Section */}
            <section className="section categories-section">
                <h2 className="section-title">Browse by Category</h2>

                {loading ? (
                    <div className="loading-container">
                        <p>Loading categories...</p>
                    </div>
                ) : (
                    <div className="categories-grid">
                        {categories.map((category) => (
                            <Link to={`/buyer?category=${category.id}`} key={category.id} className="category-card">
                                <div className="category-icon">{category.icon}</div>
                                <h3>{category.name}</h3>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Featured Products Section */}
            <section className="section featured-section">
                <h2 className="section-title">Featured Items</h2>

                {loading ? (
                    <div className="loading-container">
                        <p>Loading featured products...</p>
                    </div>
                ) : (
                    <>
                        <div className="products-grid">
                            {featuredProducts.map((product) => (
                                <div className="product-card" key={product.id}>
                                    <div className="product-image">
                                        <img
                                            src={getProductImageUrl(product)}
                                            alt={product.name}
                                        />
                                    </div>
                                    <div className="product-info">
                                        <h3>{product.name}</h3>
                                        <p className="product-price">${parseFloat(product.price).toFixed(2)}</p>
                                        <p className="product-category">{product.category_name}</p>
                                    </div>
                                    <div className="product-actions">
                                        <Link to={`/product/${product.id}`} className="btn btn-secondary">View Details</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="view-all-link">
                            <Link to="/buyer">View All Products</Link>
                        </div>
                    </>
                )}
            </section>

            {/* How It Works Section */}
            <section className="section how-it-works">
                <h2 className="section-title">How It Works</h2>
                <div className="steps-container">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>Sign Up</h3>
                        <p>Create an account using your UTA email address</p>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>Browse or List</h3>
                        <p>Find items to buy or list your own items for sale</p>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>Connect</h3>
                        <p>Message other UTA students securely through the platform</p>
                    </div>
                    <div className="step">
                        <div className="step-number">4</div>
                        <h3>Complete Transaction</h3>
                        <p>Pay through our secure system and arrange for pickup</p>
                    </div>
                </div>
            </section>

            {/* Join CTA Section */}
            <section className="join-cta">
                <div className="cta-content">
                    <h2>Join the UTA Marketplace Today</h2>
                    <p>Connect with fellow UTA students and start buying and selling safely</p>
                    {isAuthenticated ? (
                        <Link to="/seller" className="btn btn-primary">Start Selling</Link>
                    ) : (
                        <Link to="/register" className="btn btn-primary">Register Now</Link>
                    )}
                </div>
            </section>
        </div>
    );
};

export default HomePage;