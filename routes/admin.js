const express = require("express");
const router = express.Router();
const authAdmin = require("../middleware/authAdmin");
const pool = require("../config/pool");
const bookingCodeService = require("../services/bookingCodeService");
const seatAvailability = require("../services/seatAvailability");
const ticketService = require("../services/ticketService");
const requestService = require("../services/requestService");
const Validation = require("../utils/validation");
const NotificationService = require("../services/notificationService");

/* Dashboard */
router.get("/dashboard", authAdmin, async (req, res) => {
    try {
        const [[bookingCount]] = await pool.query(
            "SELECT COUNT(*) AS total FROM bookings",
        );
        const [[confirmedCount]] = await pool.query(
            "SELECT COUNT(*) AS total FROM bookings WHERE status='confirmed'",
        );
        const [[revenueResult]] = await pool.query(
            "SELECT IFNULL(SUM(total_amount),0) AS total FROM bookings WHERE status='confirmed'",
        );
        const [[scheduleCount]] = await pool.query(
            "SELECT COUNT(*) AS total FROM schedules",
        );
        const [[vehicleCount]] = await pool.query(
            "SELECT COUNT(*) AS total FROM vehicles",
        );
        res.render("admin/dashboard", {
            title: "Dashboard Admin",
            user: req.session.user,
            stats: {
                totalBookings: bookingCount.total,
                confirmed: confirmedCount.total,
                revenue: revenueResult.total,
                schedules: scheduleCount.total,
                vehicles: vehicleCount.total,
            },
        });
    } catch (err) {
        console.error(err);
        res.render("admin/dashboard", {
            title: "Dashboard Admin",
            user: req.session.user,
            stats: {
                totalBookings: 0,
                confirmed: 0,
                revenue: 0,
                schedules: 0,
                vehicles: 0,
            },
        });
    }
});

/* Schedules */
router.get("/schedules", authAdmin, async (req, res) => {
    const [schedules] = await pool.query(`
        SELECT s.*, v.plate_number AS vehicle_name, r.origin_city AS origin, r.destination_city AS destination
        FROM schedules s
        LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        LEFT JOIN routes r ON s.route_id = r.route_id
        ORDER BY s.departure_time DESC
    `);
    const [vehicles] = await pool.query("SELECT * FROM vehicles");
    res.render("admin/schedules", {
        title: "Manajemen Jadwal",
        schedules,
        vehicles,
        user: req.session.user,
    });
});
router.post("/schedules", authAdmin, async (req, res) => {
    const {
        origin,
        destination,
        departure,
        arrival,
        vehicle_id,
        price,
        pickup_point,
        dropoff_point,
    } = req.body;
    // Find or create route
    let route_id = null;
    const [routes] = await pool.query(
        "SELECT route_id FROM routes WHERE origin_city=? AND destination_city=?",
        [origin, destination],
    );
    if (routes.length > 0) {
        route_id = routes[0].route_id;
    } else {
        const [result] = await pool.query(
            "INSERT INTO routes (origin_city, destination_city) VALUES (?, ?)",
            [origin, destination],
        );
        route_id = result.insertId;
    }

    await pool.query(
        "INSERT INTO schedules (route_id,vehicle_id,departure_time,arrival_estimate,price,pickup_point,dropoff_point,status) VALUES (?,?,?,?,?,?,?,?)",
        [
            route_id,
            vehicle_id || null,
            departure,
            arrival,
            price,
            pickup_point || null,
            dropoff_point || null,
            "available",
        ],
    );
    res.redirect("/admin/schedules");
});
router.post("/schedules/delete/:id", authAdmin, async (req, res) => {
    try {
        await pool.query("DELETE FROM schedules WHERE schedule_id=?", [
            req.params.id,
        ]);
        res.redirect("/admin/schedules");
    } catch (e) {
        console.error("Delete schedule error:", e);
        res.send(
            "<script>alert('Gagal menghapus jadwal! Jadwal ini sudah memiliki pesanan yang terhubung.'); window.location.href='/admin/schedules';</script>",
        );
    }
});

