const pool = require('../config/pool');

class ExpirationService {
    static async expireStaleBookings() {
        const [result] = await pool.query(
            "UPDATE bookings SET status = 'expired' WHERE status = 'pending' AND hold_expired_at IS NOT NULL AND hold_expired_at <= NOW()"
        );
        return result.affectedRows;
    }
}

module.exports = ExpirationService;
