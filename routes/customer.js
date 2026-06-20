const express = require("express");
const router = express.Router();
const pool = require("../config/pool");
const bookingCodeService = require("../services/bookingCodeService");
const seatAvailability = require("../services/seatAvailability");
const paymentService = require("../services/paymentService");
const ticketService = require("../services/ticketService");
const requestService = require("../services/requestService");
const Validation = require("../utils/validation");
const NotificationService = require("../services/notificationService");

// Middleware to check if customer is logged in
const authCustomer = (req, res, next) => {
    if (req.session.user && req.session.user.role === "customer") {
        next();
    } else {
        res.redirect("/login");
    }
};

router.use(authCustomer);

router.get("/", (req, res) => {
    res.redirect("/customer/dashboard");
});

// Dashboard & Search Form
router.get("/dashboard", async (req, res) => {
    const [origins] = await pool.query(
        "SELECT DISTINCT origin_city FROM routes",
    );
    const [destinations] = await pool.query(
        "SELECT DISTINCT destination_city FROM routes",
    );

    const [schedules] = await pool.query(`
        SELECT s.*, v.plate_number, v.vehicle_type, v.capacity, r.origin_city, r.destination_city
        FROM schedules s
        JOIN routes r ON s.route_id = r.route_id
        JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        WHERE s.status = 'available' AND s.departure_time > NOW()
        ORDER BY s.departure_time ASC
    `);

    res.render("customer/dashboard-customer", {
        title: "Dashboard Customer",
        user: req.session.user,
        origins,
        destinations,
        schedules,
    });
});

