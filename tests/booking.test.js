/**
 * TravelGo Complete Test Suite
 *
 * Unit tests  : formatIDR, Validation, PaymentService.simulateGatewayCharge
 * Integration : bookingCode, ticketCode, seatAvailability, payment, ticket,
 *               expiration, notification, request (cancellation & reschedule)
 *
 * Run: npm test
 */

const assert = require("assert");
const pool = require("../config/pool");

// ── Services ────────────────────────────────────────────────────────────────
const bookingCodeService = require("../services/bookingCodeService");
const seatAvailability = require("../services/seatAvailability");
const paymentService = require("../services/paymentService");
const ticketService = require("../services/ticketService");
const expirationService = require("../services/expirationService");
const requestService = require("../services/requestService");
const notificationService = require("../services/notificationService");
const { formatIDR } = require("../utils/format");
const Validation = require("../utils/validation");

// ── Test Helpers ────────────────────────────────────────────────────────────
let totalTests = 0;
let passedTests = 0;
const failures = [];

function ok(value, msg) {
    totalTests++;
    try {
        assert.ok(value, msg);
        passedTests++;
        console.log(`  \u2713 ${msg}`);
    } catch (err) {
        failures.push({ msg, err });
        console.log(`  \u2717 ${msg}`);
    }
}

function equal(actual, expected, msg) {
    totalTests++;
    try {
        assert.strictEqual(actual, expected, msg);
        passedTests++;
        console.log(`  \u2713 ${msg}`);
    } catch (err) {
        failures.push({ msg, err, actual, expected });
        console.log(`  \u2717 ${msg}`);
        console.log(`      Got: ${JSON.stringify(actual)}`);
    }
}

function notEqual(actual, expected, msg) {
    totalTests++;
    try {
        assert.notStrictEqual(actual, expected, msg);
        passedTests++;
        console.log(`  \u2713 ${msg}`);
    } catch (err) {
        failures.push({ msg, err });
        console.log(`  \u2717 ${msg}`);
    }
}

function match(value, regex, msg) {
    totalTests++;
    try {
        assert.match(value, regex, msg);
        passedTests++;
        console.log(`  \u2713 ${msg}`);
    } catch (err) {
        failures.push({ msg, err });
        console.log(`  \u2717 ${msg}`);
    }
}

/**
 * Run write-operations inside a transaction that always rolls back,
 * so tests never pollute the real database.
 */
async function withRollback(fn) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await fn(conn);
    } finally {
        await conn.rollback();
        conn.release();
    }
}