/* Vehicles */
router.get("/vehicles", authAdmin, async (req, res) => {
    const [vehicles] = await pool.query(
        "SELECT * FROM vehicles ORDER BY vehicle_id DESC",
    );
    res.render("admin/vehicles", {
        title: "Manajemen Kendaraan",
        vehicles,
        user: req.session.user,
    });
});
router.post("/vehicles", authAdmin, async (req, res) => {
    const { name, type, capacity, image_url } = req.body;
    await pool.query(
        "INSERT INTO vehicles (plate_number,vehicle_type,capacity,status) VALUES (?,?,?,?)",
        [name, type, capacity, "active"],
    );
    res.redirect("/admin/vehicles");
});
router.post("/vehicles/delete/:id", authAdmin, async (req, res) => {
    try {
        await pool.query("DELETE FROM vehicles WHERE vehicle_id=?", [
            req.params.id,
        ]);
        res.redirect("/admin/vehicles");
    } catch (e) {
        console.error("Delete vehicle error:", e);
        res.send(
            "<script>alert('Gagal menghapus kendaraan! Kendaraan ini memiliki kursi atau jadwal yang terhubung.'); window.location.href='/admin/vehicles';</script>",
        );
    }
});

/* Bookings */
router.get("/bookings", authAdmin, async (req, res) => {
    const [bookings] = await pool.query(`
        SELECT b.booking_id as id, u.email, r.origin_city AS origin, r.destination_city AS destination, b.status, b.created_at, b.passenger_name,
        (SELECT GROUP_CONCAT(st.seat_number) FROM booking_seats bs JOIN seats st ON bs.seat_id = st.seat_id WHERE bs.booking_id = b.booking_id) as seat_number
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        JOIN schedules s ON b.schedule_id = s.schedule_id
        JOIN routes r ON s.route_id = r.route_id
        WHERE b.hidden_at IS NULL
        ORDER BY b.created_at DESC
    `);
    res.render("admin/bookings", {
        title: "Manajemen Pemesanan",
        bookings,
        user: req.session.user,
    });
});
router.post("/bookings/status/:id", authAdmin, async (req, res) => {
    const { status } = req.body;
    // Map status if needed, but enum is pending, confirmed, cancelled, expired
    let dbStatus = status;
    if (status === "canceled") dbStatus = "cancelled";
    if (status === "refunded") dbStatus = "cancelled"; // simplificiation
    await pool.query("UPDATE bookings SET status=? WHERE booking_id=?", [
        dbStatus,
        req.params.id,
    ]);
    const io = req.app.get("io");
    if (io) io.emit("bookingUpdate", { id: req.params.id, status: dbStatus });
    res.redirect("/admin/bookings");
});

/* Offline Booking */
router.get("/bookings/new", authAdmin, async (req, res) => {
    const [schedules] = await pool.query(`
        SELECT s.*, r.origin_city AS origin, r.destination_city AS destination
        FROM schedules s JOIN routes r ON s.route_id = r.route_id
        WHERE s.departure_time > NOW() ORDER BY s.departure_time ASC
    `);
    res.render("admin/booking-new", {
        title: "Tambah Pemesanan Offline",
        schedules,
        user: req.session.user,
    });
});

