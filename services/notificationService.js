const pool = require('../config/pool');

// CODE-CITE:
//   Title: Real-Time Notification Service
//   Type: ai
//   Value: Antigravity Gemini
//   Notes: Service handling database persistence and Socket.IO broadcast for notifications.
//   Lines Range: 39
class NotificationService {
    /**
     * Create and broadcast a notification.
     * @param {Object} params
     * @param {string} params.type - The type of notification ('booking_created', 'payment_confirmed', 'cancelled', 'expired', 'rescheduled', 'broadcast')
     * @param {number|null} [params.userId=null] - Target customer user ID
     * @param {number|null} [params.adminId=null] - Target admin user ID
     * @param {number|null} [params.bookingId=null] - Related booking ID
     * @param {string} params.message - The text message
     * @param {Object|null} [params.payload=null] - Additional metadata
     * @param {Object|null} [params.io=null] - Socket.IO instance
     */
    static async createNotification({ type, userId = null, adminId = null, bookingId = null, message, payload = null, io = null }) {
        try {
            const payloadStr = payload ? JSON.stringify(payload) : null;
            
            // Insert into DB
            await pool.query(
                `INSERT INTO notifications (admin_id, type, user_id, booking_id, message, payload) 
                 VALUES (?, ?, ?, ?, ?, ?)`
            , [adminId, type, userId, bookingId, message, payloadStr]);

            // Broadcast via Socket.IO
            if (io) {
                // To Admins
                io.emit('adminNotification', {
                    type,
                    userId,
                    adminId,
                    bookingId,
                    message,
                    payload
                });

                // To specific Customer
                if (userId) {
                    io.emit(`customerNotification_${userId}`, {
                        type,
                        bookingId,
                        message,
                        payload
                    });
                }

                // General booking update channel
                if (bookingId) {
                    io.emit(`booking_${bookingId}`, {
                        type,
                        message,
                        payload
                    });
                }
            }
        } catch (error) {
            console.error('Failed to create/broadcast notification:', error);
        }
    }
}

module.exports = NotificationService;