// Search Results
router.get("/search", async (req, res) => {
    const { origin, destination, date } = req.query;

    if (date) {
        const searchDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (searchDate < today) {
            return res.render("customer/search-results", {
                title: "Hasil Pencarian",
                user: req.session.user,
                schedules: [],
                origin,
                destination,
                date,
                error: "Tidak dapat mencari jadwal untuk tanggal yang sudah lewat.",
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
    res.render("customer/search-results", {
        title: "Hasil Pencarian",
        user: req.session.user,
        schedules,
        origin,
        destination,
        date,
    });
});

// Booking Form
router.get("/booking/:scheduleId", async (req, res) => {
    const scheduleId = req.params.scheduleId;
    const [schedules] = await pool.query(
        `
        SELECT s.*, v.plate_number, v.vehicle_type, v.capacity, r.origin_city, r.destination_city
        FROM schedules s
        JOIN routes r ON s.route_id = r.route_id
        JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        WHERE s.schedule_id = ?
    `,
        [scheduleId],
    );

    if (schedules.length === 0) return res.redirect("/customer/dashboard");
    const schedule = schedules[0];

    const bookedSeats = await seatAvailability.getSeatStatuses(
        pool,
        scheduleId,
    );

    res.render("customer/booking-form", {
        title: "Form Pemesanan",
        user: req.session.user,
        schedule,
        bookedSeats,
    });
});

// Seat availability polling endpoint (AJAX)
router.get("/api/seats/:scheduleId", async (req, res) => {
    try {
        const scheduleId = req.params.scheduleId;

        const [schedules] = await pool.query(
            "SELECT v.capacity FROM schedules s JOIN vehicles v ON s.vehicle_id = v.vehicle_id WHERE s.schedule_id = ?",
            [scheduleId],
        );
        if (schedules.length === 0)
            return res.json({ error: "Jadwal tidak ditemukan" });

        const bookedSeats = await seatAvailability.getSeatStatuses(
            pool,
            scheduleId,
        );

        res.json({ bookedSeats, capacity: schedules[0].capacity });
    } catch (err) {
        console.error("Seat polling error:", err);
        res.status(500).json({ error: "Terjadi kesalahan server" });
    }
});

// Process Booking
router.post("/booking/:scheduleId", async (req, res) => {
    try {
        const scheduleId = req.params.scheduleId;
        const seat_numbers = Array.isArray(req.body.seat_numbers) ? req.body.seat_numbers : (req.body.seat_numbers ? [req.body.seat_numbers] : []);
        const userId = req.session.user.id;

        if (seat_numbers.length === 0) {
            return res.send(
                `<script>alert('Pilihlah minimal satu kursi!'); window.history.back();</script>`,
            );
        }

        // Validate passenger details for each selected seat
        const passengersData = [];
        for (const s of seat_numbers) {
            const name = req.body[`passenger_name_${s}`];
            const identity = req.body[`passenger_identity_${s}`];
            const phone = req.body[`passenger_phone_${s}`];
            if (!name || !identity || !phone) {
                return res.send(
                    `<script>alert('Lengkapi semua data penumpang untuk kursi ${s}!'); window.history.back();</script>`,
                );
            }
            passengersData.push({ seat_number: s, name, identity, phone });
        }

        const [schedules] = await pool.query(
            "SELECT price, vehicle_id FROM schedules WHERE schedule_id=?",
            [scheduleId],
        );
        if (schedules.length === 0) {
            return res.send(
                "<script>alert('Gagal membuat pesanan: Jadwal tidak ditemukan!'); window.location.href='/customer/dashboard';</script>",
            );
        }
        const schedule = schedules[0];

        // Find or create seat IDs
        for (const p of passengersData) {
            let seat_id = null;
            const [seats] = await pool.query(
                "SELECT seat_id FROM seats WHERE vehicle_id=? AND seat_number=?",
                [schedule.vehicle_id, p.seat_number],
            );
            if (seats.length > 0) {
                seat_id = seats[0].seat_id;
            } else {
                const [sRes] = await pool.query(
                    "INSERT INTO seats (vehicle_id, seat_number) VALUES (?, ?)",
                    [schedule.vehicle_id, p.seat_number],
                );
                seat_id = sRes.insertId;
            }
            p.seat_id = seat_id;
        }

        const bookingCode = await bookingCodeService.generateCode();
        const totalAmount = Number(schedule.price) * passengersData.length;
        const legacyPassengerName = passengersData[0].name;

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Check availability for all seats
            for (const p of passengersData) {
                await seatAvailability.assertSeatAvailable(
                    conn,
                    scheduleId,
                    p.seat_id,
                );
            }

            // Insert into bookings
            const [result] = await conn.query(
                `
                INSERT INTO bookings (user_id, schedule_id, booking_code, booking_channel, total_amount, passenger_name, status, hold_expired_at, created_at)
                VALUES (?, ?, ?, 'online', ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW())
            `,
                [
                    userId,
                    scheduleId,
                    bookingCode,
                    totalAmount,
                    legacyPassengerName,
                ],
            );

            const bookingId = result.insertId;

            // Insert into booking_seats and passengers table
            for (const p of passengersData) {
                await conn.query(
                    "INSERT INTO booking_seats (booking_id, seat_id, price_at_booking) VALUES (?, ?, ?)",
                    [bookingId, p.seat_id, schedule.price],
                );

                await conn.query(
                    "INSERT INTO passengers (booking_id, full_name, identity_number, phone) VALUES (?, ?, ?, ?)",
                    [bookingId, p.name, p.identity, p.phone],
                );
            }

            await conn.commit();

            // Wire notification using the NotificationService
            const io = req.app.get("io");
            await NotificationService.createNotification({
                type: "booking_created",
                userId,
                bookingId,
                message: `Pemesanan online baru dibuat dengan kode ${bookingCode}`,
                payload: { bookingCode, totalAmount },
                io
            });

            res.redirect(`/customer/payment/${bookingId}`);
        } catch (err) {
            await conn.rollback();
            if (err.message === "SEAT_TAKEN") {
                return res.send(
                    "Maaf, salah satu kursi yang Anda pilih sudah dipesan orang lain. Silakan kembali dan pilih kursi lain.",
                );
            }
            console.error("Online booking transaction error:", err);
            res.send(
                "Terjadi kesalahan database saat membuat pesanan. Silakan coba lagi.",
            );
        } finally {
            conn.release();
        }
    } catch (e) {
        console.error("Online booking error:", e);
        res.send(
            "Terjadi kesalahan server saat membuat pesanan. Silakan coba lagi.",
        );
    }
});

// Payment Page
router.get("/payment/:bookingId", async (req, res) => {
    const bookingId = req.params.bookingId;
    const [bookings] = await pool.query(
        `
        SELECT b.*, s.departure_time, r.origin_city, r.destination_city,
          (SELECT GROUP_CONCAT(st.seat_number) FROM booking_seats bs2 JOIN seats st ON bs2.seat_id = st.seat_id WHERE bs2.booking_id = b.booking_id) AS seat_numbers
        FROM bookings b
        JOIN schedules s ON b.schedule_id = s.schedule_id
        JOIN routes r ON s.route_id = r.route_id
        WHERE b.booking_id = ? AND b.user_id = ?
    `,
        [bookingId, req.session.user.id],
    );

    if (bookings.length === 0) return res.redirect("/customer/my-bookings");
    const booking = bookings[0];

    const isExpired =
        booking.status === "pending" &&
        new Date() > new Date(booking.hold_expired_at);
    if (isExpired) {
        await pool.query(
            'UPDATE bookings SET status="expired" WHERE booking_id=?',
            [bookingId],
        );
        booking.status = "expired";
    }

    res.render("customer/payment", {
        title: "Pembayaran",
        user: req.session.user,
        booking,
    });
});

// Confirm Payment
router.post("/pay/:bookingId", async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const userId = req.session.user.id;
        const { payment_method, account_number, pin } = req.body;

        const [bookings] = await pool.query(
            "SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?",
            [bookingId, userId],
        );

        if (bookings.length === 0) return res.redirect("/customer/my-bookings");
        const booking = bookings[0];

        if (booking.status === "confirmed")
            return res.redirect("/customer/my-bookings");

        if (
            booking.status === "expired" ||
            (booking.status === "pending" &&
                new Date() > new Date(booking.hold_expired_at))
        ) {
            if (booking.status === "pending") {
                await pool.query(
                    'UPDATE bookings SET status="expired" WHERE booking_id=?',
                    [bookingId],
                );
            }
            return res.send(
                "<script>alert('Waktu pembayaran telah habis. Pesanan otomatis dibatalkan.'); window.location.href='/customer/my-bookings';</script>",
            );
        }

        if (booking.status === "cancelled") {
            return res.send(
                "<script>alert('Pesanan ini telah dibatalkan.'); window.location.href='/customer/my-bookings';</script>",
            );
        }

        const gatewayResult = paymentService.simulateGatewayCharge(
            payment_method,
            account_number,
            pin,
        );
        if (!gatewayResult.success) {
            const [refetch] = await pool.query(
                `
                SELECT b.*, s.departure_time, r.origin_city, r.destination_city,
                  (SELECT GROUP_CONCAT(st.seat_number) FROM booking_seats bs2 JOIN seats st ON bs2.seat_id = st.seat_id WHERE bs2.booking_id = b.booking_id) AS seat_numbers
                FROM bookings b
                JOIN schedules s ON b.schedule_id = s.schedule_id
                JOIN routes r ON s.route_id = r.route_id
                WHERE b.booking_id = ?
            `,
                [bookingId],
            );
            return res.render("customer/payment", {
                title: "Pembayaran",
                user: req.session.user,
                booking: refetch[0],
                error: gatewayResult.error,
            });
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const paymentId = await paymentService.createPendingPayment(
                conn,
                bookingId,
                booking.total_amount,
                payment_method,
            );
            await paymentService.confirmPayment(
                conn,
                paymentId,
                gatewayResult.transactionId,
            );
            await conn.query(
                'UPDATE bookings SET status = "confirmed" WHERE booking_id = ? AND status = "pending"',
                [bookingId],
            );
            await ticketService.issueTicket(
                conn,
                bookingId,
                booking.booking_code,
            );

            await conn.commit();

            // Wire notification using the NotificationService
            const io = req.app.get("io");
            await NotificationService.createNotification({
                type: "payment_confirmed",
                userId,
                bookingId,
                message: `Pembayaran lunas untuk booking ${booking.booking_code}. E-Ticket telah diterbitkan.`,
                payload: { bookingCode: booking.booking_code, transactionId: gatewayResult.transactionId },
                io
            });

            res.redirect("/customer/my-bookings");
        } catch (err) {
            await conn.rollback();
            console.error("Payment transaction error:", err);
            res.send(
                "<script>alert('Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.'); window.history.back();</script>",
            );
        } finally {
            conn.release();
        }
    } catch (e) {
        console.error("Payment error:", e);
        res.send(
            "<script>alert('Terjadi kesalahan server.'); window.location.href='/customer/my-bookings';</script>",
        );
    }
});

// Customer E-Ticket
router.get("/eticket/:bookingId", async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const [bookings] = await pool.query(
            `
            SELECT b.*, s.departure_time, s.arrival_estimate, s.pickup_point, s.dropoff_point,
              r.origin_city, r.destination_city, v.plate_number, v.vehicle_type,
              (SELECT GROUP_CONCAT(st.seat_number) FROM booking_seats bs2 JOIN seats st ON bs2.seat_id = st.seat_id WHERE bs2.booking_id = b.booking_id) AS seat_numbers
            FROM bookings b
            JOIN schedules s ON b.schedule_id = s.schedule_id
            JOIN routes r ON s.route_id = r.route_id
            LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
            WHERE b.booking_id = ? AND b.user_id = ?
        `,
            [bookingId, req.session.user.id],
        );

        if (bookings.length === 0) return res.redirect("/customer/my-bookings");
        const booking = bookings[0];

        if (booking.status !== "confirmed") {
            return res.redirect("/customer/my-bookings");
        }

        let ticket = await ticketService.getTicketByBookingId(pool, bookingId);
        if (!ticket) {
            ticket = await ticketService.issueTicket(
                pool,
                bookingId,
                booking.booking_code,
            );
        }

        const [passengers] = await pool.query(
            "SELECT * FROM passengers WHERE booking_id = ?",
            [bookingId]
        );

        res.render("customer/eticket", {
            title: "E-Ticket",
            user: req.session.user,
            booking,
            ticket,
            passengers,
        });
    } catch (e) {
        console.error("E-Ticket error:", e);
        res.redirect("/customer/my-bookings");
    }
});

