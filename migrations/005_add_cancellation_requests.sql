-- Cancellation request table for customer-initiated cancellations of confirmed bookings
-- Requires admin approval before booking status changes
-- Also adds hidden_at column for soft-delete history feature

-- Add hidden_at column for soft-delete (hide history instead of delete).
-- ADD COLUMN IF NOT EXISTS is not supported before MySQL 8.0.20, so we use a stored
-- procedure that checks INFORMATION_SCHEMA.COLUMNS before issuing the ALTER TABLE.

DROP PROCEDURE IF EXISTS _migrate_005_add_col;

CREATE PROCEDURE _migrate_005_add_col(
    IN p_table  VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_ddl    TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = p_table
          AND COLUMN_NAME  = p_column
    ) THEN
        SET @_sql = p_ddl;
        PREPARE _stmt FROM @_sql;
        EXECUTE _stmt;
        DEALLOCATE PREPARE _stmt;
    END IF;
END;

CALL _migrate_005_add_col('bookings', 'hidden_at', 'ALTER TABLE bookings ADD COLUMN hidden_at DATETIME NULL AFTER hold_expired_at');

DROP PROCEDURE IF EXISTS _migrate_005_add_col;

CREATE TABLE IF NOT EXISTS cancellation_requests (
    request_id INT NOT NULL AUTO_INCREMENT,
    booking_id INT NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    reason TEXT NULL,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,
    reviewed_by BIGINT UNSIGNED NULL,
    admin_notes TEXT NULL,
    PRIMARY KEY (request_id),
    KEY cancellation_requests_booking_id_index (booking_id),
    KEY cancellation_requests_user_id_index (user_id),
    KEY cancellation_requests_status_index (status),
    CONSTRAINT cancellation_requests_booking_id_foreign
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    CONSTRAINT cancellation_requests_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT cancellation_requests_reviewed_by_foreign
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
