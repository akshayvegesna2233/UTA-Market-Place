// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services';

// Create context
const AuthContext = createContext(null);

// Context provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is logged in on initial load
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                setLoading(true);

                // Check if token exists
                if (authService.isAuthenticated()) {
                    // Get stored user or fetch from API if needed
                    const storedUser = authService.getUser();

                    if (storedUser) {
                        setUser(storedUser);
                    } else {
                        // Fetch user data if we have token but no user data
                        const response = await authService.getCurrentUser();
                        setUser(response.data.user);
                    }
                }

                setError(null);
            } catch (err) {
                console.error('Auth initialization error:', err);
                setError('Failed to authenticate user');
                // Clear invalid auth data
                authService.logout();
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    // Login function
    const login = async (credentials) => {
        try {
            setLoading(true);
            const data = await authService.login(credentials);
            setUser(data.user);
            setError(null);
            return data;
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Register function
    const register = async (userData) => {
        try {
            setLoading(true);
            const data = await authService.register(userData);
            setUser(data.user);
            setError(null);
            return data;
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = () => {
        authService.logout();
        setUser(null);
    };

    // Context value
    const value = {
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        register,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;