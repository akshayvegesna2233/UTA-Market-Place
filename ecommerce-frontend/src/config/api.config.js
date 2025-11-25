// src/config/api.config.js
const API_CONFIG = {
    // Use import.meta.env for Vite
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5555/api',
    TIMEOUT: 30000, // 30 seconds
    WITH_CREDENTIALS: true,
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
};

export default API_CONFIG;