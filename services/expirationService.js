const pool = require('../config/pool');

// CODE-CITE:
//   Title: Stale Pending Bookings Expirer
//   Type: ai
//   Value: Antigravity Gemini
//   Notes: Updates overdue pending bookings to expired and notifies customers.
//   Lines Range: 26
class ExpirationService {
    /**
     * Expire pending bookings that have passed their hold window.
     * @param {Object|null} [io=null] - Socket.IO server instance
     * @returns {Promise<number>} Number of expired bookings
     */
    static async expireStaleBookings(io = null) {
        // Find bookings that are about to expire
        const [bookings] = await pool.query(
            "SELECT booking_id, booking_code, user_id FROM bookings WHERE status = 'pending' AND hold_expired_at IS NOT NULL AND hold_expired_at <= NOW()"
        );
        if (bookings.length === 0) return 0;

        const bookingIds = bookings.map(b => b.booking_id);
        
        // Update their status
        const [result] = await pool.query(
            "UPDATE bookings SET status = 'expired' WHERE booking_id IN (?)",
            [bookingIds]
        );

        // Send notifications
        const NotificationService = require('./notificationService');
        for (const b of bookings) {
            await NotificationService.createNotification({
                type: 'expired',
                userId: b.user_id,
                bookingId: b.booking_id,
                message: `Pemesanan dengan kode ${b.booking_code} telah kedaluwarsa karena batas waktu pembayaran habis.`,
                payload: { bookingCode: b.booking_code },
                io
            });
        }

        return result.affectedRows;
    }
}

module.exports = ExpirationService;
