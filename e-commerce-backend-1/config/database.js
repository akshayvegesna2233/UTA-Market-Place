// config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'pass',
    database: process.env.DB_NAME || 'commerce_one',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connection established successfully.');
        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
};

// Initialize database by checking if settings exist
const initializeDatabase = async () => {
    try {
        // Check if settings table exists and has a record
        const [rows] = await pool.execute(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'settings'",
            [process.env.DB_NAME || 'commerce_one']
        );

        if (rows[0].count > 0) {
            // Check if settings record exists
            const [settingsRows] = await pool.execute('SELECT COUNT(*) as count FROM settings');

            if (settingsRows[0].count === 0) {
                // Insert default settings
                await pool.execute(
                    `INSERT INTO settings (
            id, platform_name, support_email, items_per_page, 
            commission_rate, min_commission, 
            require_email_verification, require_admin_approval, enable_two_factor
          ) VALUES (
            1, 'UTA Market Place', 'support@utamarketplace.edu', 20,
            5.00, 0.50, 
            TRUE, TRUE, TRUE
          )`
                );
                console.log('Default settings initialized.');
            }
        }
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

// Custom query function that handles errors gracefully
const query = async (sql, params = []) => {
    try {
        const [rows, fields] = await pool.execute(sql, params);
        return [rows, fields];
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

module.exports = {
    pool,
    testConnection,
    initializeDatabase,
    query
};