// CODE-CITE:
//   Title: Offline Multi-Passenger Booking Handler
//   Type: ai
//   Value: Antigravity Gemini
//   Notes: Validates and saves multi-passenger offline bookings in a transaction, issuing e-tickets and broadcasting socket notifications.
//   Lines Range: 123
router.post("/bookings/new", authAdmin, async (req, res) => {
    try {
        const { schedule_id, seat_numbers } = req.body;
        const user_id = req.session.user ? req.session.user.id : null;

        if (!schedule_id || !seat_numbers) {
            return res.send(
                `<script>alert('Jadwal dan nomor kursi wajib diisi!'); window.history.back();</script>`,
            );
        }

        const seatsSelected = seat_numbers.split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        if (seatsSelected.length === 0) {
            return res.send(
                `<script>alert('Masukkan minimal satu nomor kursi!'); window.history.back();</script>`,
            );
        }

        // Validate passenger details for each seat
        const passengersData = [];
        for (const s of seatsSelected) {
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

        // Get price and vehicle_id
        const [schedules] = await pool.query(
            "SELECT price, vehicle_id FROM schedules WHERE schedule_id=?",
            [schedule_id],
        );
        if (schedules.length === 0) {
            return res.send(
                "<script>alert('Gagal membuat pesanan: Jadwal tidak ditemukan!'); window.history.back();</script>",
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

        // Generate unique booking code
        const booking_code = await bookingCodeService.generateCode();
        const totalAmount = Number(schedule.price) * passengersData.length;
        const legacyPassengerName = passengersData[0].name;

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Check availability for all seats
            for (const p of passengersData) {
                await seatAvailability.assertSeatAvailable(
                    conn,
                    schedule_id,
                    p.seat_id,
                );
            }

            // Create booking
            const [result] = await conn.query(
                "INSERT INTO bookings (user_id, schedule_id, booking_code, booking_channel, total_amount, passenger_name, status, created_at) VALUES (?, ?, ?, 'offline', ?, ?, 'confirmed', NOW())",
                [
                    user_id,
                    schedule_id,
                    booking_code,
                    totalAmount,
                    legacyPassengerName,
                ],
            );
            const bookingId = result.insertId;

            // Insert booking_seats and passengers
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

            // Issue ticket
            await ticketService.issueTicket(
                conn,
                bookingId,
                booking_code,
            );

            await conn.commit();

            // Wire notification using the NotificationService
            const io = req.app.get("io");
            await NotificationService.createNotification({
                type: "booking_created",
                bookingId,
                message: `Pemesanan offline baru dibuat oleh admin dengan kode ${booking_code}`,
                payload: { bookingCode: booking_code, totalAmount },
                io
            });

            res.redirect("/admin/bookings");
        } catch (err) {
            await conn.rollback();
            if (err.message === "SEAT_TAKEN") {
                return res.send(
                    "<script>alert('Gagal membuat pesanan: Salah satu kursi sudah dipesan atau sedang ditahan!'); window.history.back();</script>",
                );
            }
            console.error("Offline booking transaction error:", err);
            res.send(
                "<script>alert('Gagal membuat pesanan: Terjadi kesalahan database.'); window.history.back();</script>",
            );
        } finally {
            conn.release();
        }
    } catch (e) {
        console.error("Offline booking error:", e);
        res.send(
            "<script>alert('Gagal membuat pesanan: Terjadi kesalahan server.'); window.history.back();</script>",
        );
    }
});

/* Reschedule */
router.get("/bookings/reschedule/:id", authAdmin, async (req, res) => {
    const [bookings] = await pool.query(
        `
        SELECT b.booking_id as id, b.*, r.origin_city AS origin, r.destination_city AS destination
        FROM bookings b JOIN schedules s ON b.schedule_id = s.schedule_id JOIN routes r ON s.route_id = r.route_id
        WHERE b.booking_id = ?
    `,
        [req.params.id],
    );
    if (!bookings.length) return res.redirect("/admin/bookings");

    const booking = bookings[0];
    const [schedules] = await pool.query(
        `
        SELECT s.*, r.origin_city AS origin, r.destination_city AS destination
        FROM schedules s JOIN routes r ON s.route_id = r.route_id
        WHERE r.origin_city = ? AND r.destination_city = ? AND s.departure_time > NOW()
        ORDER BY s.departure_time ASC
    `,
        [booking.origin, booking.destination],
    );

    res.render("admin/booking-reschedule", {
        title: "Reschedule Pesanan",
        booking,
        schedules,
        user: req.session.user,
    });
});

router.post("/bookings/reschedule/:id", authAdmin, async (req, res) => {
    try {
        const { schedule_id, seat_number } = req.body;

        // Validate required fields
        const reqErr = Validation.validateRequired(
            ["schedule_id", "seat_number"],
            req.body,
        );
        if (reqErr) {
            return res.send(
                `<script>alert('${reqErr}'); window.history.back();</script>`,
            );
        }

        // Fetch schedule details
        const [schedules] = await pool.query(
            "SELECT price, vehicle_id FROM schedules WHERE schedule_id=?",
            [schedule_id],
        );
        if (schedules.length === 0) {
            return res.send(
                "<script>alert('Gagal reschedule: Jadwal tidak ditemukan!'); window.history.back();</script>",
            );
        }
        const schedule = schedules[0];

        // Find or create seat
        let seat_id = null;
        const [seats] = await pool.query(
            "SELECT seat_id FROM seats WHERE vehicle_id=? AND seat_number=?",
            [schedule.vehicle_id, seat_number],
        );
        if (seats.length > 0) {
            seat_id = seats[0].seat_id;
        } else {
            const [sRes] = await pool.query(
                "INSERT INTO seats (vehicle_id, seat_number) VALUES (?, ?)",
                [schedule.vehicle_id, seat_number],
            );
            seat_id = sRes.insertId;
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            await seatAvailability.assertSeatAvailable(
                conn,
                schedule_id,
                seat_id,
                req.params.id,
            );

            await conn.query(
                "UPDATE bookings SET schedule_id=?, total_amount=? WHERE booking_id=?",
                [schedule_id, schedule.price, req.params.id],
            );

            await conn.query("DELETE FROM booking_seats WHERE booking_id=?", [
                req.params.id,
            ]);
            await conn.query(
                "INSERT INTO booking_seats (booking_id, seat_id, price_at_booking) VALUES (?, ?, ?)",
                [req.params.id, seat_id, schedule.price],
            );

            await conn.commit();
            res.redirect("/admin/bookings");
        } catch (err) {
            await conn.rollback();
            if (err.message === "SEAT_TAKEN") {
                return res.send(
                    "<script>alert('Gagal reschedule: Kursi ini sudah dipesan oleh orang lain!'); window.history.back();</script>",
                );
            }
            console.error("Reschedule transaction error:", err);
            res.send(
                "<script>alert('Gagal reschedule: Terjadi kesalahan database.'); window.history.back();</script>",
            );
        } finally {
            conn.release();
        }
    } catch (e) {
        console.error("Reschedule error:", e);
        res.send(
            "<script>alert('Gagal reschedule: Terjadi kesalahan internal.'); window.history.back();</script>",
        );
    }
});

/* Notifications */
// CODE-CITE:
//   Title: Admin Notifications Dashboard & Broadcaster
//   Type: ai
//   Value: Antigravity Gemini
//   Notes: Endpoint to retrieve all notifications and broadcast new manual notifications to connected clients.
//   Lines Range: 31
router.get("/notifications", authAdmin, async (req, res) => {
    try {
        const [notifications] = await pool.query(
            "SELECT * FROM notifications ORDER BY created_at DESC",
        );
        res.render("admin/notifications", {
            title: "Notifikasi",
            notifications,
            user: req.session.user,
        });
    } catch (e) {
        console.error("Fetch notifications error:", e);
        res.render("admin/notifications", {
            title: "Notifikasi",
            notifications: [],
            user: req.session.user,
        });
    }
});
router.post("/notifications", authAdmin, async (req, res) => {
    try {
        const { message } = req.body;
        await pool.query("INSERT INTO notifications (message) VALUES (?)", [
            message,
        ]);
        const io = req.app.get("io");
        if (io) io.emit("adminNotification", { message });
    } catch (e) {
        console.error("Add notification error:", e);
    }
    res.redirect("/admin/notifications");
});

/* E-Ticket QR */
router.get("/eticket/:bookingId", authAdmin, async (req, res) => {
    const [rows] = await pool.query(
        `
        SELECT b.booking_id as id, b.*, r.origin_city AS origin, r.destination_city AS destination, s.departure_time as departure, u.email,
        (SELECT GROUP_CONCAT(st.seat_number) FROM booking_seats bs JOIN seats st ON bs.seat_id = st.seat_id WHERE bs.booking_id = b.booking_id) as seat_number
        FROM bookings b
        JOIN schedules s ON b.schedule_id = s.schedule_id
        JOIN routes r ON s.route_id = r.route_id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.booking_id=?
    `,
        [req.params.bookingId],
    );
    if (!rows.length) return res.status(404).send("Booking not found");
    const booking = rows[0];

    let ticket = await ticketService.getTicketByBookingId(
        pool,
        booking.booking_id,
    );
    if (!ticket && booking.status === "confirmed") {
        ticket = await ticketService.issueTicket(
            pool,
            booking.booking_id,
            booking.booking_code,
        );
    }

    const [passengers] = await pool.query(
        "SELECT * FROM passengers WHERE booking_id = ?",
        [req.params.bookingId]
    );

    res.render("admin/eticket", {
        title: "E-Ticket",
        ticket,
        booking,
        user: req.session.user,
        passengers,
    });
});

/* Cancellation Requests */
router.get("/cancellation-requests", authAdmin, async (req, res) => {
    const requests = await requestService.getAllCancellationRequests(pool);
    res.render("admin/cancellation-requests", {
        title: "Permintaan Pembatalan",
        requests,
        user: req.session.user,
    });
});

router.get("/cancellation-requests/:id", authAdmin, async (req, res) => {
    const request = await requestService.getCancellationRequestById(
        pool,
        req.params.id,
    );
    if (!request) return res.redirect("/admin/cancellation-requests");
    res.render("admin/cancellation-request-detail", {
        title: "Detail Permintaan Pembatalan",
        request,
        user: req.session.user,
    });
});

// CODE-CITE:
//   Title: Cancellation Requests Approval and Rejection Controllers
//   Type: ai
//   Value: Antigravity Gemini
//   Notes: Transactional approval/rejection endpoints for passenger cancellations, with DB state transition and real-time user notification.
//   Lines Range: 82
router.post(
    "/cancellation-requests/:id/approve",
    authAdmin,
    async (req, res) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const request = await requestService.getCancellationRequestById(conn, req.params.id);
            const success = await requestService.approveCancellationRequest(
                conn,
                req.params.id,
                req.session.user.id,
                req.body.admin_notes || null,
            );
            await conn.commit();
            if (success) {
                const io = req.app.get("io");
                if (io) io.emit("cancellationApproved", { id: req.params.id });
                
                if (request) {
                    await NotificationService.createNotification({
                        type: "cancelled",
                        userId: request.user_id,
                        bookingId: request.booking_id,
                        message: `Permintaan pembatalan untuk booking ${request.booking_code} disetujui oleh admin.`,
                        payload: { bookingCode: request.booking_code, status: "approved" },
                        io
                    });
                }

                res.redirect("/admin/cancellation-requests");
            } else {
                res.send(
                    "<script>alert('Permintaan tidak ditemukan.'); window.location.href='/admin/cancellation-requests';</script>",
                );
            }
        } catch (e) {
            await conn.rollback();
            console.error("Approve cancellation error:", e);
            res.send(
                "<script>alert('Gagal menyetujui permintaan.'); window.location.href='/admin/cancellation-requests';</script>",
            );
        } finally {
            conn.release();
        }
    },
);

