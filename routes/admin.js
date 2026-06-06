const express = require('express');
const router = express.Router();
const authAdmin = require('../middleware/authAdmin');
const pool = require('../config/pool');
const qrService = require('../utils/qrService');
const bookingCodeService = require('../services/bookingCodeService');
const seatAvailability = require('../services/seatAvailability');
const Validation = require('../utils/validation');

/* Dashboard */
router.get('/dashboard', authAdmin, async (req, res) => {
    try {
        const [[bookingCount]] = await pool.query('SELECT COUNT(*) AS total FROM bookings');
        const [[confirmedCount]] = await pool.query("SELECT COUNT(*) AS total FROM bookings WHERE status='confirmed'");
        const [[revenueResult]] = await pool.query("SELECT IFNULL(SUM(total_amount),0) AS total FROM bookings WHERE status='confirmed'");
        const [[scheduleCount]] = await pool.query('SELECT COUNT(*) AS total FROM schedules');
        const [[vehicleCount]] = await pool.query('SELECT COUNT(*) AS total FROM vehicles');
        res.render('admin/dashboard', {
            title: 'Dashboard Admin',
            user: req.session.user,
            stats: {
                totalBookings: bookingCount.total,
                confirmed: confirmedCount.total,
                revenue: revenueResult.total,
                schedules: scheduleCount.total,
                vehicles: vehicleCount.total
            }
        });
    } catch (err) {
        console.error(err);
        res.render('admin/dashboard', {
            title: 'Dashboard Admin',
            user: req.session.user,
            stats: { totalBookings: 0, confirmed: 0, revenue: 0, schedules: 0, vehicles: 0 }
        });
    }
});

/* Schedules */
router.get('/schedules', authAdmin, async (req, res) => {
    const [schedules] = await pool.query(`
        SELECT s.*, v.plate_number AS vehicle_name, r.origin_city AS origin, r.destination_city AS destination 
        FROM schedules s 
        LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id 
        LEFT JOIN routes r ON s.route_id = r.route_id 
        ORDER BY s.departure_time DESC
    `);
    const [vehicles] = await pool.query('SELECT * FROM vehicles');
    res.render('admin/schedules', { title: 'Manajemen Jadwal', schedules, vehicles, user: req.session.user });
});
router.post('/schedules', authAdmin, async (req, res) => {
    const { origin, destination, departure, arrival, vehicle_id, price, pickup_point, dropoff_point } = req.body;
    // Find or create route
    let route_id = null;
    const [routes] = await pool.query('SELECT route_id FROM routes WHERE origin_city=? AND destination_city=?', [origin, destination]);
    if (routes.length > 0) {
        route_id = routes[0].route_id;
    } else {
        const [result] = await pool.query('INSERT INTO routes (origin_city, destination_city) VALUES (?, ?)', [origin, destination]);
        route_id = result.insertId;
    }

    await pool.query(
        'INSERT INTO schedules (route_id,vehicle_id,departure_time,arrival_estimate,price,pickup_point,dropoff_point,status) VALUES (?,?,?,?,?,?,?,?)', 
        [route_id, vehicle_id || null, departure, arrival, price, pickup_point || null, dropoff_point || null, 'available']
    );
    res.redirect('/admin/schedules');
});
router.post('/schedules/delete/:id', authAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM schedules WHERE schedule_id=?', [req.params.id]);
        res.redirect('/admin/schedules');
    } catch(e) {
        console.error('Delete schedule error:', e);
        res.send("<script>alert('Gagal menghapus jadwal! Jadwal ini sudah memiliki pesanan yang terhubung.'); window.location.href='/admin/schedules';</script>");
    }
});

/* Vehicles */
router.get('/vehicles', authAdmin, async (req, res) => {
    const [vehicles] = await pool.query('SELECT * FROM vehicles ORDER BY vehicle_id DESC');
    res.render('admin/vehicles', { title: 'Manajemen Kendaraan', vehicles, user: req.session.user });
});
router.post('/vehicles', authAdmin, async (req, res) => {
    const { name, type, capacity, image_url } = req.body;
    await pool.query('INSERT INTO vehicles (plate_number,vehicle_type,capacity,status) VALUES (?,?,?,?)', [name, type, capacity, 'active']);
    res.redirect('/admin/vehicles');
});
router.post('/vehicles/delete/:id', authAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM vehicles WHERE vehicle_id=?', [req.params.id]);
        res.redirect('/admin/vehicles');
    } catch(e) {
        console.error('Delete vehicle error:', e);
        res.send("<script>alert('Gagal menghapus kendaraan! Kendaraan ini memiliki kursi atau jadwal yang terhubung.'); window.location.href='/admin/vehicles';</script>");
    }
});

