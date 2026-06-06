const pool = require('../config/pool');

const VALID_METHODS = ['BCA', 'MANDIRI', 'BNI', 'GOPAY', 'OVO', 'QRIS'];

function randomChars(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

class PaymentService {
    static async createPendingPayment(connOrPool, bookingId, amount, method) {
        const [result] = await connOrPool.query(
            'INSERT INTO payments (booking_id, amount, method, status) VALUES (?, ?, ?, ?)',
            [bookingId, amount, method, 'pending']
        );
        return result.insertId;
    }

    // Replace internals with real gateway (e.g. Midtrans) for production
    static simulateGatewayCharge(method, accountNumber, pin) {
        if (!method || !VALID_METHODS.includes(method)) {
            return { success: false, error: 'Metode pembayaran tidak valid.' };
        }
        if (!accountNumber || accountNumber.trim().length === 0) {
            return { success: false, error: 'Nomor rekening/HP wajib diisi.' };
        }
        if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
            return { success: false, error: 'PIN harus tepat 6 digit angka.' };
        }
        return {
            success: true,
            transactionId: 'SIM-' + Date.now() + '-' + randomChars(6)
        };
    }

    static async confirmPayment(connOrPool, paymentId, gatewayTransactionId) {
        const [result] = await connOrPool.query(
            'UPDATE payments SET status = ?, gateway_transaction_id = ?, paid_at = NOW() WHERE payment_id = ?',
            ['paid', gatewayTransactionId, paymentId]
        );
        return result.affectedRows;
    }

    static async getPaymentByBookingId(connOrPool, bookingId) {
        const [rows] = await connOrPool.query(
            'SELECT * FROM payments WHERE booking_id = ? ORDER BY payment_id DESC LIMIT 1',
            [bookingId]
        );
        return rows.length > 0 ? rows[0] : null;
    }
}

module.exports = PaymentService;
