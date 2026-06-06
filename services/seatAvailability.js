const pool = require('../config/pool');

class SeatAvailability {
    /**
     * Get IDs of seats currently locked (confirmed or active pending) for a schedule.
     * @param {import('mysql2/promise').Pool|import('mysql2/promise').PoolConnection} connOrPool
     * @param {number} scheduleId
     * @returns {Promise<number[]>}
     */
    static async getLockedSeatIds(connOrPool, scheduleId) {
        const [rows] = await connOrPool.query(`
            SELECT DISTINCT bs.seat_id
            FROM booking_seats bs
            JOIN bookings b ON bs.booking_id = b.booking_id
            WHERE b.schedule_id = ?
              AND (b.status = 'confirmed' OR (b.status = 'pending' AND b.hold_expired_at > NOW()))
        `, [scheduleId]);
        return rows.map(r => r.seat_id);
    }

    /**
     * Get seat numbers that are currently booked/held for a schedule.
     * Returns string array matching the format the booking form expects.
     * @param {import('mysql2/promise').Pool|import('mysql2/promise').PoolConnection} connOrPool
     * @param {number} scheduleId
     * @returns {Promise<string[]>}
     */
    static async getSeatStatuses(connOrPool, scheduleId) {
        const [rows] = await connOrPool.query(`
            SELECT DISTINCT st.seat_number
            FROM booking_seats bs
            JOIN bookings b ON bs.booking_id = b.booking_id
            JOIN seats st ON bs.seat_id = st.seat_id
            WHERE b.schedule_id = ?
              AND (b.status = 'confirmed' OR (b.status = 'pending' AND b.hold_expired_at > NOW()))
        `, [scheduleId]);
        return rows.map(r => r.seat_number.toString());
    }

    /**
     * Assert that a specific seat is available for a schedule.
     * Must be called inside a transaction — uses FOR UPDATE to prevent race conditions.
     * @param {import('mysql2/promise').PoolConnection} conn - transaction connection
     * @param {number} scheduleId
     * @param {number} seatId
     * @param {number|null} [excludeBookingId=null] - exclude this booking (for reschedule)
     * @throws {Error} with message 'SEAT_TAKEN' if seat is not available
     */
    static async assertSeatAvailable(conn, scheduleId, seatId, excludeBookingId = null) {
        let query = `
            SELECT bs.booking_seat_id
            FROM booking_seats bs
            JOIN bookings b ON bs.booking_id = b.booking_id
            WHERE b.schedule_id = ? AND bs.seat_id = ?
              AND (b.status = 'confirmed' OR (b.status = 'pending' AND b.hold_expired_at > NOW()))
        `;
        const params = [scheduleId, seatId];

        if (excludeBookingId) {
            query += ` AND b.booking_id != ?`;
            params.push(excludeBookingId);
        }

        query += ` FOR UPDATE`;

        const [rows] = await conn.query(query, params);
        if (rows.length > 0) {
            const err = new Error('SEAT_TAKEN');
            throw err;
        }
    }
}

module.exports = SeatAvailability;
