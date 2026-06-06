const express = require('express');
const router = express.Router();
const pool = require('../config/pool');
const bookingCodeService = require('../services/bookingCodeService');
const seatAvailability = require('../services/seatAvailability');
const paymentService = require('../services/paymentService');
const ticketService = require('../services/ticketService');
const Validation = require('../utils/validation');

// Middleware to check if customer is logged in
const authCustomer = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'customer') {
        next();
    } else {
        res.redirect('/login-customer');
    }
};

router.use(authCustomer);

router.get('/', (req, res) => {
    res.redirect('/customer/dashboard');
});

// Dashboard & Search Form
router.get('/dashboard', async (req, res) => {
    const [origins] = await pool.query('SELECT DISTINCT origin_city FROM routes');
    const [destinations] = await pool.query('SELECT DISTINCT destination_city FROM routes');

    const [schedules] = await pool.query(`
        SELECT s.*, v.plate_number, v.vehicle_type, v.capacity, r.origin_city, r.destination_city
        FROM schedules s
        JOIN routes r ON s.route_id = r.route_id
        JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        WHERE s.status = 'available' AND s.departure_time > NOW()
        ORDER BY s.departure_time ASC
    `);

    res.render('customer/dashboard-customer', { title: 'Dashboard Customer', user: req.session.user, origins, destinations, schedules });
});

// Search Results
router.get('/search', async (req, res) => {
    const { origin, destination, date } = req.query;

    if (date) {
        const searchDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (searchDate < today) {
            return res.render('customer/search-results', {
                title: 'Hasil Pencarian',
                user: req.session.user,
                schedules: [],
                origin,
                destination,
                date,
                error: 'Tidak dapat mencari jadwal untuk tanggal yang sudah lewat.'
            });
        }
    }

    let query = `
        SELECT s.*, v.plate_number, v.vehicle_type, v.capacity, r.origin_city, r.destination_city
        FROM schedules s
        JOIN routes r ON s.route_id = r.route_id
        JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        WHERE s.status = 'available' AND s.departure_time > NOW()
    `;
    const params = [];

    if (origin) {
        query += ` AND r.origin_city = ?`;
        params.push(origin);
    }
    if (destination) {
        query += ` AND r.destination_city = ?`;
        params.push(destination);
    }
    if (date) {
        query += ` AND DATE(s.departure_time) = ?`;
        params.push(date);
    }

    query += ` ORDER BY s.departure_time ASC`;

    const [schedules] = await pool.query(query, params);
    res.render('customer/search-results', { title: 'Hasil Pencarian', user: req.session.user, schedules, origin, destination, date });
});

// Booking Form
router.get('/booking/:scheduleId', async (req, res) => {
    const scheduleId = req.params.scheduleId;
    const [schedules] = await pool.query(`
        SELECT s.*, v.plate_number, v.vehicle_type, v.capacity, r.origin_city, r.destination_city
        FROM schedules s
        JOIN routes r ON s.route_id = r.route_id
        JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        WHERE s.schedule_id = ?
    `, [scheduleId]);

    if (schedules.length === 0) return res.redirect('/customer/dashboard');
    const schedule = schedules[0];

    const bookedSeats = await seatAvailability.getSeatStatuses(pool, scheduleId);

    res.render('customer/booking-form', { title: 'Form Pemesanan', user: req.session.user, schedule, bookedSeats });
});

