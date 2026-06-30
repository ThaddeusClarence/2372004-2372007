-- Add indexes expected by the current source-of-truth schema when migrating older imported databases.
-- ADD INDEX IF NOT EXISTS is not supported before MySQL 8.0.20, so we use a stored procedure
-- that checks INFORMATION_SCHEMA.STATISTICS before issuing each ALTER TABLE.

DROP PROCEDURE IF EXISTS _migrate_004_add_index;

CREATE PROCEDURE _migrate_004_add_index(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_ddl   TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = p_table
          AND INDEX_NAME   = p_index
    ) THEN
        SET @_sql = p_ddl;
        PREPARE _stmt FROM @_sql;
        EXECUTE _stmt;
        DEALLOCATE PREPARE _stmt;
    END IF;
END;

CALL _migrate_004_add_index('bookings',     'bookings_status_hold_index',              'ALTER TABLE bookings      ADD INDEX      bookings_status_hold_index              (status, hold_expired_at)');
CALL _migrate_004_add_index('seats',        'seats_vehicle_number_unique',             'ALTER TABLE seats         ADD UNIQUE KEY seats_vehicle_number_unique             (vehicle_id, seat_number)');
CALL _migrate_004_add_index('booking_seats','booking_seats_booking_seat_unique',       'ALTER TABLE booking_seats ADD UNIQUE KEY booking_seats_booking_seat_unique       (booking_id, seat_id)');
CALL _migrate_004_add_index('payments',     'payments_gateway_transaction_id_index',   'ALTER TABLE payments      ADD INDEX      payments_gateway_transaction_id_index   (gateway_transaction_id)');
CALL _migrate_004_add_index('e_tickets',    'e_tickets_booking_id_unique',             'ALTER TABLE e_tickets     ADD UNIQUE KEY e_tickets_booking_id_unique             (booking_id)');

DROP PROCEDURE IF EXISTS _migrate_004_add_index;
