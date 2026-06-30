-- CODE-CITE:
--   Title: Expand Notifications Table Schema Migration
--   Type: ai
--   Value: Antigravity Gemini
--   Notes: SQL migration script to add notification type, target users, and booking references.
--   Lines Range: 8
-- Expand notifications table to support advanced types and targets.
-- ADD COLUMN IF NOT EXISTS and ADD INDEX IF NOT EXISTS are not supported before MySQL 8.0.20,
-- and ADD CONSTRAINT fails if the constraint already exists, so we use stored procedures
-- that check INFORMATION_SCHEMA before issuing each ALTER TABLE.

-- ── Columns ──────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS _migrate_007_add_col;

CREATE PROCEDURE _migrate_007_add_col(
    IN p_column VARCHAR(64),
    IN p_ddl    TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'notifications'
          AND COLUMN_NAME  = p_column
    ) THEN
        SET @_sql = p_ddl;
        PREPARE _stmt FROM @_sql;
        EXECUTE _stmt;
        DEALLOCATE PREPARE _stmt;
    END IF;
END;

CALL _migrate_007_add_col('type',       'ALTER TABLE notifications ADD COLUMN type       VARCHAR(50)     NULL AFTER admin_id');
CALL _migrate_007_add_col('user_id',    'ALTER TABLE notifications ADD COLUMN user_id    BIGINT UNSIGNED NULL AFTER type');
CALL _migrate_007_add_col('booking_id', 'ALTER TABLE notifications ADD COLUMN booking_id INT             NULL AFTER user_id');
CALL _migrate_007_add_col('payload',    'ALTER TABLE notifications ADD COLUMN payload    TEXT            NULL AFTER booking_id');

DROP PROCEDURE IF EXISTS _migrate_007_add_col;

-- ── Indexes ───────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS _migrate_007_add_index;

CREATE PROCEDURE _migrate_007_add_index(
    IN p_index VARCHAR(64),
    IN p_ddl   TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'notifications'
          AND INDEX_NAME   = p_index
    ) THEN
        SET @_sql = p_ddl;
        PREPARE _stmt FROM @_sql;
        EXECUTE _stmt;
        DEALLOCATE PREPARE _stmt;
    END IF;
END;

CALL _migrate_007_add_index('notifications_user_id_idx',    'ALTER TABLE notifications ADD INDEX notifications_user_id_idx    (user_id)');
CALL _migrate_007_add_index('notifications_booking_id_idx', 'ALTER TABLE notifications ADD INDEX notifications_booking_id_idx (booking_id)');

DROP PROCEDURE IF EXISTS _migrate_007_add_index;

-- ── Foreign keys ──────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS _migrate_007_add_fk;

CREATE PROCEDURE _migrate_007_add_fk(
    IN p_constraint VARCHAR(64),
    IN p_ddl        TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA      = DATABASE()
          AND TABLE_NAME        = 'notifications'
          AND CONSTRAINT_NAME   = p_constraint
    ) THEN
        SET @_sql = p_ddl;
        PREPARE _stmt FROM @_sql;
        EXECUTE _stmt;
        DEALLOCATE PREPARE _stmt;
    END IF;
END;

CALL _migrate_007_add_fk('fk_notifications_user_id',    'ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id    FOREIGN KEY (user_id)    REFERENCES users(id)                  ON DELETE CASCADE');
CALL _migrate_007_add_fk('fk_notifications_booking_id', 'ALTER TABLE notifications ADD CONSTRAINT fk_notifications_booking_id FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)       ON DELETE CASCADE');

DROP PROCEDURE IF EXISTS _migrate_007_add_fk;