router.post(
    "/cancellation-requests/:id/reject",
    authAdmin,
    async (req, res) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const request = await requestService.getCancellationRequestById(conn, req.params.id);
            const success = await requestService.rejectCancellationRequest(
                conn,
                req.params.id,
                req.session.user.id,
                req.body.admin_notes || null,
            );
            await conn.commit();

            if (success && request) {
                const io = req.app.get("io");
                await NotificationService.createNotification({
                    type: "cancelled",
                    userId: request.user_id,
                    bookingId: request.booking_id,
                    message: `Permintaan pembatalan untuk booking ${request.booking_code} ditolak oleh admin.`,
                    payload: { bookingCode: request.booking_code, status: "rejected" },
                    io
                });
            }

            res.redirect("/admin/cancellation-requests");
        } catch (e) {
            await conn.rollback();
            console.error("Reject cancellation error:", e);
            res.send(
                "<script>alert('Gagal menolak permintaan.'); window.location.href='/admin/cancellation-requests';</script>",
            );
        } finally {
            conn.release();
        }
    },
);

/* Reschedule Requests */
router.get("/reschedule-requests", authAdmin, async (req, res) => {
    const requests = await requestService.getAllRescheduleRequests(pool);
    res.render("admin/reschedule-requests", {
        title: "Permintaan Reschedule",
        requests,
        user: req.session.user,
    });
});

