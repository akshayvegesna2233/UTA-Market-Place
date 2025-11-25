// src/pages/BuyerPage.jsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { productService, categoryService, cartService } from '../services';
import { useAuth } from '../context/AuthContext';
import '../css/BuyerPage.css';
import '../css/ProductCard.css'

const BuyerPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Get search params with defaults
    const initialCategory = searchParams.get('category') || 'all';
    const initialSearch = searchParams.get('search') || '';
    const initialMinPrice = searchParams.get('minPrice') || '';
    const initialMaxPrice = searchParams.get('maxPrice') || '';
    const initialSortBy = searchParams.get('sortBy') || 'newest';
    const initialPage = parseInt(searchParams.get('page') || '1');

    // State for products, filters, and search
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [error, setError] = useState(null);

    // State for filters
    const [filters, setFilters] = useState({
        category: initialCategory,
        minPrice: initialMinPrice,
        maxPrice: initialMaxPrice,
        sortBy: initialSortBy,
        limit: 8
    });

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [addingToCart, setAddingToCart] = useState({});

    // Fetch categories once on component mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await categoryService.getCategories();
                // Add "All Categories" option
                setCategories([
                    { id: 'all', name: 'All Categories' },
                    ...response.data.categories
                ]);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError('Failed to load categories');
            }
        };

        fetchCategories().then(() => {
            //Ignore
        });
    }, []);

    // Fetch products when filters change
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);

            try {
                // Prepare search options with correct parameter names
                const searchOptions = {
                    search: searchTerm,
                    sort: filters.sortBy,
                    page: currentPage,
                    limit: filters.limit
                };

                // Add optional filters only if they have values
                if (filters.category !== 'all') {
                    searchOptions.category = filters.category;
                }

                if (filters.minPrice) {
                    searchOptions.minPrice = parseFloat(filters.minPrice);
                }

                if (filters.maxPrice) {
                    searchOptions.maxPrice = parseFloat(filters.maxPrice);
                }

                // Call the API
                const response = await productService.getProducts(searchOptions);

                setProducts(response.data.products);
                setTotalPages(response.data.totalPages);

            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Failed to load products. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();

        // Update URL search params
        const newSearchParams = new URLSearchParams();
        if (filters.category !== 'all') newSearchParams.set('category', filters.category);
        if (searchTerm) newSearchParams.set('search', searchTerm);
        if (filters.minPrice) newSearchParams.set('minPrice', filters.minPrice);
        if (filters.maxPrice) newSearchParams.set('maxPrice', filters.maxPrice);
        if (filters.sortBy !== 'newest') newSearchParams.set('sortBy', filters.sortBy);
        if (currentPage > 1) newSearchParams.set('page', currentPage.toString());

        setSearchParams(newSearchParams);

    }, [filters, searchTerm, currentPage, setSearchParams]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));

        // Reset to page 1 when filters change
        setCurrentPage(1);
    };

    // Handle search input
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        // Reset to page 1 when search changes
        setCurrentPage(1);
    };

    // Reset all filters
    const handleResetFilters = () => {
        setFilters({
            category: 'all',
            minPrice: '',
            maxPrice: '',
            sortBy: 'newest',
            limit: 8
        });
        setSearchTerm('');
        setCurrentPage(1);
    };

    // Handle pagination
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // Scroll to top when changing pages
            window.scrollTo(0, 0);
        }
    };

    // Handle add to cart
    const handleAddToCart = async (productId) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            setAddingToCart(prev => ({ ...prev, [productId]: true }));
            await cartService.addCartItem(productId, 1);
            alert('Product added to cart!');
        } catch (err) {
            console.error('Error adding to cart:', err);
            alert('Failed to add product to cart');
        } finally {
            setAddingToCart(prev => ({ ...prev, [productId]: false }));
        }
    };

    function getProductImageUrl(product) {
        let imageUrl = product.main_image || product.images[0];
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
    }

    return (
        <div className="buyer-page">
            <div className="buyer-header">
                <h1>Browse Products</h1>
                <p>Find what you need from fellow UTA students</p>
            </div>

            {error && (
                <div className="error-container">
                    <p className="error-message">{error}</p>
                </div>
            )}

            <div className="buyer-container">
                {/* Filters sidebar */}
                <div className="filters-sidebar">
                    <div className="filter-section">
                        <h3>Search</h3>
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="search-input"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>

                    <div className="filter-section">
                        <h3>Categories</h3>
                        <select
                            name="category"
                            value={filters.category}
                            onChange={handleFilterChange}
                            className="filter-select"
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-section">
                        <h3>Price Range</h3>
                        <div className="price-inputs">
                            <input
                                type="number"
                                placeholder="Min"
                                name="minPrice"
                                value={filters.minPrice}
                                onChange={handleFilterChange}
                                className="price-input"
                                min="0"
                            />
                            <span className="price-separator">to</span>
                            <input
                                type="number"
                                placeholder="Max"
                                name="maxPrice"
                                value={filters.maxPrice}
                                onChange={handleFilterChange}
                                className="price-input"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="filter-section">
                        <h3>Sort By</h3>
                        <select
                            name="sortBy"
                            value={filters.sortBy}
                            onChange={handleFilterChange}
                            className="filter-select"
                        >
                            <option value="newest">Newest First</option>
                            <option value="priceAsc">Price: Low to High</option>
                            <option value="priceDesc">Price: High to Low</option>
                        </select>
                    </div>

                    <button
                        className="btn btn-outline reset-btn"
                        onClick={handleResetFilters}
                    >
                        Reset Filters
                    </button>
                </div>

                {/* Products grid */}
                <div className="products-container">
                    {loading ? (
                        <div className="loading-message">Loading products...</div>
                    ) : products.length > 0 ? (
                        <>
                            <div className="products-grid">
                                {products.map(product => (
                                    <div className="product-card" key={product.id}>
                                        <div className="product-image">
                                            <img
                                                src={getProductImageUrl(product)}
                                                alt={product.name}
                                            />
                                        </div>
                                        <div className="product-details">
                                            <h3 className="product-title">{product.name}</h3>
                                            <p className="product-price">${parseFloat(product.price).toFixed(2)}</p>
                                            <p className="product-seller">
                                                Seller: {product.seller_first_name} {product.seller_last_name}
                                            </p>
                                            <p className="product-description">
                                                {product.description && product.description.length > 60
                                                    ? `${product.description.substring(0, 60)}...`
                                                    : product.description}
                                            </p>
                                            <div className="product-actions">
                                                <Link to={`/product/${product.id}`} className="btn btn-secondary">
                                                    View Details
                                                </Link>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleAddToCart(product.id)}
                                                    disabled={addingToCart[product.id]}
                                                >
                                                    {addingToCart[product.id] ? 'Adding...' : 'Add to Cart'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="pagination-btn"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        &laquo; Previous
                                    </button>

                                    <div className="pagination-info">
                                        Page {currentPage} of {totalPages}
                                    </div>

                                    <button
                                        className="pagination-btn"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next &raquo;
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="no-products-message">
                            No products found matching your criteria. Try adjusting your filters.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuyerPage;