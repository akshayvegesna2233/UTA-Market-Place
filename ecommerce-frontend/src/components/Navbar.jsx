// src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cartService } from '../services';
import '../css/Navbar.css';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // State for responsive design
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [isCartLoading, setIsCartLoading] = useState(false);

    // Refs for handling clicks outside dropdown
    const userDropdownRef = useRef(null);
    const userToggleRef = useRef(null);

    // Fetch cart count when user is authenticated
    useEffect(() => {
        const fetchCartCount = async () => {
            if (isAuthenticated) {
                try {
                    setIsCartLoading(true);

                    // Add a timestamp to bust cache
                    const timestamp = new Date().getTime();
                    const response = await cartService.getCartItemCount();

                    setCartCount(response.data.count);
                } catch (error) {
                    console.error('Error fetching cart count:', error);
                } finally {
                    setIsCartLoading(false);
                }
            } else {
                setCartCount(0);
            }
        };

        fetchCartCount();

        // Set up interval to refresh cart count periodically
        const intervalId = setInterval(fetchCartCount, 5000); // Check every 5 seconds

        return () => clearInterval(intervalId);
    }, [isAuthenticated, location]); // Re-fetch when location changes to update after cart operations

    // Handle clicks outside user dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                isUserDropdownOpen &&
                userDropdownRef.current &&
                !userDropdownRef.current.contains(event.target) &&
                userToggleRef.current &&
                !userToggleRef.current.contains(event.target)
            ) {
                setIsUserDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isUserDropdownOpen]);

    // Close mobile menu when location changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    // Toggle mobile menu
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        if (isSearchOpen) setIsSearchOpen(false);
    };

    // Toggle search bar
    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
        if (isMenuOpen) setIsMenuOpen(false);
    };

    // Toggle user dropdown
    const toggleUserDropdown = () => {
        setIsUserDropdownOpen(!isUserDropdownOpen);
    };

    // Handle search submission
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/buyer?search=${encodeURIComponent(searchTerm)}`);
            setIsSearchOpen(false);
            setSearchTerm('');
        }
    };

    // Handle logout
    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Check if link is active
    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <header className="navbar">
            <div className="navbar-container">
                {/* Logo */}
                <Link to="/" className="logo">
                    <div className="logo-text">
                        <span className="logo-uta">UTA</span>
                        <span className="logo-marketplace">Market Place</span>
                    </div>
                </Link>

                {/* Mobile Menu Button */}
                <button
                    className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
                    onClick={toggleMenu}
                    aria-label="Toggle navigation menu"
                    aria-expanded={isMenuOpen}
                >
                    <span className="menu-icon"></span>
                </button>

                {/* Main Navigation */}
                <nav className={`main-nav ${isMenuOpen ? 'active' : ''}`} aria-label="Main navigation">
                    <ul className="nav-list">
                        <li className="nav-item">
                            <Link to="/" className={isActive('/') ? 'active' : ''}>
                                Home
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/buyer" className={isActive('/buyer') ? 'active' : ''}>
                                Browse
                            </Link>
                        </li>
                        {isAuthenticated && (
                            <li className="nav-item">
                                <Link to="/seller" className={isActive('/seller') ? 'active' : ''}>
                                    Sell
                                </Link>
                            </li>
                        )}
                        {isAuthenticated && (
                            <li className="nav-item">
                                <Link to="/messages" className={isActive('/messages') ? 'active' : ''}>
                                    Messages
                                </Link>
                            </li>
                        )}
                        <li className="nav-item">
                            <Link to="/contact" className={isActive('/contact') ? 'active' : ''}>
                                Contact Us
                            </Link>
                        </li>
                    </ul>
                </nav>

                {/* Secondary Navigation */}
                <div className="secondary-nav">
                    {/* Search Button */}
                    <button
                        className="search-toggle"
                        onClick={toggleSearch}
                        aria-label="Toggle search"
                        aria-expanded={isSearchOpen}
                    >
                        <div>
                            <img src="https://cdn3.iconfinder.com/data/icons/feather-5/24/search-1024.png" alt="Search" className="search-icon" />
                        </div>
                    </button>

                    {/* Cart Link */}
                    {isAuthenticated && (
                        <Link to="/cart" className="cart-link">
                            <div>
                                <img src="https://cdn4.iconfinder.com/data/icons/eon-ecommerce-i-1/32/cart_shop_buy_retail-1024.png" alt="Search" className="search-icon" />
                            </div>
                            {!isCartLoading && cartCount > 0 && (
                                <span className="cart-badge" key={cartCount}>
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </Link>
                    )}

                    {/* User Menu */}
                    {isAuthenticated ? (
                        <div className="user-menu">
                            <button
                                className="user-toggle"
                                onClick={toggleUserDropdown}
                                ref={userToggleRef}
                                aria-label="User menu"
                                aria-expanded={isUserDropdownOpen}
                            >
                                {user?.avatar ? (
                                    <img
                                        src={`${process.env.REACT_APP_UPLOADS_URL}/${user.avatar}`}
                                        alt={`${user.firstName} ${user.lastName}`}
                                        className="user-avatar"
                                    />
                                ) : (
                                    <div className="user-avatar-placeholder">
                                        {user?.firstName ? user.firstName.charAt(0) : '?'}
                                    </div>
                                )}
                                <span className="user-name">{user?.firstName} {user?.lastName}</span>
                            </button>
                            {isUserDropdownOpen && (
                                <div className="user-dropdown" ref={userDropdownRef}>
                                    <Link to="/profile" className="dropdown-item">My Profile</Link>
                                    <Link to="/seller" className="dropdown-item">My Listings</Link>
                                    {user?.role === 'admin' && (
                                        <Link to="/admin" className="dropdown-item">Admin Dashboard</Link>
                                    )}
                                    <Link to="/messages" className="dropdown-item">Messages</Link>
                                    <button className="dropdown-item logout-btn" onClick={handleLogout}>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="auth-links">
                            <Link to="/login" className="btn btn-outline login-btn">
                                Login
                            </Link>
                            <Link to="/register" className="btn btn-primary register-btn">
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className={`search-bar ${isSearchOpen ? 'active' : ''}`}>
                <div className="search-container">
                    <form onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="Search for products..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search"
                        />
                        <button type="submit" className="search-btn">Search</button>
                        <button
                            type="button"
                            className="search-close"
                            onClick={toggleSearch}
                            aria-label="Close search"
                        >
                            ×
                        </button>
                    </form>
                </div>
            </div>
        </header>
    );
};

export default Navbar;