import { Link } from 'react-router-dom'
import '../css/Footer.css'

const Footer = () => {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-content">
                    {/* Logo and Description */}
                    <div className="footer-branding">
                        <div className="footer-logo">
                            <span className="footer-logo-uta">UTA</span>
                            <span className="footer-logo-marketplace">Market Place</span>
                        </div>
                        <p className="footer-description">
                            A safe and convenient platform for UTA students to buy and sell items.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-links">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/buyer">Browse Products</Link></li>
                            <li><Link to="/seller">Sell an Item</Link></li>
                            <li><Link to="/contact">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div className="footer-links">
                        <h3>Categories</h3>
                        <ul>
                            <li><Link to="/buyer?category=1">Textbooks</Link></li>
                            <li><Link to="/buyer?category=2">Electronics</Link></li>
                            <li><Link to="/buyer?category=3">Furniture</Link></li>
                            <li><Link to="/buyer?category=4">Clothing</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="footer-contact">
                        <h3>Contact Us</h3>
                        <p><strong>Email:</strong> <a href="mailto:support@utamarketplace.edu">support@utamarketplace.edu</a></p>
                        <p><strong>Phone:</strong> (817) 123-4567</p>
                        <p><strong>Address:</strong> 701 S Nedderman Dr, Arlington, TX 76019</p>
                    </div>
                </div>

                {/* Social Icons */}
                <div className="footer-social">
                    <a href="#" className="social-link">
                        <span className="social-icon">📱</span>
                    </a>
                    <a href="#" className="social-link">
                        <span className="social-icon">📸</span>
                    </a>
                    <a href="#" className="social-link">
                        <span className="social-icon">🐦</span>
                    </a>
                    <a href="#" className="social-link">
                        <span className="social-icon">👤</span>
                    </a>
                </div>

                <div className="footer-bottom">
                    <p className="copyright">
                        &copy; {currentYear} UTA Market Place. All rights reserved.
                    </p>
                    <div className="footer-policies">
                        <Link to="/terms">Terms of Service</Link>
                        <Link to="/privacy">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer