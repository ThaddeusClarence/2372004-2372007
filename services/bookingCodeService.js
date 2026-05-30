const pool = require('../config/pool');

/**
 * Generate a random uppercase alphanumeric string of a given length.
 * @param {number} length 
 * @returns {string}
 */
function randomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Service to generate a unique booking code starting with "BK" followed by 8 alphanumeric characters.
 */
class BookingCodeService {
    /**
     * Generates a unique booking code BK[A-Z0-9]{8} and checks database for collision.
     * @returns {Promise<string>}
     */
    static async generateCode() {
        let code = '';
        let exists = true;
        let attempts = 0;

        while (exists && attempts < 10) {
            code = 'BK' + randomString(8);
            const [rows] = await pool.query('SELECT booking_id FROM bookings WHERE booking_code = ?', [code]);
            exists = rows.length > 0;
            attempts++;
        }

        if (exists) {
            throw new Error('Failed to generate a unique booking code after multiple attempts.');
        }

        return code;
    }
}

module.exports = BookingCodeService;
