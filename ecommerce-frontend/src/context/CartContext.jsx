// src/context/CartContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { cartService } from '../services';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { isAuthenticated } = useAuth();

    // Fetch cart count whenever authenticated status changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchCartCount();
        } else {
            setCartCount(0);
        }
    }, [isAuthenticated]);

    // Function to fetch cart count from API
    const fetchCartCount = async () => {
        if (!isAuthenticated) return;

        setLoading(true);
        try {
            const response = await cartService.getCartItemCount();
            setCartCount(response.data.count);
        } catch (err) {
            console.error('Error fetching cart count:', err);
        } finally {
            setLoading(false);
        }
    };

    // Function to add item to cart and update count
    const addToCart = async (productId, quantity = 1) => {
        if (!isAuthenticated) return false;

        setLoading(true);
        try {
            await cartService.addCartItem(productId, quantity);
            await fetchCartCount(); // Refresh count after adding
            return true;
        } catch (err) {
            console.error('Error adding to cart:', err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Function to remove item from cart and update count
    const removeFromCart = async (itemId) => {
        if (!isAuthenticated) return false;

        setLoading(true);
        try {
            await cartService.removeCartItem(itemId);
            await fetchCartCount(); // Refresh count after removing
            return true;
        } catch (err) {
            console.error('Error removing from cart:', err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Function to clear cart and update count
    const clearCart = async () => {
        if (!isAuthenticated) return false;

        setLoading(true);
        try {
            await cartService.clearCart();
            setCartCount(0);
            return true;
        } catch (err) {
            console.error('Error clearing cart:', err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Values and functions to provide to components
    const contextValue = {
        cartCount,
        loading,
        fetchCartCount,
        addToCart,
        removeFromCart,
        clearCart
    };

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
};

// Custom hook to use the cart context
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export default CartContext;