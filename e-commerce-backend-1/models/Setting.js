// models/Setting.js
const { pool } = require('../config/database');

class Setting {
    /**
     * Get all platform settings
     * @returns {Promise<Object|null>} - Settings object or null if not found
     */
    static async getAll() {
        try {
            const [rows] = await pool.execute('SELECT * FROM settings LIMIT 1');
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error getting settings:', error);
            throw error;
        }
    }

    /**
     * Update platform settings (admin function)
     * @param {Object} settingData - Settings data to update
     * @returns {Promise<boolean>} - True if update successful
     */
    static async update(settingData) {
        try {
            const {
                platformName,
                supportEmail,
                itemsPerPage,
                commissionRate,
                minCommission,
                requireEmailVerification,
                requireAdminApproval,
                enableTwoFactor
            } = settingData;

            const [result] = await pool.execute(
                `UPDATE settings SET 
         platform_name = IFNULL(?, platform_name),
         support_email = IFNULL(?, support_email),
         items_per_page = IFNULL(?, items_per_page),
         commission_rate = IFNULL(?, commission_rate),
         min_commission = IFNULL(?, min_commission),
         require_email_verification = IFNULL(?, require_email_verification),
         require_admin_approval = IFNULL(?, require_admin_approval),
         enable_two_factor = IFNULL(?, enable_two_factor)
         WHERE id = 1`,
                [
                    platformName,
                    supportEmail,
                    itemsPerPage,
                    commissionRate,
                    minCommission,
                    requireEmailVerification,
                    requireAdminApproval,
                    enableTwoFactor
                ]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }

    /**
     * Get commission rate
     * @returns {Promise<number>} - Commission rate percentage
     */
    static async getCommissionRate() {
        try {
            const [rows] = await pool.execute('SELECT commission_rate FROM settings LIMIT 1');
            return rows.length ? rows[0].commission_rate : 5.0;
        } catch (error) {
            console.error('Error getting commission rate:', error);
            throw error;
        }
    }

    /**
     * Get minimum commission amount
     * @returns {Promise<number>} - Minimum commission amount
     */
    static async getMinCommission() {
        try {
            const [rows] = await pool.execute('SELECT min_commission FROM settings LIMIT 1');
            return rows.length ? rows[0].min_commission : 0.5;
        } catch (error) {
            console.error('Error getting minimum commission:', error);
            throw error;
        }
    }

    /**
     * Check if email verification is required
     * @returns {Promise<boolean>} - True if email verification is required
     */
    static async isEmailVerificationRequired() {
        try {
            const [rows] = await pool.execute('SELECT require_email_verification FROM settings LIMIT 1');
            return rows.length ? rows[0].require_email_verification : true;
        } catch (error) {
            console.error('Error checking email verification requirement:', error);
            throw error;
        }
    }

    /**
     * Check if admin approval is required for listings
     * @returns {Promise<boolean>} - True if admin approval is required
     */
    static async isAdminApprovalRequired() {
        try {
            const [rows] = await pool.execute('SELECT require_admin_approval FROM settings LIMIT 1');
            return rows.length ? rows[0].require_admin_approval : true;
        } catch (error) {
            console.error('Error checking admin approval requirement:', error);
            throw error;
        }
    }

    /**
     * Reset settings to default values
     * @returns {Promise<boolean>} - True if reset successful
     */
    static async resetToDefaults() {
        try {
            const [result] = await pool.execute(
                `UPDATE settings SET 
         platform_name = 'UTA Market Place',
         support_email = 'support@utamarketplace.edu',
         items_per_page = 20,
         commission_rate = 5.00,
         min_commission = 0.50,
         require_email_verification = TRUE,
         require_admin_approval = TRUE,
         enable_two_factor = TRUE
         WHERE id = 1`
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error resetting settings to defaults:', error);
            throw error;
        }
    }

    /**
     * Initialize settings if they don't exist
     * @returns {Promise<void>}
     */
    static async initialize() {
        try {
            const [count] = await pool.execute('SELECT COUNT(*) as count FROM settings');

            if (count[0].count === 0) {
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
            }
        } catch (error) {
            console.error('Error initializing settings:', error);
            throw error;
        }
    }
}

module.exports = Setting;