// Booking Detail
router.get("/booking-detail/:bookingId", async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const [bookings] = await pool.query(
            `
            SELECT b.*, s.departure_time, s.arrival_estimate, s.pickup_point, s.dropoff_point, s.price AS schedule_price,
              r.origin_city, r.destination_city, v.plate_number, v.vehicle_type,
              (SELECT GROUP_CONCAT(st.seat_number) FROM booking_seats bs2 JOIN seats st ON bs2.seat_id = st.seat_id WHERE bs2.booking_id = b.booking_id) AS seat_numbers
            FROM bookings b
            JOIN schedules s ON b.schedule_id = s.schedule_id
            JOIN routes r ON s.route_id = r.route_id
            LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
            WHERE b.booking_id = ? AND b.user_id = ?
        `,
            [bookingId, req.session.user.id],
        );

        if (bookings.length === 0) return res.redirect("/customer/my-bookings");
        const booking = bookings[0];

        const isExpired =
            booking.status === "pending" &&
            new Date() > new Date(booking.hold_expired_at);
        if (isExpired) {
            await pool.query(
                'UPDATE bookings SET status="expired" WHERE booking_id=?',
                [bookingId],
            );
            booking.status = "expired";
        }

        const payment = await paymentService.getPaymentByBookingId(
            pool,
            bookingId,
        );
        const ticket = await ticketService.getTicketByBookingId(
            pool,
            bookingId,
        );

        // Get cancellation request if exists
        const cancelRequest =
            await requestService.getCancellationRequestsByBookingId(
                pool,
                bookingId,
            );
        const latestCancelRequest =
            cancelRequest && cancelRequest.length > 0 ? cancelRequest[0] : null;

        const [passengers] = await pool.query(
            "SELECT * FROM passengers WHERE booking_id = ?",
            [bookingId]
        );

        res.render("customer/booking-detail", {
            title: "Detail Pesanan",
            user: req.session.user,
            booking,
            payment,
            ticket,
            cancelRequest: latestCancelRequest,
            passengers,
        });
    } catch (e) {
        console.error("Booking detail error:", e);
        res.redirect("/customer/my-bookings");
    }
});