/* Bookings */
router.get('/bookings', authAdmin, async (req, res) => {
    const [bookings] = await pool.query(`
        SELECT b.booking_id as id, u.email, r.origin_city AS origin, r.destination_city AS destination, b.status, b.created_at, b.passenger_name,
        (SELECT GROUP_CONCAT(st.seat_number) FROM booking_seats bs JOIN seats st ON bs.seat_id = st.seat_id WHERE bs.booking_id = b.booking_id) as seat_number
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        JOIN schedules s ON b.schedule_id = s.schedule_id
        JOIN routes r ON s.route_id = r.route_id
        ORDER BY b.created_at DESC
    `);
    res.render('admin/bookings', { title: 'Manajemen Pemesanan', bookings, user: req.session.user });
});
router.post('/bookings/status/:id', authAdmin, async (req, res) => {
    const { status } = req.body;
    // Map status if needed, but enum is pending, confirmed, cancelled, expired
    let dbStatus = status;
    if (status === 'canceled') dbStatus = 'cancelled';
    if (status === 'refunded') dbStatus = 'cancelled'; // simplificiation
    await pool.query('UPDATE bookings SET status=? WHERE booking_id=?', [dbStatus, req.params.id]);
    const io = req.app.get('io');
    if (io) io.emit('bookingUpdate', { id: req.params.id, status: dbStatus });
    res.redirect('/admin/bookings');
});

/* Offline Booking */
router.get('/bookings/new', authAdmin, async (req, res) => {
    const [schedules] = await pool.query(`
        SELECT s.*, r.origin_city AS origin, r.destination_city AS destination 
        FROM schedules s JOIN routes r ON s.route_id = r.route_id 
        WHERE s.departure_time > NOW() ORDER BY s.departure_time ASC
    `);
    res.render('admin/booking-new', { title: 'Tambah Pemesanan Offline', schedules, user: req.session.user });
});

router.post('/bookings/new', authAdmin, async (req, res) => {
    try {
        const { schedule_id, passenger_name, seat_number } = req.body;
        const user_id = req.session.user ? req.session.user.id : null; 

        // Validate required fields
        const reqErr = Validation.validateRequired(['schedule_id', 'passenger_name', 'seat_number'], req.body);
        if (reqErr) {
            return res.send(`<script>alert('${reqErr}'); window.history.back();</script>`);
        }

        // Get price and vehicle_id
        const [schedules] = await pool.query('SELECT price, vehicle_id FROM schedules WHERE schedule_id=?', [schedule_id]);
        if (schedules.length === 0) {
            return res.send("<script>alert('Gagal membuat pesanan: Jadwal tidak ditemukan!'); window.history.back();</script>");
        }
        const schedule = schedules[0];

        // Find or create seat
        let seat_id = null;
        const [seats] = await pool.query('SELECT seat_id FROM seats WHERE vehicle_id=? AND seat_number=?', [schedule.vehicle_id, seat_number]);
        if (seats.length > 0) {
            seat_id = seats[0].seat_id;
        } else {
            const [sRes] = await pool.query('INSERT INTO seats (vehicle_id, seat_number) VALUES (?, ?)', [schedule.vehicle_id, seat_number]);
            seat_id = sRes.insertId;
        }

        // Generate unique booking code
        const booking_code = await bookingCodeService.generateCode();

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            await seatAvailability.assertSeatAvailable(conn, schedule_id, seat_id);

            const [result] = await conn.query(
                "INSERT INTO bookings (user_id, schedule_id, booking_code, booking_channel, total_amount, passenger_name, status, created_at) VALUES (?, ?, ?, 'offline', ?, ?, 'confirmed', NOW())",
                [user_id, schedule_id, booking_code, schedule.price, passenger_name]
            );

            await conn.query('INSERT INTO booking_seats (booking_id, seat_id, price_at_booking) VALUES (?, ?, ?)', [result.insertId, seat_id, schedule.price]);

            await conn.commit();
            res.redirect('/admin/bookings');
        } catch(err) {
            await conn.rollback();
            if (err.message === 'SEAT_TAKEN') {
                return res.send("<script>alert('Gagal membuat pesanan: Kursi ini sudah dipesan atau sedang ditahan!'); window.history.back();</script>");
            }
            console.error('Offline booking transaction error:', err);
            res.send("<script>alert('Gagal membuat pesanan: Terjadi kesalahan database.'); window.history.back();</script>");
        } finally {
            conn.release();
        }
    } catch(e) {
        console.error('Offline booking error:', e);
        res.send("<script>alert('Gagal membuat pesanan: Terjadi kesalahan internal.'); window.history.back();</script>");
    }
});