router.get("/reschedule-requests/:id", authAdmin, async (req, res) => {
    const request = await requestService.getRescheduleRequestById(
        pool,
        req.params.id,
    );
    if (!request) return res.redirect("/admin/reschedule-requests");
    res.render("admin/reschedule-request-detail", {
        title: "Detail Permintaan Reschedule",
        request,
        user: req.session.user,
    });
});

// CODE-CITE:
//   Title: Reschedule Requests Approval and Rejection Controllers
//   Type: ai
//   Value: Antigravity Gemini
//   Notes: Transactional endpoints to approve or reject customer rescheduling requests, releasing old seats, locking new seats, and updating DB state.
//   Lines Range: 73
router.post("/reschedule-requests/:id/approve", authAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const request = await requestService.getRescheduleRequestById(conn, req.params.id);
        const result = await requestService.approveRescheduleRequest(
            conn,
            req.params.id,
            req.session.user.id,
            req.body.admin_notes || null,
        );
        await conn.commit();
        if (!result.success) {
            return res.send(
                `<script>alert('${result.error}'); window.location.href='/admin/reschedule-requests/${req.params.id}';</script>`,
            );
        }

        if (request) {
            const io = req.app.get("io");
            await NotificationService.createNotification({
                type: "rescheduled",
                userId: request.user_id,
                bookingId: request.booking_id,
                message: `Permintaan reschedule Anda untuk booking ${request.booking_code} disetujui. Kursi Anda berubah ke ${request.target_seat_number}.`,
                payload: { bookingCode: request.booking_code, status: "approved" },
                io
            });
        }

        res.redirect("/admin/reschedule-requests");
    } catch (e) {
        await conn.rollback();
        console.error("Approve reschedule error:", e);
        res.send(
            "<script>alert('Gagal menyetujui permintaan.'); window.location.href='/admin/reschedule-requests';</script>",
        );
    } finally {
        conn.release();
    }
});

router.post("/reschedule-requests/:id/reject", authAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const request = await requestService.getRescheduleRequestById(conn, req.params.id);
        await requestService.rejectRescheduleRequest(
            conn,
            req.params.id,
            req.session.user.id,
            req.body.admin_notes || null,
        );
        await conn.commit();

        if (request) {
            const io = req.app.get("io");
            await NotificationService.createNotification({
                type: "rescheduled",
                userId: request.user_id,
                bookingId: request.booking_id,
                message: `Permintaan reschedule Anda untuk booking ${request.booking_code} ditolak oleh admin.`,
                payload: { bookingCode: request.booking_code, status: "rejected" },
                io
            });
        }

        res.redirect("/admin/reschedule-requests");
    } catch (e) {
        await conn.rollback();
        console.error("Reject reschedule error:", e);
        res.send(
            "<script>alert('Gagal menolak permintaan.'); window.location.href='/admin/reschedule-requests';</script>",
        );
    } finally {
        conn.release();
    }
});

module.exports = router;
