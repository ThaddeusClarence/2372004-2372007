const pool = require('../config/pool');
const qrService = require('../utils/qrService');

function randomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

class TicketService {
    static async generateTicketCode() {
        let code = '';
        let exists = true;
        let attempts = 0;

        while (exists && attempts < 10) {
            code = 'TK' + randomString(8);
            const [rows] = await pool.query('SELECT ticket_id FROM e_tickets WHERE ticket_code = ?', [code]);
            exists = rows.length > 0;
            attempts++;
        }

        if (exists) {
            throw new Error('Failed to generate a unique ticket code after multiple attempts.');
        }

        return code;
    }

    static async issueTicket(connOrPool, bookingId, bookingCode) {
        const [existing] = await connOrPool.query('SELECT * FROM e_tickets WHERE booking_id = ?', [bookingId]);
        if (existing.length > 0) {
            return existing[0];
        }

        const ticketCode = await TicketService.generateTicketCode();
        const qrPayload = `TRAVELGO|booking_code=${bookingCode}`;
        const qrCode = await qrService.generateBase64(qrPayload);

        const [result] = await connOrPool.query(
            'INSERT INTO e_tickets (booking_id, ticket_code, qr_code, issued_at) VALUES (?, ?, ?, NOW())',
            [bookingId, ticketCode, qrCode]
        );

        return {
            ticket_id: result.insertId,
            booking_id: bookingId,
            ticket_code: ticketCode,
            qr_code: qrCode,
            issued_at: new Date()
        };
    }

    static async getTicketByBookingId(connOrPool, bookingId) {
        const [rows] = await connOrPool.query('SELECT * FROM e_tickets WHERE booking_id = ?', [bookingId]);
        return rows.length > 0 ? rows[0] : null;
    }
}

module.exports = TicketService;
