-- Reschedule request table for customer-initiated reschedules of confirmed bookings
-- Requires admin approval before booking changes

CREATE TABLE IF NOT EXISTS reschedule_requests (
    request_id INT NOT NULL AUTO_INCREMENT,
    booking_id INT NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    target_schedule_id INT NOT NULL,
    target_seat_number VARCHAR(10) NOT NULL,
    reason TEXT NULL,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    reviewed_by BIGINT UNSIGNED NULL,
    admin_notes TEXT NULL,
    PRIMARY KEY (request_id),
    KEY reschedule_requests_booking_id_index (booking_id),
    KEY reschedule_requests_user_id_index (user_id),
    KEY reschedule_requests_target_schedule_id_index (target_schedule_id),
    KEY reschedule_requests_status_index (status),
    CONSTRAINT reschedule_requests_booking_id_foreign
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    CONSTRAINT reschedule_requests_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT reschedule_requests_target_schedule_id_foreign
        FOREIGN KEY (target_schedule_id) REFERENCES schedules(schedule_id),
    CONSTRAINT reschedule_requests_reviewed_by_foreign
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