// My Bookings
router.get("/my-bookings", async (req, res) => {
    const [bookings] = await pool.query(
        `
        SELECT b.*, s.departure_time, r.origin_city, r.destination_city,
          (SELECT GROUP_CONCAT(st.seat_number) FROM booking_seats bs2 JOIN seats st ON bs2.seat_id = st.seat_id WHERE bs2.booking_id = b.booking_id) AS seat_numbers
        FROM bookings b
        JOIN schedules s ON b.schedule_id = s.schedule_id
        JOIN routes r ON s.route_id = r.route_id
        WHERE b.user_id = ? AND b.hidden_at IS NULL
        ORDER BY b.created_at DESC
    `,
        [req.session.user.id],
    );

    res.render("customer/my-bookings", {
        title: "Pesanan Saya",
        user: req.session.user,
        bookings,
    });
});

// Cancel Booking (for pending bookings only - direct cancellation)
router.post("/booking/:bookingId/cancel", async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [bookings] = await conn.query(
            "SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?",
            [req.params.bookingId, req.session.user.id],
        );
        if (bookings.length === 0) {
            await conn.rollback();
            return res.redirect("/customer/my-bookings");
        }
        const booking = bookings[0];
        // Only allow direct cancel for pending bookings
        if (booking.status === "pending") {
            await conn.query(
                "UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?",
                [req.params.bookingId],
            );
        }
        await conn.commit();

        // Wire notification using the NotificationService
        const io = req.app.get("io");
        await NotificationService.createNotification({
            type: "cancelled",
            userId: req.session.user.id,
            bookingId: req.params.bookingId,
            message: `Pesanan pending dengan kode ${booking.booking_code} telah dibatalkan oleh pengguna.`,
            payload: { bookingCode: booking.booking_code },
            io
        });

        res.redirect("/customer/my-bookings");
    } catch (e) {
        await conn.rollback();
        console.error("Cancel error:", e);
        res.send(
            "<script>alert('Gagal membatalkan pesanan.'); window.location.href='/customer/my-bookings';</script>",
        );
    } finally {
        conn.release();
    }
});