// ── Main Runner ─────────────────────────────────────────────────────────────
async function runTests() {
    console.log("");
    console.log("╔════════════════════════════════════════════════╗");
    console.log("║        TravelGo Complete Test Suite            ║");
    console.log("╚════════════════════════════════════════════════╝");

    // ──────────────────────────────────────────────────────────────────────────
    // SECTION 1 — UNIT TESTS (no database required)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n─── UNIT TESTS ───────────────────────────────────\n");

    // 1.1 formatIDR ────────────────────────────────────────────────────────────
    console.log("[1.1] formatIDR() — IDR Currency Formatter\n");

    equal(formatIDR(150000), "Rp 150.000", '150000 => "Rp 150.000"');
    equal(formatIDR(5000), "Rp 5.000", '5000 => "Rp 5.000"');
    equal(formatIDR(0), "Rp 0", '0 => "Rp 0"');
    equal(formatIDR(1), "Rp 1", '1 => "Rp 1"');
    equal(formatIDR(1000000), "Rp 1.000.000", '1000000 => "Rp 1.000.000"');
    equal(
        formatIDR(999999999),
        "Rp 999.999.999",
        '999999999 => "Rp 999.999.999"',
    );
    equal(formatIDR(500), "Rp 500", '500 => "Rp 500"');
    equal(formatIDR("150000"), "Rp 150.000", 'string "150000" => "Rp 150.000"');
    equal(formatIDR(""), "Rp 0", 'empty string => "Rp 0"');
    equal(formatIDR(null), "Rp 0", 'null => "Rp 0"');
    equal(formatIDR(undefined), "Rp 0", 'undefined => "Rp 0"');
    equal(formatIDR("abc"), "Rp 0", 'non-numeric "abc" => "Rp 0"');
    equal(formatIDR(NaN), "Rp 0", 'NaN => "Rp 0"');
    equal(formatIDR(10.5), "Rp 11", '10.5 => "Rp 11" (rounded)');

    // 1.2 Validation Utilities ─────────────────────────────────────────────────
    console.log("\n[1.2] Validation Utilities\n");

    equal(
        Validation.validateRequired(["email", "password"], {
            email: "a@b.com",
            password: "123",
        }),
        null,
        "validateRequired: all fields present returns null",
    );
    ok(
        Validation.validateRequired(["email"], {}) !== null,
        "validateRequired: missing field returns error",
    );
    ok(
        Validation.validateRequired(["email"], { email: "" }) !== null,
        "validateRequired: empty field returns error",
    );
    ok(
        Validation.validateRequired(["email"], { email: "   " }) !== null,
        "validateRequired: whitespace field returns error",
    );
    ok(
        Validation.validateRequired(["a", "b"], null) !== null,
        "validateRequired: null obj returns error",
    );

    ok(Validation.isValidPrice(0), "isValidPrice: 0 is valid");
    ok(Validation.isValidPrice(15000), "isValidPrice: 15000 is valid");
    ok(Validation.isValidPrice(1.99), "isValidPrice: 1.99 is valid");
    ok(!Validation.isValidPrice(-1), "isValidPrice: negative is invalid");
    ok(!Validation.isValidPrice("abc"), 'isValidPrice: "abc" is invalid');
    ok(!Validation.isValidPrice(null), "isValidPrice: null is invalid");

    ok(
        Validation.isValidDate("2024-12-25"),
        'isValidDate: "2024-12-25" is valid',
    );
    ok(
        Validation.isValidDate("2024/12/25"),
        'isValidDate: "2024/12/25" is valid',
    );
    ok(
        !Validation.isValidDate("not-a-date"),
        'isValidDate: "not-a-date" is invalid',
    );
    ok(!Validation.isValidDate(""), "isValidDate: empty string is invalid");
    ok(!Validation.isValidDate(null), "isValidDate: null is invalid");

    ok(
        Validation.isValidEnum("pending", [
            "pending",
            "confirmed",
            "cancelled",
        ]),
        'isValidEnum: "pending" in list',
    );
    ok(
        !Validation.isValidEnum("unknown", ["pending", "confirmed"]),
        'isValidEnum: "unknown" not in list',
    );
    ok(
        !Validation.isValidEnum(null, ["a", "b"]),
        "isValidEnum: null not in list",
    );

    // 1.3 PaymentService.simulateGatewayCharge ─────────────────────────────────
    console.log(
        "\n[1.3] PaymentService.simulateGatewayCharge() — Payment Simulator\n",
    );

    const validMethods = ["BCA", "MANDIRI", "BNI", "GOPAY", "OVO", "QRIS"];
    for (const method of validMethods) {
        const result = paymentService.simulateGatewayCharge(
            method,
            "1234567890",
            "123456",
        );
        ok(result.success, `${method}: valid charge succeeds`);
        ok(
            result.transactionId && result.transactionId.startsWith("SIM-"),
            `${method}: returns transactionId`,
        );
    }

    let result = paymentService.simulateGatewayCharge(
        "INVALID",
        "1234567890",
        "123456",
    );
    ok(!result.success, "Invalid method: returns failure");
    equal(
        result.error,
        "Metode pembayaran tidak valid.",
        "Invalid method: correct error msg",
    );

    result = paymentService.simulateGatewayCharge("BCA", "", "123456");
    ok(!result.success, "Empty account: returns failure");
    equal(
        result.error,
        "Nomor rekening/HP wajib diisi.",
        "Empty account: correct error msg",
    );

    result = paymentService.simulateGatewayCharge("BCA", "   ", "123456");
    ok(!result.success, "Whitespace account: returns failure");

    result = paymentService.simulateGatewayCharge("BCA", null, "123456");
    ok(!result.success, "Null account: returns failure");

    result = paymentService.simulateGatewayCharge("BCA", "1234567890", "12345");
    ok(!result.success, "PIN too short: returns failure");
    equal(
        result.error,
        "PIN harus tepat 6 digit angka.",
        "PIN too short: correct error msg",
    );

    result = paymentService.simulateGatewayCharge(
        "BCA",
        "1234567890",
        "1234567",
    );
    ok(!result.success, "PIN too long: returns failure");

    result = paymentService.simulateGatewayCharge(
        "BCA",
        "1234567890",
        "abcdef",
    );
    ok(!result.success, "PIN non-numeric: returns failure");

    result = paymentService.simulateGatewayCharge("BCA", "1234567890", "");
    ok(!result.success, "PIN empty: returns failure");

    result = paymentService.simulateGatewayCharge("BCA", "1234567890", null);
    ok(!result.success, "Null PIN: returns failure");

    result = paymentService.simulateGatewayCharge(
        "GOPAY",
        "08123456789",
        "000000",
    );
    ok(result.success, "GOPAY with 000000 PIN: succeeds");

    result = paymentService.simulateGatewayCharge("QRIS", "123", "999999");
    ok(result.success, "QRIS short account: succeeds");

    // ──────────────────────────────────────────────────────────────────────────
    // SECTION 2 — INTEGRATION TESTS (database required)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n─── INTEGRATION TESTS ─────────────────────────────\n");

    // 2.1 Booking Code Service ─────────────────────────────────────────────────
    console.log("[2.1] bookingCodeService.generateCode()\n");

    const code1 = await bookingCodeService.generateCode();
    const code2 = await bookingCodeService.generateCode();

    match(code1, /^BK[A-Z0-9]{8}$/, "Code 1 matches pattern BK[A-Z0-9]{8}");
    match(code2, /^BK[A-Z0-9]{8}$/, "Code 2 matches pattern BK[A-Z0-9]{8}");
    notEqual(code1, code2, "Two generated codes are different");
    equal(code1.length, 10, "Code 1 length is 10 (BK + 8 chars)");
    equal(code2.length, 10, "Code 2 length is 10 (BK + 8 chars)");
    ok(code1.startsWith("BK"), "Code 1 starts with BK");
    ok(code2.startsWith("BK"), "Code 2 starts with BK");

    // 2.2 Ticket Code Service ───────────────────────────────────────────────────
    console.log("\n[2.2] ticketService.generateTicketCode()\n");

    const tk1 = await ticketService.generateTicketCode();
    const tk2 = await ticketService.generateTicketCode();

    match(
        tk1,
        /^TK[A-Z0-9]{8}$/,
        "Ticket code 1 matches pattern TK[A-Z0-9]{8}",
    );
    match(
        tk2,
        /^TK[A-Z0-9]{8}$/,
        "Ticket code 2 matches pattern TK[A-Z0-9]{8}",
    );
    notEqual(tk1, tk2, "Two ticket codes are different");
    equal(tk1.length, 10, "Ticket code 1 length is 10");
    ok(tk1.startsWith("TK"), "Ticket code 1 starts with TK");

    // 2.3 Seat Availability ─────────────────────────────────────────────────────
    console.log("\n[2.3] seatAvailability — Seat Queries\n");

    try {
        const lockedIds = await seatAvailability.getLockedSeatIds(pool, 1);
        ok(Array.isArray(lockedIds), "getLockedSeatIds returns an array");
        ok(
            lockedIds.every((id) => typeof id === "number"),
            "All locked IDs are numbers",
        );
        console.log(
            `      Locked seat IDs for schedule 1: [${lockedIds.join(", ")}]`,
        );
    } catch (err) {
        ok(false, `getLockedSeatIds: ${err.message}`);
    }

    try {
        const statuses = await seatAvailability.getSeatStatuses(pool, 1);
        ok(Array.isArray(statuses), "getSeatStatuses returns an array");
        ok(
            statuses.every((s) => typeof s === "string"),
            "All statuses are strings",
        );
        console.log(
            `      Booked seat numbers for schedule 1: [${statuses.join(", ")}]`,
        );
    } catch (err) {
        ok(false, `getSeatStatuses: ${err.message}`);
    }

    // 2.4 Payment Service ───────────────────────────────────────────────────────
    console.log("\n[2.4] paymentService — Payment Operations (rollback)\n");

    await withRollback(async (conn) => {
        const [bookings] = await conn.query(
            "SELECT booking_id FROM bookings LIMIT 1",
        );
        if (bookings.length === 0) {
            console.log(
                "  \u26a0  No bookings found — skipping payment CRUD tests",
            );
            return;
        }
        const bid = bookings[0].booking_id;

        const payId = await paymentService.createPendingPayment(
            conn,
            bid,
            150000,
            "BCA",
        );
        ok(payId > 0, "createPendingPayment returns a positive payment_id");

        const payment = await paymentService.getPaymentByBookingId(conn, bid);
        ok(payment, "getPaymentByBookingId returns payment record");
        equal(payment.status, "pending", "New payment has status pending");
        equal(Number(payment.amount), 150000, "Payment amount matches");
        equal(payment.method, "BCA", "Payment method matches BCA");

        const affected = await paymentService.confirmPayment(
            conn,
            payId,
            "SIM-TEST-123",
        );
        equal(affected, 1, "confirmPayment affects 1 row");

        const paid = await paymentService.getPaymentByBookingId(conn, bid);
        equal(paid.status, "paid", "After confirm, status is paid");
        ok(paid.gateway_transaction_id, "gateway_transaction_id is set");
        ok(paid.paid_at, "paid_at timestamp is set");
    });

    // 2.5 Ticket Service ────────────────────────────────────────────────────────
    console.log("\n[2.5] ticketService — Ticket Operations (rollback)\n");

    await withRollback(async (conn) => {
        const [bookings] = await conn.query(
            "SELECT booking_id, booking_code FROM bookings LIMIT 1",
        );
        if (bookings.length === 0) {
            console.log(
                "  \u26a0  No bookings found — skipping ticket CRUD tests",
            );
            return;
        }
        const { booking_id, booking_code } = bookings[0];

        const ticket = await ticketService.issueTicket(
            conn,
            booking_id,
            booking_code,
        );
        ok(ticket, "issueTicket returns a ticket object");
        ok(ticket.ticket_id > 0, "Ticket has positive ticket_id");
        match(
            ticket.ticket_code,
            /^TK[A-Z0-9]{8}$/,
            "Ticket code matches pattern",
        );
        ok(
            ticket.qr_code &&
                ticket.qr_code.startsWith("data:image/png;base64,"),
            "QR code is a base64 PNG data URL",
        );
        ok(ticket.issued_at, "issued_at is set");

        const fetched = await ticketService.getTicketByBookingId(
            conn,
            booking_id,
        );
        ok(fetched, "getTicketByBookingId returns ticket");
        equal(
            fetched.ticket_code,
            ticket.ticket_code,
            "Fetched ticket code matches",
        );

        const dup = await ticketService.issueTicket(
            conn,
            booking_id,
            booking_code,
        );
        equal(
            dup.ticket_code,
            ticket.ticket_code,
            "Second issueTicket returns existing ticket (idempotent)",
        );
    });

    // 2.6 Expiration Service ────────────────────────────────────────────────────
    console.log("\n[2.6] expirationService.expireStaleBookings()\n");

    await withRollback(async (conn) => {
        const [schedules] = await conn.query(
            "SELECT schedule_id FROM schedules LIMIT 1",
        );
        if (schedules.length === 0) {
            console.log(
                "  \u26a0  No schedules found — skipping expiration test",
            );
            return;
        }
        const [users] = await conn.query(
            "SELECT id FROM users WHERE role = 'customer' LIMIT 1",
        );
        if (users.length === 0) {
            console.log(
                "  \u26a0  No customer users found — skipping expiration test",
            );
            return;
        }

        const bkCode = "BK" + Date.now() + "XX";
        await conn.query(
            `INSERT INTO bookings (user_id, schedule_id, booking_code, booking_channel,
        total_amount, status, hold_expired_at, created_at)
       VALUES (?, ?, ?, 'online', 50000, 'pending',
        DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW())`,
            [users[0].id, schedules[0].schedule_id, bkCode],
        );

        const expiredCount = await expirationService.expireStaleBookings();
        ok(
            typeof expiredCount === "number" && expiredCount >= 0,
            "expireStaleBookings returns a number",
        );
        console.log(`      Expired booking count: ${expiredCount}`);
    });

    // 2.7 Request Service — Cancellation ────────────────────────────────────────
    console.log("\n[2.7] requestService — Cancellation Requests (rollback)\n");

    await withRollback(async (conn) => {
        const [bookings] = await conn.query(
            "SELECT booking_id FROM bookings WHERE status = 'confirmed' LIMIT 1",
        );
        const [customers] = await conn.query(
            "SELECT id FROM users WHERE role = 'customer' LIMIT 1",
        );

        if (bookings.length === 0 || customers.length === 0) {
            console.log(
                "  \u26a0  No confirmed bookings or customers — skip cancellation tests",
            );
            return;
        }

        const bid = bookings[0].booking_id;
        const uid = customers[0].id;

        const reqId = await requestService.createCancellationRequest(
            conn,
            bid,
            uid,
            "Test reason",
        );
        ok(
            reqId > 0,
            "createCancellationRequest returns a positive request_id",
        );

        const req = await requestService.getCancellationRequestById(
            conn,
            reqId,
        );
        ok(req, "getCancellationRequestById returns request");
        equal(req.status, "pending", "New request has status pending");
        equal(req.reason, "Test reason", "Reason matches");

        const byBooking =
            await requestService.getCancellationRequestsByBookingId(conn, bid);
        ok(
            Array.isArray(byBooking),
            "getCancellationRequestsByBookingId returns array",
        );
        ok(
            byBooking.some((r) => r.request_id === reqId),
            "Our request is in the list",
        );

        const rejected = await requestService.rejectCancellationRequest(
            conn,
            reqId,
            uid,
            "Test rejection",
        );
        ok(rejected, "rejectCancellationRequest returns true");

        const afterReject = await requestService.getCancellationRequestById(
            conn,
            reqId,
        );
        equal(
            afterReject.status,
            "rejected",
            "After reject, status is rejected",
        );

        const reqId2 = await requestService.createCancellationRequest(
            conn,
            bid,
            uid,
            "Approve me",
        );
        const approved = await requestService.approveCancellationRequest(
            conn,
            reqId2,
            uid,
            "Test approval",
        );
        ok(approved, "approveCancellationRequest returns true");

        const afterApprove = await requestService.getCancellationRequestById(
            conn,
            reqId2,
        );
        equal(
            afterApprove.status,
            "approved",
            "After approve, status is approved",
        );

        const [b] = await conn.query(
            "SELECT status FROM bookings WHERE booking_id = ?",
            [bid],
        );
        equal(b[0].status, "cancelled", "Booking was cancelled after approval");
    });

    // 2.8 Request Service — Reschedule ──────────────────────────────────────────
    console.log("\n[2.8] requestService — Reschedule Requests (rollback)\n");

    await withRollback(async (conn) => {
        const [bookings] = await conn.query(
            "SELECT booking_id FROM bookings WHERE status = 'confirmed' LIMIT 1",
        );
        const [schedules] = await conn.query(
            "SELECT schedule_id, vehicle_id, price FROM schedules LIMIT 1",
        );
        const [customers] = await conn.query(
            "SELECT id FROM users WHERE role = 'customer' LIMIT 1",
        );
        const [seats] = await conn.query(
            "SELECT seat_number, seat_id FROM seats WHERE vehicle_id = ? LIMIT 1",
            [schedules.length > 0 ? schedules[0].vehicle_id : 0],
        );

        if (
            bookings.length === 0 ||
            schedules.length === 0 ||
            customers.length === 0 ||
            seats.length === 0
        ) {
            console.log(
                "  \u26a0  Missing prerequisite data — skip reschedule tests",
            );
            return;
        }

        const bid = bookings[0].booking_id;
        const uid = customers[0].id;
        const targetScheduleId = schedules[0].schedule_id;
        const targetSeatNumber = seats[0].seat_number;

        const reqId = await requestService.createRescheduleRequest(
            conn,
            bid,
            uid,
            targetScheduleId,
            targetSeatNumber,
            "Test reschedule",
        );
        ok(reqId > 0, "createRescheduleRequest returns a positive request_id");

        const req = await requestService.getRescheduleRequestById(conn, reqId);
        ok(req, "getRescheduleRequestById returns request");
        equal(
            req.status,
            "pending",
            "New reschedule request has status pending",
        );

        const byBooking = await requestService.getRescheduleRequestsByBookingId(
            conn,
            bid,
        );
        ok(
            Array.isArray(byBooking),
            "getRescheduleRequestsByBookingId returns array",
        );

        const rejected = await requestService.rejectRescheduleRequest(
            conn,
            reqId,
            uid,
            "Test reject",
        );
        ok(rejected, "rejectRescheduleRequest returns true");

        const afterReject = await requestService.getRescheduleRequestById(
            conn,
            reqId,
        );
        equal(
            afterReject.status,
            "rejected",
            "After reject, status is rejected",
        );

        const reqId2 = await requestService.createRescheduleRequest(
            conn,
            bid,
            uid,
            targetScheduleId,
            targetSeatNumber,
            "Approve me",
        );
        const approveResult = await requestService.approveRescheduleRequest(
            conn,
            reqId2,
            uid,
            "Approved",
        );
        ok(approveResult.success, "approveRescheduleRequest succeeds");
    });

    // 2.9 Notification Service ──────────────────────────────────────────────────
    console.log("\n[2.9] notificationService.createNotification()\n");

    await withRollback(async (conn) => {
        const [customers] = await conn.query(
            "SELECT id FROM users WHERE role = 'customer' LIMIT 1",
        );
        const [admins] = await conn.query(
            "SELECT id FROM users WHERE role = 'admin' LIMIT 1",
        );
        if (customers.length === 0 || admins.length === 0) {
            console.log(
                "  \u26a0  No users found — skipping notification tests",
            );
            return;
        }

        await notificationService.createNotification({
            type: "booking_created",
            userId: customers[0].id,
            adminId: admins[0].id,
            bookingId: null,
            message: "Test notification — booking created",
            payload: { test: true },
            io: null,
        });

        const [rows] = await pool.query(
            "SELECT * FROM notifications WHERE type = ? AND user_id = ? ORDER BY id DESC LIMIT 1",
            ["booking_created", customers[0].id],
        );
        ok(rows.length > 0, "Notification persisted to database");
        equal(
            rows[0].message,
            "Test notification — booking created",
            "Notification message matches",
        );
        equal(rows[0].type, "booking_created", "Notification type matches");

        for (const ntype of [
            "payment_confirmed",
            "cancelled",
            "expired",
            "rescheduled",
        ]) {
            await notificationService.createNotification({
                type: ntype,
                userId: customers[0].id,
                message: `Test ${ntype}`,
                io: null,
            });
            const [check] = await pool.query(
                "SELECT COUNT(*) as cnt FROM notifications WHERE type = ? AND user_id = ?",
                [ntype, customers[0].id],
            );
            ok(check[0].cnt > 0, `Notification type "${ntype}" persisted`);
        }
    });

    // 2.10 Full Booking Creation Flow ──────────────────────────────────────────
    console.log("\n[2.10] Booking Creation Flow (rollback)\n");

    await withRollback(async (conn) => {
        const [schedules] = await conn.query(`
      SELECT s.schedule_id, s.price, s.vehicle_id
      FROM schedules s
      WHERE s.status = 'available' AND s.departure_time > NOW()
      LIMIT 1
    `);
        if (schedules.length === 0) {
            console.log(
                "  \u26a0  No future available schedules — skip booking flow",
            );
            return;
        }

        const sched = schedules[0];
        const [customers] = await conn.query(
            "SELECT id FROM users WHERE role = 'customer' LIMIT 1",
        );
        if (customers.length === 0) {
            console.log("  \u26a0  No customer users — skip booking flow");
            return;
        }

        const [availableSeats] = await conn.query(
            `
      SELECT st.seat_id, st.seat_number
      FROM seats st
      WHERE st.vehicle_id = ? AND st.seat_id NOT IN (
        SELECT bs.seat_id FROM booking_seats bs
        JOIN bookings b ON bs.booking_id = b.booking_id
        WHERE b.schedule_id = ?
          AND (b.status = 'confirmed'
            OR (b.status = 'pending' AND b.hold_expired_at > NOW()))
      )
      LIMIT 2
    `,
            [sched.vehicle_id, sched.schedule_id],
        );

        if (availableSeats.length < 2) {
            console.log(
                "  \u26a0  Need at least 2 available seats — skip booking flow",
            );
            return;
        }

        const uid = customers[0].id;
        const seat1 = availableSeats[0];
        const seat2 = availableSeats[1];
        const bookingCode = await bookingCodeService.generateCode();
        const totalAmount = Number(sched.price) * 2;

        await seatAvailability.assertSeatAvailable(
            conn,
            sched.schedule_id,
            seat1.seat_id,
        );
        await seatAvailability.assertSeatAvailable(
            conn,
            sched.schedule_id,
            seat2.seat_id,
        );
        console.log("      Seat availability asserted for both seats");

        const [bkResult] = await conn.query(
            `INSERT INTO bookings (user_id, schedule_id, booking_code, booking_channel,
        total_amount, passenger_name, status, hold_expired_at, created_at)
       VALUES (?, ?, ?, 'online', ?, ?, 'pending',
        DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW())`,
            [
                uid,
                sched.schedule_id,
                bookingCode,
                totalAmount,
                "Test Passenger",
            ],
        );
        ok(bkResult.insertId > 0, "Booking row inserted");
        const bookingId = bkResult.insertId;
        console.log(
            `      Created booking #${bookingId} with code ${bookingCode}`,
        );

        await conn.query(
            "INSERT INTO booking_seats (booking_id, seat_id, price_at_booking) VALUES (?, ?, ?)",
            [bookingId, seat1.seat_id, sched.price],
        );
        await conn.query(
            "INSERT INTO booking_seats (booking_id, seat_id, price_at_booking) VALUES (?, ?, ?)",
            [bookingId, seat2.seat_id, sched.price],
        );

        await conn.query(
            "INSERT INTO passengers (booking_id, full_name, identity_number, phone) VALUES (?, ?, ?, ?)",
            [bookingId, "Alice", "1234567890", "0811111111"],
        );
        await conn.query(
            "INSERT INTO passengers (booking_id, full_name, identity_number, phone) VALUES (?, ?, ?, ?)",
            [bookingId, "Bob", "0987654321", "0822222222"],
        );

        const [bsRows] = await conn.query(
            "SELECT COUNT(*) as cnt FROM booking_seats WHERE booking_id = ?",
            [bookingId],
        );
        equal(bsRows[0].cnt, 2, "2 booking_seats created");

        const [pRows] = await conn.query(
            "SELECT COUNT(*) as cnt, GROUP_CONCAT(full_name) as names FROM passengers WHERE booking_id = ?",
            [bookingId],
        );
        equal(pRows[0].cnt, 2, "2 passenger rows created");
        ok(pRows[0].names.includes("Alice"), "Passenger Alice found");
        ok(pRows[0].names.includes("Bob"), "Passenger Bob found");

        let duplicateError = null;
        try {
            await conn.query(
                "INSERT INTO bookings (user_id, schedule_id, booking_code, booking_channel, status) VALUES (?, ?, ?, 'online', 'pending')",
                [uid, sched.schedule_id, bookingCode],
            );
        } catch (err) {
            duplicateError = err;
        }
        ok(duplicateError, "Duplicate booking_code correctly rejected");

        const payId = await paymentService.createPendingPayment(
            conn,
            bookingId,
            totalAmount,
            "GOPAY",
        );
        ok(payId > 0, "Payment record created for booking");

        await paymentService.confirmPayment(
            conn,
            payId,
            "SIM-BOOKING-FLOW-TEST",
        );
        const payRecord = await paymentService.getPaymentByBookingId(
            conn,
            bookingId,
        );
        equal(payRecord.status, "paid", "Payment confirmed as paid");

        const ticket = await ticketService.issueTicket(
            conn,
            bookingId,
            bookingCode,
        );
        ok(ticket, "E-ticket issued for confirmed booking");
        match(
            ticket.ticket_code,
            /^TK[A-Z0-9]{8}$/,
            "Ticket code format correct",
        );
        ok(
            ticket.qr_code.startsWith("data:image/png;base64,"),
            "QR code is base64 PNG",
        );

        console.log(
            "      Full booking \u2192 payment \u2192 ticket flow verified",
        );
    });

    // 2.11 Admin offline booking flow ──────────────────────────────────────────
    console.log("\n[2.11] Admin Offline Booking Flow (rollback)\n");

    await withRollback(async (conn) => {
        const [schedules] = await conn.query(`
      SELECT s.schedule_id, s.price, s.vehicle_id
      FROM schedules s
      WHERE s.status = 'available' AND s.departure_time > NOW()
      LIMIT 1
    `);
        if (schedules.length === 0) {
            console.log(
                "  \u26a0  No future available schedules — skip offline booking",
            );
            return;
        }
        const sched = schedules[0];

        const [availableSeats] = await conn.query(
            `
      SELECT st.seat_id, st.seat_number
      FROM seats st
      WHERE st.vehicle_id = ? AND st.seat_id NOT IN (
        SELECT bs.seat_id FROM booking_seats bs
        JOIN bookings b ON bs.booking_id = b.booking_id
        WHERE b.schedule_id = ?
          AND (b.status = 'confirmed'
            OR (b.status = 'pending' AND b.hold_expired_at > NOW()))
      )
      LIMIT 1
    `,
            [sched.vehicle_id, sched.schedule_id],
        );

        if (availableSeats.length === 0) {
            console.log("  \u26a0  No available seats — skip offline booking");
            return;
        }

        const seat = availableSeats[0];
        const bookingCode = await bookingCodeService.generateCode();

        await seatAvailability.assertSeatAvailable(
            conn,
            sched.schedule_id,
            seat.seat_id,
        );

        const [bkResult] = await conn.query(
            `INSERT INTO bookings (user_id, schedule_id, booking_code, booking_channel,
        total_amount, passenger_name, status, created_at)
       VALUES (NULL, ?, ?, 'offline', ?, ?, 'confirmed', NOW())`,
            [
                sched.schedule_id,
                bookingCode,
                Number(sched.price),
                "Offline Passenger",
            ],
        );
        const bookingId = bkResult.insertId;

        await conn.query(
            "INSERT INTO booking_seats (booking_id, seat_id, price_at_booking) VALUES (?, ?, ?)",
            [bookingId, seat.seat_id, sched.price],
        );

        await conn.query(
            "INSERT INTO passengers (booking_id, full_name, identity_number, phone) VALUES (?, ?, ?, ?)",
            [bookingId, "Offline Passenger", "ID-TEST", "08123456789"],
        );

        const ticket = await ticketService.issueTicket(
            conn,
            bookingId,
            bookingCode,
        );
        ok(ticket, "Offline booking gets e-ticket on creation");

        const [bs] = await conn.query(
            "SELECT COUNT(*) as cnt FROM booking_seats WHERE booking_id = ?",
            [bookingId],
        );
        equal(bs[0].cnt, 1, "1 booking_seat for offline booking");

        const [p] = await conn.query(
            "SELECT COUNT(*) as cnt FROM passengers WHERE booking_id = ?",
            [bookingId],
        );
        equal(p[0].cnt, 1, "1 passenger for offline booking");

        console.log("      Admin offline booking flow verified");
    });

    // 2.12 Database connection pool health ──────────────────────────────────────
    console.log("\n[2.12] Database Connection Pool\n");

    try {
        const conn = await pool.getConnection();
        ok(true, "getConnection succeeds");
        const [rows] = await conn.query("SELECT 1 AS result");
        equal(rows[0].result, 1, "SELECT 1 returns 1");
        conn.release();
        console.log("      Pool connection acquired and released successfully");
    } catch (err) {
        ok(false, `Database connection: ${err.message}`);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SUMMARY
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n══════════════════════════════════════════════════");
    console.log(`  Total : ${totalTests}`);
    console.log(`  Passed: ${passedTests}`);
    console.log(`  Failed: ${failures.length}`);
    console.log("══════════════════════════════════════════════════\n");

    if (failures.length > 0) {
        console.log("FAILED TESTS:");
        for (const f of failures) {
            console.log(`  \u2717 ${f.msg}`);
            console.log(`    ${f.err.message}`);
        }
        console.log("");
    }

    await pool.end();

    if (failures.length > 0) {
        process.exit(1);
    }
    process.exit(0);
}

runTests().catch((err) => {
    console.error("\n\u274C Test Suite Crashed:", err.message);
    console.error(err.stack);
    pool.end().catch(() => {});
    process.exit(1);
});
