const express = require('express');
const router = express.Router();
const pool = require('../config/pool');
const bookingCodeService = require('../services/bookingCodeService');
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
    // Get unique origin and destination cities for the dropdowns
    const [origins] = await pool.query('SELECT DISTINCT origin_city FROM routes');
    const [destinations] = await pool.query('SELECT DISTINCT destination_city FROM routes');
    
    // Fetch all available schedules
    const [schedules] = await pool.query(`
        SELECT s.*, v.plate_number, v.vehicle_type, v.capacity, r.origin_city, r.destination_city 
        FROM schedules s
        JOIN routes r ON s.route_id = r.route_id
        JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        WHERE s.status = 'available'
        ORDER BY s.departure_time ASC
    `);

    res.render('customer/dashboard-customer', { title: 'Dashboard Customer', user: req.session.user, origins, destinations, schedules });
});

// Search Results
router.get('/search', async (req, res) => {
    const { origin, destination, date } = req.query;
    let query = `
        SELECT s.*, v.plate_number, v.vehicle_type, v.capacity, r.origin_city, r.destination_city 
        FROM schedules s
        JOIN routes r ON s.route_id = r.route_id
        JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        WHERE s.status = 'available'
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

    // Find booked seats (status confirmed or pending within hold timer)
    const [bookedSeatsData] = await pool.query(`
        SELECT st.seat_number 
        FROM booking_seats bs
        JOIN bookings b ON bs.booking_id = b.booking_id
        JOIN seats st ON bs.seat_id = st.seat_id
        WHERE b.schedule_id = ? AND (b.status = 'confirmed' OR (b.status = 'pending' AND b.hold_expired_at > NOW()))
    `, [scheduleId]);

    const bookedSeats = bookedSeatsData.map(b => b.seat_number.toString());

    res.render('customer/booking-form', { title: 'Form Pemesanan', user: req.session.user, schedule, bookedSeats });
});

// Process Booking
router.post('/booking/:scheduleId', async (req, res) => {
    try {
        const scheduleId = req.params.scheduleId;
        const { passenger_name, seat_number } = req.body;
        const userId = req.session.user.id;

        // Validate required fields
        const reqErr = Validation.validateRequired(['passenger_name', 'seat_number'], req.body);
        if (reqErr) {
            return res.send(`<script>alert('${reqErr}'); window.history.back();</script>`);
        }

        // Get price and vehicle_id
        const [schedules] = await pool.query('SELECT price, vehicle_id FROM schedules WHERE schedule_id=?', [scheduleId]);
        if (schedules.length === 0) {
            return res.send("<script>alert('Gagal membuat pesanan: Jadwal tidak ditemukan!'); window.location.href='/customer/dashboard';</script>");
        }
        const schedule = schedules[0];

        // Find or create seat to get seat_id
        let seat_id = null;
        const [seats] = await pool.query('SELECT seat_id FROM seats WHERE vehicle_id=? AND seat_number=?', [schedule.vehicle_id, seat_number]);
        if (seats.length > 0) {
            seat_id = seats[0].seat_id;
        } else {
            const [sRes] = await pool.query('INSERT INTO seats (vehicle_id, seat_number) VALUES (?, ?)', [schedule.vehicle_id, seat_number]);
            seat_id = sRes.insertId;
        }

        // Validate seat again to prevent double booking
        const [bookedSeatsData] = await pool.query(`
            SELECT bs.booking_seat_id 
            FROM booking_seats bs
            JOIN bookings b ON bs.booking_id = b.booking_id
            WHERE b.schedule_id = ? AND bs.seat_id = ? AND (b.status = 'confirmed' OR (b.status = 'pending' AND b.hold_expired_at > NOW()))
        `, [scheduleId, seat_id]);

        if (bookedSeatsData.length > 0) {
            return res.send('Maaf, kursi sudah dipesan orang lain. Silakan kembali dan pilih kursi lain.');
        }

        // Generate unique booking code
        const bookingCode = await bookingCodeService.generateCode();

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Insert booking with hold_expired_at = NOW() + 10 minutes
            const [result] = await conn.query(`
                INSERT INTO bookings (user_id, schedule_id, booking_code, booking_channel, total_amount, passenger_name, status, hold_expired_at, created_at)
                VALUES (?, ?, ?, 'online', ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW())
            `, [userId, scheduleId, bookingCode, schedule.price, passenger_name]);

            const bookingId = result.insertId;
            
            // Insert seat mapping with captured price_at_booking
            await conn.query('INSERT INTO booking_seats (booking_id, seat_id, price_at_booking) VALUES (?, ?, ?)', [bookingId, seat_id, schedule.price]);

            await conn.commit();
            res.redirect(`/customer/payment/${bookingId}`);
        } catch(err) {
            await conn.rollback();
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
        SELECT b.*, s.departure_time, r.origin_city, r.destination_city, bs.seat_id
        FROM bookings b
        JOIN schedules s ON b.schedule_id = s.schedule_id
        JOIN routes r ON s.route_id = r.route_id
        LEFT JOIN booking_seats bs ON b.booking_id = bs.booking_id
        WHERE b.booking_id = ? AND b.user_id = ?
    `, [bookingId, req.session.user.id]);

    if (bookings.length === 0) return res.redirect('/customer/my-bookings');
    const booking = bookings[0];

    // Check if expired
    const isExpired = booking.status === 'pending' && new Date() > new Date(booking.hold_expired_at);
    if (isExpired && booking.status === 'pending') {
        await pool.query('UPDATE bookings SET status="expired" WHERE booking_id=?', [bookingId]);
        booking.status = 'expired';
    }

    res.render('customer/payment', { title: 'Pembayaran', user: req.session.user, booking });
});

// Confirm Payment
router.post('/pay/:bookingId', async (req, res) => {
    await pool.query('UPDATE bookings SET status="confirmed" WHERE booking_id=? AND user_id=? AND status="pending"', [req.params.bookingId, req.session.user.id]);
    res.redirect('/customer/my-bookings');
});

// My Bookings
router.get('/my-bookings', async (req, res) => {
    const [bookings] = await pool.query(`
        SELECT b.*, s.departure_time, r.origin_city, r.destination_city, bs.seat_id
        FROM bookings b
        JOIN schedules s ON b.schedule_id = s.schedule_id
        JOIN routes r ON s.route_id = r.route_id
        LEFT JOIN booking_seats bs ON b.booking_id = bs.booking_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    `, [req.session.user.id]);

    res.render('customer/my-bookings', { title: 'Pesanan Saya', user: req.session.user, bookings });
});

// Cancel Booking
router.post('/booking/:bookingId/cancel', async (req, res) => {
    await pool.query('UPDATE bookings SET status="cancelled" WHERE booking_id=? AND user_id=?', [req.params.bookingId, req.session.user.id]);
    await pool.query('DELETE FROM booking_seats WHERE booking_id=?', [req.params.bookingId]);
    res.redirect('/customer/my-bookings');
});

// Delete Booking History
router.post('/booking/:bookingId/delete', async (req, res) => {
    await pool.query('DELETE FROM booking_seats WHERE booking_id=?', [req.params.bookingId]);
    await pool.query('DELETE FROM bookings WHERE booking_id=? AND user_id=?', [req.params.bookingId, req.session.user.id]);
    res.redirect('/customer/my-bookings');
});

module.exports = router;