// Create cancellation request (for confirmed bookings - requires admin approval)
router.post("/booking/:bookingId/cancel-request", async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [bookings] = await conn.query(
            "SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?",
            [req.params.bookingId, req.session.user.id],
        );
        if (bookings.length === 0) {
            await conn.rollback();
            return res.redirect("/customer/my-bookings");
        }
        const booking = bookings[0];
        // Only confirmed bookings can create cancellation requests
        if (booking.status !== "confirmed") {
            await conn.rollback();
            return res.send(
                "<script>alert('Hanya pesanan yang sudah dikonfirmasi yang dapat diajukan untuk pembatalan.'); window.location.href='/customer/my-bookings';</script>",
            );
        }
        // Check for existing pending request
        const existing =
            await requestService.getCancellationRequestsByBookingId(
                conn,
                req.params.bookingId,
            );
        if (existing && existing.some((r) => r.status === "pending")) {
            await conn.rollback();
            return res.send(
                "<script>alert('Permintaan pembatalan sudah ada dan sedang diproses.'); window.location.href='/customer/booking-detail/" +
                    req.params.bookingId +
                    "';</script>",
            );
        }
        await requestService.createCancellationRequest(
            conn,
            req.params.bookingId,
            req.session.user.id,
            req.body.reason || null,
        );
        await conn.commit();

        // Wire notification using the NotificationService
        const io = req.app.get("io");
        await NotificationService.createNotification({
            type: "cancelled",
            userId: req.session.user.id,
            bookingId: req.params.bookingId,
            message: `Permintaan pembatalan baru diajukan untuk kode booking ${booking.booking_code}`,
            payload: { bookingCode: booking.booking_code, reason: req.body.reason },
            io
        });

        res.redirect("/customer/booking-detail/" + req.params.bookingId);
    } catch (e) {
        await conn.rollback();
        console.error("Cancel request error:", e);
        res.send(
            "<script>alert('Gagal mengajukan permintaan pembatalan.'); window.location.href='/customer/my-bookings';</script>",
        );
    } finally {
        conn.release();
    }
});

// Delete Booking History (soft delete - hide instead of remove)
router.post("/booking/:bookingId/delete", async (req, res) => {
    await pool.query(
        "UPDATE bookings SET hidden_at = NOW() WHERE booking_id = ? AND user_id = ? AND status IN ('cancelled','expired')",
        [req.params.bookingId, req.session.user.id],
    );
    res.redirect("/customer/my-bookings");
});

