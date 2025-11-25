import {Routes, Route, Navigate} from 'react-router-dom';
import {useAuth, AuthProvider} from './context/AuthContext';
import './App.css';

// Auth Pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';

// Main Pages
import HomePage from './pages/HomePage';
import BuyerPage from './pages/BuyerPage';
import SellerPage from './pages/SellerPage';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MessagesPage from './pages/MessagesPage';
import NewMessagePage from './pages/NewMessagePage';
import UserProfile from './pages/UserProfile';
import ContactUsPage from "./pages/ContactUsPage";
import CreateListingPage from './pages/CreateListingPage';
import EditListingPage from './pages/EditListingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import {CartProvider} from "./context/CartContext.jsx";

// Protected route component
const ProtectedRoute = ({children, requiredRole = null}) => {
    const {user, isAuthenticated, loading} = useAuth();

    // Show loading state while checking authentication
    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login"/>;
    }

    // Check if role requirement is met
    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/"/>;
    }

    return children;
};

function AppContent() {
    return (
        <div className="app">
            <Navbar/>
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<HomePage/>}/>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/register" element={<RegisterPage/>}/>
                    <Route path="/buyer" element={<BuyerPage/>}/>
                    <Route path="/contact" element={<ContactUsPage/>}/>
                    <Route path="/product/:id" element={<ProductDetail/>}/>
                    <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>

                    <Route path="/seller" element={
                        <ProtectedRoute>
                            <SellerPage/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/create-listing" element={
                        <ProtectedRoute>
                            <CreateListingPage/>
                        </ProtectedRoute>
                    }/>

                    {/* Add Edit Listing route */}
                    <Route path="/edit-listing/:id" element={
                        <ProtectedRoute>
                            <EditListingPage/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/admin" element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminDashboard/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/cart" element={
                        <ProtectedRoute>
                            <CartPage/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/checkout" element={
                        <ProtectedRoute>
                            <CheckoutPage/>
                        </ProtectedRoute>
                    }/>

                    <Route path="/messages" element={
                        <ProtectedRoute>
                            <MessagesPage />
                        </ProtectedRoute>
                    }/>

                    {/* Update this to just handle user selection, not query params */}
                    <Route path="/messages/new" element={
                        <ProtectedRoute>
                            <NewMessagePage />
                        </ProtectedRoute>
                    }/>

                    <Route path="/messages/new/:userId" element={
                        <ProtectedRoute>
                            <NewMessagePage />
                        </ProtectedRoute>
                    }/>

                    {/* Redirect any messages/* route to the main messages page with query params */}
                    <Route path="/messages/*" element={
                        <ProtectedRoute>
                            <Navigate to="/messages" />
                        </ProtectedRoute>
                    }/>

                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <UserProfile/>
                        </ProtectedRoute>
                    }/>
                </Routes>
            </main>
            <Footer/>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <AppContent/>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;