// Seat availability polling endpoint (AJAX)
router.get('/api/seats/:scheduleId', async (req, res) => {
    try {
        const scheduleId = req.params.scheduleId;

        const [schedules] = await pool.query(
            'SELECT v.capacity FROM schedules s JOIN vehicles v ON s.vehicle_id = v.vehicle_id WHERE s.schedule_id = ?',
            [scheduleId]
        );
        if (schedules.length === 0) return res.json({ error: 'Jadwal tidak ditemukan' });

        const bookedSeats = await seatAvailability.getSeatStatuses(pool, scheduleId);

        res.json({ bookedSeats, capacity: schedules[0].capacity });
    } catch (err) {
        console.error('Seat polling error:', err);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// Process Booking
router.post('/booking/:scheduleId', async (req, res) => {
    try {
        const scheduleId = req.params.scheduleId;
        const { passenger_name, seat_number } = req.body;
        const userId = req.session.user.id;

        const reqErr = Validation.validateRequired(['passenger_name', 'seat_number'], req.body);
        if (reqErr) {
            return res.send(`<script>alert('${reqErr}'); window.history.back();</script>`);
        }

        const [schedules] = await pool.query('SELECT price, vehicle_id FROM schedules WHERE schedule_id=?', [scheduleId]);
        if (schedules.length === 0) {
            return res.send("<script>alert('Gagal membuat pesanan: Jadwal tidak ditemukan!'); window.location.href='/customer/dashboard';</script>");
        }
        const schedule = schedules[0];

        let seat_id = null;
        const [seats] = await pool.query('SELECT seat_id FROM seats WHERE vehicle_id=? AND seat_number=?', [schedule.vehicle_id, seat_number]);
        if (seats.length > 0) {
            seat_id = seats[0].seat_id;
        } else {
            const [sRes] = await pool.query('INSERT INTO seats (vehicle_id, seat_number) VALUES (?, ?)', [schedule.vehicle_id, seat_number]);
            seat_id = sRes.insertId;
        }

        const bookingCode = await bookingCodeService.generateCode();

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            await seatAvailability.assertSeatAvailable(conn, scheduleId, seat_id);

            const [result] = await conn.query(`
                INSERT INTO bookings (user_id, schedule_id, booking_code, booking_channel, total_amount, passenger_name, status, hold_expired_at, created_at)
                VALUES (?, ?, ?, 'online', ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW())
            `, [userId, scheduleId, bookingCode, schedule.price, passenger_name]);

            const bookingId = result.insertId;

            await conn.query('INSERT INTO booking_seats (booking_id, seat_id, price_at_booking) VALUES (?, ?, ?)', [bookingId, seat_id, schedule.price]);

            await conn.commit();
            res.redirect(`/customer/payment/${bookingId}`);
        } catch(err) {
            await conn.rollback();
            if (err.message === 'SEAT_TAKEN') {
                return res.send('Maaf, kursi sudah dipesan orang lain. Silakan kembali dan pilih kursi lain.');
            }
            console.error('Online booking transaction error:', err);
            res.send('Terjadi kesalahan database saat membuat pesanan. Silakan coba lagi.');
        } finally {
            conn.release();
        }
    } catch(e) {
        console.error('Online booking error:', e);
        res.send('Terjadi kesalahan server saat membuat pesanan. Silakan coba lagi.');
    }
});

// Payment Page
router.get('/payment/:bookingId', async (req, res) => {
    const bookingId = req.params.bookingId;
    const [bookings] = await pool.query(`
        SELECT b.*, s.departure_time, r.origin_city, r.destination_city,
          (SELECT GROUP_CONCAT(st.seat_number) FROM booking_seats bs2 JOIN seats st ON bs2.seat_id = st.seat_id WHERE bs2.booking_id = b.booking_id) AS seat_numbers
        FROM bookings b
        JOIN schedules s ON b.schedule_id = s.schedule_id
        JOIN routes r ON s.route_id = r.route_id
        WHERE b.booking_id = ? AND b.user_id = ?
    `, [bookingId, req.session.user.id]);

    if (bookings.length === 0) return res.redirect('/customer/my-bookings');
    const booking = bookings[0];

    const isExpired = booking.status === 'pending' && new Date() > new Date(booking.hold_expired_at);
    if (isExpired) {
        await pool.query('UPDATE bookings SET status="expired" WHERE booking_id=?', [bookingId]);
        booking.status = 'expired';
    }

    res.render('customer/payment', { title: 'Pembayaran', user: req.session.user, booking });
});

// Confirm Payment
router.post('/pay/:bookingId', async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const userId = req.session.user.id;
        const { payment_method, account_number, pin } = req.body;

        const [bookings] = await pool.query(
            'SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?',
            [bookingId, userId]
        );

        if (bookings.length === 0) return res.redirect('/customer/my-bookings');
        const booking = bookings[0];

        if (booking.status === 'confirmed') return res.redirect('/customer/my-bookings');

        if (booking.status === 'expired' || (booking.status === 'pending' && new Date() > new Date(booking.hold_expired_at))) {
            if (booking.status === 'pending') {
                await pool.query('UPDATE bookings SET status="expired" WHERE booking_id=?', [bookingId]);
            }
            return res.send("<script>alert('Waktu pembayaran telah habis. Pesanan otomatis dibatalkan.'); window.location.href='/customer/my-bookings';</script>");
        }

        if (booking.status === 'cancelled') {
            return res.send("<script>alert('Pesanan ini telah dibatalkan.'); window.location.href='/customer/my-bookings';</script>");
        }

        const gatewayResult = paymentService.simulateGatewayCharge(payment_method, account_number, pin);
        if (!gatewayResult.success) {
            const [refetch] = await pool.query(`
                SELECT b.*, s.departure_time, r.origin_city, r.destination_city,
                  (SELECT GROUP_CONCAT(st.seat_number) FROM booking_seats bs2 JOIN seats st ON bs2.seat_id = st.seat_id WHERE bs2.booking_id = b.booking_id) AS seat_numbers
                FROM bookings b
                JOIN schedules s ON b.schedule_id = s.schedule_id
                JOIN routes r ON s.route_id = r.route_id
                WHERE b.booking_id = ?
            `, [bookingId]);
            return res.render('customer/payment', {
                title: 'Pembayaran',
                user: req.session.user,
                booking: refetch[0],
                error: gatewayResult.error
            });
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const paymentId = await paymentService.createPendingPayment(conn, bookingId, booking.total_amount, payment_method);
            await paymentService.confirmPayment(conn, paymentId, gatewayResult.transactionId);
            await conn.query('UPDATE bookings SET status = "confirmed" WHERE booking_id = ? AND status = "pending"', [bookingId]);
            await ticketService.issueTicket(conn, bookingId, booking.booking_code);

            await conn.commit();
            res.redirect('/customer/my-bookings');
        } catch (err) {
            await conn.rollback();
            console.error('Payment transaction error:', err);
            res.send("<script>alert('Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.'); window.history.back();</script>");
        } finally {
            conn.release();
        }
    } catch (e) {
        console.error('Payment error:', e);
        res.send("<script>alert('Terjadi kesalahan server.'); window.location.href='/customer/my-bookings';</script>");
    }
});