// Reschedule Request Form - Show available schedules for rescheduling
router.get("/booking/:bookingId/reschedule", async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        // Get current booking info
        const [bookings] = await pool.query(
            `
            SELECT b.*, s.schedule_id, s.departure_time, r.origin_city, r.destination_city
            FROM bookings b
            JOIN schedules s ON b.schedule_id = s.schedule_id
            JOIN routes r ON s.route_id = r.route_id
            WHERE b.booking_id = ? AND b.user_id = ?
        `,
            [bookingId, req.session.user.id],
        );

        if (bookings.length === 0) return res.redirect("/customer/my-bookings");
        const booking = bookings[0];

        // Only confirmed bookings can be rescheduled
        if (booking.status !== "confirmed") {
            return res.send(
                "<script>alert('Hanya pesanan yang dikonfirmasi yang dapat di-reschedule.'); window.location.href='/customer/my-bookings';</script>",
            );
        }

        // Check for existing pending reschedule request
        const existing = await requestService.getRescheduleRequestsByBookingId(
            pool,
            bookingId,
        );
        if (existing && existing.some((r) => r.status === "pending")) {
            return res.send(
                "<script>alert('Permintaan reschedule sudah ada dan sedang diproses.'); window.location.href='/customer/booking-detail/" +
                    bookingId +
                    "';</script>",
            );
        }

        // Get available schedules for same route
        const [schedules] = await pool.query(
            `
            SELECT s.*, v.plate_number, v.vehicle_type, v.capacity
            FROM schedules s
            JOIN routes r ON s.route_id = r.route_id
            JOIN vehicles v ON s.vehicle_id = v.vehicle_id
            WHERE r.origin_city = ? AND r.destination_city = ? AND s.departure_time > NOW()
            ORDER BY s.departure_time ASC
        `,
            [booking.origin_city, booking.destination_city],
        );

        // Get available seats for each schedule
        for (let sched of schedules) {
            sched.bookedSeats = await seatAvailability.getSeatStatuses(
                pool,
                sched.schedule_id,
            );
        }

        res.render("customer/reschedule-form", {
            title: "Ajukan Reschedule",
            booking,
            schedules,
            user: req.session.user,
        });
    } catch (e) {
        console.error("Reschedule form error:", e);
        res.send(
            "<script>alert('Gagal memuat form reschedule.'); window.location.href='/customer/my-bookings';</script>",
        );
    }
});

// Submit reschedule request
router.post("/booking/:bookingId/reschedule-request", async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const { target_schedule_id, target_seat_number, reason } = req.body;

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Verify booking ownership and status
            const [bookings] = await conn.query(
                "SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?",
                [bookingId, req.session.user.id],
            );

            if (bookings.length === 0) {
                await conn.rollback();
                return res.redirect("/customer/my-bookings");
            }
            const booking = bookings[0];

            if (booking.status !== "confirmed") {
                await conn.rollback();
                return res.send(
                    "<script>alert('Hanya pesanan yang dikonfirmasi yang dapat di-reschedule.'); window.location.href='/customer/my-bookings';</script>",
                );
            }

            // Check for existing pending request
            const existing =
                await requestService.getRescheduleRequestsByBookingId(
                    conn,
                    bookingId,
                );
            if (existing && existing.some((r) => r.status === "pending")) {
                await conn.rollback();
                return res.send(
                    "<script>alert('Permintaan reschedule sudah ada dan sedang diproses.'); window.location.href='/customer/booking-detail/" +
                        bookingId +
                        "';</script>",
                );
            }

            // Create reschedule request
            await requestService.createRescheduleRequest(
                conn,
                bookingId,
                req.session.user.id,
                target_schedule_id,
                target_seat_number,
                reason || null,
            );

            await conn.commit();

            // Wire notification using the NotificationService
            const io = req.app.get("io");
            await NotificationService.createNotification({
                type: "rescheduled",
                userId: req.session.user.id,
                bookingId,
                message: `Permintaan reschedule baru diajukan untuk kode booking ${booking.booking_code} ke jadwal ID ${target_schedule_id}`,
                payload: { bookingCode: booking.booking_code, targetScheduleId: target_schedule_id, targetSeatNumber: target_seat_number, reason },
                io
            });

            res.redirect("/customer/booking-detail/" + bookingId);
        } catch (e) {
            await conn.rollback();
            console.error("Reschedule request error:", e);
            res.send(
                "<script>alert('Gagal mengajukan reschedule.'); window.location.href='/customer/my-bookings';</script>",
            );
        } finally {
            conn.release();
        }
    } catch (e) {
        console.error("Reschedule request error:", e);
        res.send(
            "<script>alert('Gagal mengajukan reschedule.'); window.location.href='/customer/my-bookings';</script>",
        );
    }
});

module.exports = router;
