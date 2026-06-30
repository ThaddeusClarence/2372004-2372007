-- Seed 8 additional testing accounts (mix of admins and customers)
-- Passwords are bcrypt hashes: admin123 (for admins) and cust123 (for customers)

INSERT INTO users (email, username, password, role, email_verified_at, created_at, updated_at)
VALUES
    ('admin2@travelgo.com', 'admin2', '$2b$12$kqBSKNhozEdrfQG2vP6rDeic2GrI2B7dyYOeFMFSWLWx85vLWw8.O', 'admin', NOW(), NOW(), NOW()),
    ('admin3@travelgo.com', 'admin3', '$2b$12$kqBSKNhozEdrfQG2vP6rDeic2GrI2B7dyYOeFMFSWLWx85vLWw8.O', 'admin', NOW(), NOW(), NOW()),
    ('ani@example.com', 'ani', '$2b$12$BBJ3NMvHk4CAuHQ4CljFG.6oAn4OqqwDwYrP0iGu1qC4dHKyxGiXS', 'customer', NOW(), NOW(), NOW()),
    ('candra@example.com', 'candra', '$2b$12$BBJ3NMvHk4CAuHQ4CljFG.6oAn4OqqwDwYrP0iGu1qC4dHKyxGiXS', 'customer', NOW(), NOW(), NOW()),
    ('dewi@example.com', 'dewi', '$2b$12$BBJ3NMvHk4CAuHQ4CljFG.6oAn4OqqwDwYrP0iGu1qC4dHKyxGiXS', 'customer', NOW(), NOW(), NOW()),
    ('eko@example.com', 'eko', '$2b$12$BBJ3NMvHk4CAuHQ4CljFG.6oAn4OqqwDwYrP0iGu1qC4dHKyxGiXS', 'customer', NOW(), NOW(), NOW()),
    ('farida@example.com', 'farida', '$2b$12$BBJ3NMvHk4CAuHQ4CljFG.6oAn4OqqwDwYrP0iGu1qC4dHKyxGiXS', 'customer', NOW(), NOW(), NOW()),
    ('gita@example.com', 'gita', '$2b$12$BBJ3NMvHk4CAuHQ4CljFG.6oAn4OqqwDwYrP0iGu1qC4dHKyxGiXS', 'customer', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    password = VALUES(password),
    role = VALUES(role),
    updated_at = NOW();

-- Clear old seeded dummy bookings to ensure re-runnable execution
DELETE FROM bookings WHERE booking_code LIKE 'BKSEED%';

-- Fetch user IDs into variables
SET @budi_id = (SELECT id FROM users WHERE email = 'budi@example.com');
SET @ani_id = (SELECT id FROM users WHERE email = 'ani@example.com');
SET @candra_id = (SELECT id FROM users WHERE email = 'candra@example.com');
SET @dewi_id = (SELECT id FROM users WHERE email = 'dewi@example.com');
SET @eko_id = (SELECT id FROM users WHERE email = 'eko@example.com');
SET @farida_id = (SELECT id FROM users WHERE email = 'farida@example.com');
SET @gita_id = (SELECT id FROM users WHERE email = 'gita@example.com');
SET @admin_id = (SELECT id FROM users WHERE email = 'admin@travelgo.com');

-- Fetch seat IDs for vehicle 1
SET @seat_v1_01 = (SELECT seat_id FROM seats WHERE vehicle_id = 1 AND seat_number = '01');
SET @seat_v1_02 = (SELECT seat_id FROM seats WHERE vehicle_id = 1 AND seat_number = '02');
SET @seat_v1_03 = (SELECT seat_id FROM seats WHERE vehicle_id = 1 AND seat_number = '03');
SET @seat_v1_04 = (SELECT seat_id FROM seats WHERE vehicle_id = 1 AND seat_number = '04');
SET @seat_v1_05 = (SELECT seat_id FROM seats WHERE vehicle_id = 1 AND seat_number = '05');

-- Fetch seat IDs for vehicle 2
SET @seat_v2_01 = (SELECT seat_id FROM seats WHERE vehicle_id = 2 AND seat_number = '01');

-- Fetch seat IDs for vehicle 4
SET @seat_v4_01 = (SELECT seat_id FROM seats WHERE vehicle_id = 4 AND seat_number = '01');
SET @seat_v4_02 = (SELECT seat_id FROM seats WHERE vehicle_id = 4 AND seat_number = '02');

-- =============================================================================
-- Dummy Booking 1: Confirmed and Paid Booking (Multi-Passenger)
-- =============================================================================
INSERT INTO bookings (user_id, schedule_id, booking_code, booking_channel, total_amount, status, created_at, passenger_name)
VALUES (@budi_id, 1, 'BKSEED01', 'online', 300000.00, 'confirmed', NOW() - INTERVAL 1 DAY, 'Budi');
SET @booking_id_1 = LAST_INSERT_ID();

INSERT INTO booking_seats (booking_id, seat_id, price_at_booking)
VALUES (@booking_id_1, @seat_v1_01, 150000.00),
       (@booking_id_1, @seat_v1_02, 150000.00);

INSERT INTO passengers (booking_id, full_name, identity_number, phone)
VALUES (@booking_id_1, 'Budi Santoso', '3201010101010001', '081234567890'),
       (@booking_id_1, 'Adi Wijaya', '3201010101010002', '081234567891');

INSERT INTO payments (booking_id, amount, method, status, gateway_transaction_id, paid_at)
VALUES (@booking_id_1, 300000.00, 'BCA', 'paid', 'TXSEED01', NOW() - INTERVAL 23 HOUR);

INSERT INTO e_tickets (booking_id, ticket_code, qr_code, issued_at)
VALUES (@booking_id_1, 'TKSEED01', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', NOW() - INTERVAL 23 HOUR);

-- =============================================================================
-- Dummy Booking 2: Pending Booking (Waiting for payment)
-- =============================================================================
INSERT INTO bookings (user_id, schedule_id, booking_code, booking_channel, total_amount, status, hold_expired_at, created_at, passenger_name)
VALUES (@ani_id, 1, 'BKSEED02', 'online', 150000.00, 'pending', NOW() + INTERVAL 2 HOUR, NOW() - INTERVAL 10 MINUTE, 'Ani');
SET @booking_id_2 = LAST_INSERT_ID();

INSERT INTO booking_seats (booking_id, seat_id, price_at_booking)
VALUES (@booking_id_2, @seat_v1_03, 150000.00);

INSERT INTO passengers (booking_id, full_name, identity_number, phone)
VALUES (@booking_id_2, 'Ani Maryani', '3201010101010003', '081234567892');

INSERT INTO payments (booking_id, amount, method, status, gateway_transaction_id, paid_at)
VALUES (@booking_id_2, 150000.00, 'MANDIRI', 'pending', NULL, NULL);

-- =============================================================================
-- Dummy Booking 3: Cancelled Booking
-- =============================================================================
INSERT INTO bookings (user_id, schedule_id, booking_code, booking_channel, total_amount, status, created_at, passenger_name)
VALUES (@candra_id, 6, 'BKSEED03', 'online', 75000.00, 'cancelled', NOW() - INTERVAL 2 DAY, 'Candra');
SET @booking_id_3 = LAST_INSERT_ID();

INSERT INTO booking_seats (booking_id, seat_id, price_at_booking)
VALUES (@booking_id_3, @seat_v4_01, 75000.00);

INSERT INTO passengers (booking_id, full_name, identity_number, phone)
VALUES (@booking_id_3, 'Candra Kirana', '3201010101010004', '081234567893');

-- =============================================================================
-- Dummy Booking 4: Confirmed with Pending Cancellation Request (Refund)
-- =============================================================================
INSERT INTO bookings (user_id, schedule_id, booking_code, booking_channel, total_amount, status, created_at, passenger_name)
VALUES (@dewi_id, 8, 'BKSEED04', 'online', 350000.00, 'confirmed', NOW() - INTERVAL 12 HOUR, 'Dewi');
SET @booking_id_4 = LAST_INSERT_ID();

INSERT INTO booking_seats (booking_id, seat_id, price_at_booking)
VALUES (@booking_id_4, @seat_v1_05, 350000.00);

INSERT INTO passengers (booking_id, full_name, identity_number, phone)
VALUES (@booking_id_4, 'Dewi Lestari', '3201010101010005', '081234567894');

INSERT INTO payments (booking_id, amount, method, status, gateway_transaction_id, paid_at)
VALUES (@booking_id_4, 350000.00, 'GOPAY', 'paid', 'TXSEED04', NOW() - INTERVAL 11 HOUR);

INSERT INTO e_tickets (booking_id, ticket_code, qr_code, issued_at)
VALUES (@booking_id_4, 'TKSEED04', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', NOW() - INTERVAL 11 HOUR);

INSERT INTO cancellation_requests (booking_id, user_id, reason, status, requested_at)
VALUES (@booking_id_4, @dewi_id, 'Salah tanggal pemesanan, anak sakit.', 'pending', NOW() - INTERVAL 2 HOUR);

-- =============================================================================
-- Dummy Booking 5: Confirmed with Pending Reschedule Request
-- =============================================================================
INSERT INTO bookings (user_id, schedule_id, booking_code, booking_channel, total_amount, status, created_at, passenger_name)
VALUES (@eko_id, 1, 'BKSEED05', 'online', 150000.00, 'confirmed', NOW() - INTERVAL 18 HOUR, 'Eko');
SET @booking_id_5 = LAST_INSERT_ID();

INSERT INTO booking_seats (booking_id, seat_id, price_at_booking)
VALUES (@booking_id_5, @seat_v1_04, 150000.00);

INSERT INTO passengers (booking_id, full_name, identity_number, phone)
VALUES (@booking_id_5, 'Eko Prasetyo', '3201010101010006', '081234567895');

INSERT INTO payments (booking_id, amount, method, status, gateway_transaction_id, paid_at)
VALUES (@booking_id_5, 150000.00, 'OVO', 'paid', 'TXSEED05', NOW() - INTERVAL 17 HOUR);

INSERT INTO e_tickets (booking_id, ticket_code, qr_code, issued_at)
VALUES (@booking_id_5, 'TKSEED05', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', NOW() - INTERVAL 17 HOUR);

INSERT INTO reschedule_requests (booking_id, user_id, target_schedule_id, target_seat_number, reason, status, requested_at)
VALUES (@booking_id_5, @eko_id, 6, '02', 'Ingin pindah ke jadwal sore hari.', 'pending', NOW() - INTERVAL 3 HOUR);

-- =============================================================================
-- Seed Notifications for Admin Panel Presentation
-- =============================================================================
DELETE FROM notifications;
INSERT INTO notifications (admin_id, type, user_id, booking_id, message, created_at)
VALUES
    (@admin_id, 'booking_created', @budi_id, @booking_id_1, 'Pemesanan baru dibuat oleh Budi Santoso (BKSEED01).', NOW() - INTERVAL 1 DAY),
    (@admin_id, 'payment_confirmed', @budi_id, @booking_id_1, 'Pembayaran untuk pemesanan BKSEED01 telah dikonfirmasi.', NOW() - INTERVAL 23 HOUR),
    (@admin_id, 'booking_created', @ani_id, @booking_id_2, 'Pemesanan baru dibuat oleh Ani Maryani (BKSEED02).', NOW() - INTERVAL 10 MINUTE),
    (@admin_id, 'booking_created', @dewi_id, @booking_id_4, 'Pemesanan baru dibuat oleh Dewi Lestari (BKSEED04).', NOW() - INTERVAL 12 HOUR),
    (@admin_id, 'payment_confirmed', @dewi_id, @booking_id_4, 'Pembayaran untuk pemesanan BKSEED04 telah dikonfirmasi.', NOW() - INTERVAL 11 HOUR),
    (@admin_id, 'cancelled', @dewi_id, @booking_id_4, 'Permintaan pembatalan diajukan oleh Dewi Lestari (BKSEED04).', NOW() - INTERVAL 2 HOUR),
    (@admin_id, 'rescheduled', @eko_id, @booking_id_5, 'Permintaan reschedule diajukan oleh Eko Prasetyo (BKSEED05).', NOW() - INTERVAL 3 HOUR);