// Customer E-Ticket
router.get('/eticket/:bookingId', async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const [bookings] = await pool.query(`
            SELECT b.*, s.departure_time, s.arrival_estimate, s.pickup_point, s.dropoff_point,
              r.origin_city, r.destination_city, v.plate_number, v.vehicle_type,
              (SELECT GROUP_CONCAT(st.seat_number) FROM booking_seats bs2 JOIN seats st ON bs2.seat_id = st.seat_id WHERE bs2.booking_id = b.booking_id) AS seat_numbers
            FROM bookings b
            JOIN schedules s ON b.schedule_id = s.schedule_id
            JOIN routes r ON s.route_id = r.route_id
            LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
            WHERE b.booking_id = ? AND b.user_id = ?
        `, [bookingId, req.session.user.id]);

        if (bookings.length === 0) return res.redirect('/customer/my-bookings');
        const booking = bookings[0];

        if (booking.status !== 'confirmed') {
            return res.redirect('/customer/my-bookings');
        }

        let ticket = await ticketService.getTicketByBookingId(pool, bookingId);
        if (!ticket) {
            ticket = await ticketService.issueTicket(pool, bookingId, booking.booking_code);
        }

        res.render('customer/eticket', { title: 'E-Ticket', user: req.session.user, booking, ticket });
    } catch (e) {
        console.error('E-Ticket error:', e);
        res.redirect('/customer/my-bookings');
    }
});

// Booking Detail
router.get('/booking-detail/:bookingId', async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const [bookings] = await pool.query(`
            SELECT b.*, s.departure_time, s.arrival_estimate, s.pickup_point, s.dropoff_point, s.price AS schedule_price,
              r.origin_city, r.destination_city, v.plate_number, v.vehicle_type,
              (SELECT GROUP_CONCAT(st.seat_number) FROM booking_seats bs2 JOIN seats st ON bs2.seat_id = st.seat_id WHERE bs2.booking_id = b.booking_id) AS seat_numbers
            FROM bookings b
            JOIN schedules s ON b.schedule_id = s.schedule_id
            JOIN routes r ON s.route_id = r.route_id
            LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
            WHERE b.booking_id = ? AND b.user_id = ?
        `, [bookingId, req.session.user.id]);

        if (bookings.length === 0) return res.redirect('/customer/my-bookings');
        const booking = bookings[0];

        const isExpired = booking.status === 'pending' && new Date() > new Date(booking.hold_expired_at);
        if (isExpired) {
            await pool.query('UPDATE bookings SET status="expired" WHERE booking_id=?', [bookingId]);
            booking.status = 'expired';
        }

        const payment = await paymentService.getPaymentByBookingId(pool, bookingId);
        const ticket = await ticketService.getTicketByBookingId(pool, bookingId);

        res.render('customer/booking-detail', { title: 'Detail Pesanan', user: req.session.user, booking, payment, ticket });
    } catch (e) {
        console.error('Booking detail error:', e);
        res.redirect('/customer/my-bookings');
    }
});

// My Bookings
router.get('/my-bookings', async (req, res) => {
    const [bookings] = await pool.query(`
        SELECT b.*, s.departure_time, r.origin_city, r.destination_city,
          (SELECT GROUP_CONCAT(st.seat_number) FROM booking_seats bs2 JOIN seats st ON bs2.seat_id = st.seat_id WHERE bs2.booking_id = b.booking_id) AS seat_numbers
        FROM bookings b
        JOIN schedules s ON b.schedule_id = s.schedule_id
        JOIN routes r ON s.route_id = r.route_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    `, [req.session.user.id]);

    res.render('customer/my-bookings', { title: 'Pesanan Saya', user: req.session.user, bookings });
});

// Cancel Booking
router.post('/booking/:bookingId/cancel', async (req, res) => {
    await pool.query('UPDATE bookings SET status="cancelled" WHERE booking_id=? AND user_id=?', [req.params.bookingId, req.session.user.id]);
    res.redirect('/customer/my-bookings');
});

// Delete Booking History
router.post('/booking/:bookingId/delete', async (req, res) => {
    await pool.query('DELETE FROM bookings WHERE booking_id=? AND user_id=? AND status IN ("cancelled","expired")', [req.params.bookingId, req.session.user.id]);
    res.redirect('/customer/my-bookings');
});

module.exports = router;