/* Reschedule */
router.get('/bookings/reschedule/:id', authAdmin, async (req, res) => {
    const [bookings] = await pool.query(`
        SELECT b.booking_id as id, b.*, r.origin_city AS origin, r.destination_city AS destination 
        FROM bookings b JOIN schedules s ON b.schedule_id = s.schedule_id JOIN routes r ON s.route_id = r.route_id 
        WHERE b.booking_id = ?
    `, [req.params.id]);
    if (!bookings.length) return res.redirect('/admin/bookings');
    
    const booking = bookings[0];
    const [schedules] = await pool.query(`
        SELECT s.*, r.origin_city AS origin, r.destination_city AS destination 
        FROM schedules s JOIN routes r ON s.route_id = r.route_id 
        WHERE r.origin_city = ? AND r.destination_city = ? AND s.departure_time > NOW() 
        ORDER BY s.departure_time ASC
    `, [booking.origin, booking.destination]);
    
    res.render('admin/booking-reschedule', { title: 'Reschedule Pesanan', booking, schedules, user: req.session.user });
});

router.post('/bookings/reschedule/:id', authAdmin, async (req, res) => {
    try {
        const { schedule_id, seat_number } = req.body;

        // Validate required fields
        const reqErr = Validation.validateRequired(['schedule_id', 'seat_number'], req.body);
        if (reqErr) {
            return res.send(`<script>alert('${reqErr}'); window.history.back();</script>`);
        }

        // Fetch schedule details
        const [schedules] = await pool.query('SELECT price, vehicle_id FROM schedules WHERE schedule_id=?', [schedule_id]);
        if (schedules.length === 0) {
            return res.send("<script>alert('Gagal reschedule: Jadwal tidak ditemukan!'); window.history.back();</script>");
        }
        const schedule = schedules[0];
        
        // Find or create seat
        let seat_id = null;
        const [seats] = await pool.query('SELECT seat_id FROM seats WHERE vehicle_id=? AND seat_number=?', [schedule.vehicle_id, seat_number]);
        if (seats.length > 0) {
            seat_id = seats[0].seat_id;
        } else {
            const [sRes] = await pool.query('INSERT INTO seats (vehicle_id, seat_number) VALUES (?, ?)', [schedule.vehicle_id, seat_number]);
            seat_id = sRes.insertId;
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            await seatAvailability.assertSeatAvailable(conn, schedule_id, seat_id, req.params.id);

            await conn.query('UPDATE bookings SET schedule_id=?, total_amount=? WHERE booking_id=?', [schedule_id, schedule.price, req.params.id]);

            await conn.query('DELETE FROM booking_seats WHERE booking_id=?', [req.params.id]);
            await conn.query('INSERT INTO booking_seats (booking_id, seat_id, price_at_booking) VALUES (?, ?, ?)', [req.params.id, seat_id, schedule.price]);

            await conn.commit();
            res.redirect('/admin/bookings');
        } catch(err) {
            await conn.rollback();
            if (err.message === 'SEAT_TAKEN') {
                return res.send("<script>alert('Gagal reschedule: Kursi ini sudah dipesan oleh orang lain!'); window.history.back();</script>");
            }
            console.error('Reschedule transaction error:', err);
            res.send("<script>alert('Gagal reschedule: Terjadi kesalahan database.'); window.history.back();</script>");
        } finally {
            conn.release();
        }
    } catch(e) {
        console.error('Reschedule error:', e);
        res.send("<script>alert('Gagal reschedule: Terjadi kesalahan internal.'); window.history.back();</script>");
    }
});

/* Notifications */
router.get('/notifications', authAdmin, async (req, res) => {
    try {
        const [notifications] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
        res.render('admin/notifications', { title: 'Notifikasi', notifications, user: req.session.user });
    } catch(e) {
        console.error('Fetch notifications error:', e);
        res.render('admin/notifications', { title: 'Notifikasi', notifications: [], user: req.session.user });
    }
});
router.post('/notifications', authAdmin, async (req, res) => {
    try {
        const { message } = req.body;
        await pool.query('INSERT INTO notifications (message) VALUES (?)', [message]);
        const io = req.app.get('io');
        if (io) io.emit('adminNotification', { message });
    } catch(e) {
        console.error('Add notification error:', e);
    }
    res.redirect('/admin/notifications');
});

/* E-Ticket QR */
router.get('/eticket/:bookingId', authAdmin, async (req, res) => {
    const [rows] = await pool.query(`
        SELECT b.booking_id as id, b.*, r.origin_city AS origin, r.destination_city AS destination, s.departure_time as departure, u.email,
        (SELECT GROUP_CONCAT(st.seat_number) FROM booking_seats bs JOIN seats st ON bs.seat_id = st.seat_id WHERE bs.booking_id = b.booking_id) as seat_number
        FROM bookings b
        JOIN schedules s ON b.schedule_id = s.schedule_id
        JOIN routes r ON s.route_id = r.route_id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.booking_id=?
    `, [req.params.bookingId]);
    if (!rows.length) return res.status(404).send('Booking not found');
    const booking = rows[0];
    const qrData = `TRAVELGO|BookingID:${booking.id}|Route:${booking.origin}-${booking.destination}|Seat:${booking.seat_number}|Email:${booking.email}`;
    const qrImg = await qrService.generateBase64(qrData);
    res.render('admin/eticket', { title: 'E-Ticket', qrImg, booking, user: req.session.user });
});

module.exports = router;
