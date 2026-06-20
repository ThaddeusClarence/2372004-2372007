-- CODE-CITE:
--   Title: Expand Notifications Table Schema Migration
--   Type: ai
--   Value: Antigravity Gemini
--   Notes: SQL migration script to add notification type, target users, and booking references.
--   Lines Range: 8
-- Expand notifications table to support advanced types and targets
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) NULL AFTER admin_id;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id BIGINT UNSIGNED NULL AFTER type;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS booking_id INT NULL AFTER user_id;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS payload TEXT NULL AFTER booking_id;

-- Add indexes for the foreign keys
ALTER TABLE notifications ADD INDEX IF NOT EXISTS notifications_user_id_idx (user_id);
ALTER TABLE notifications ADD INDEX IF NOT EXISTS notifications_booking_id_idx (booking_id);

-- Add foreign keys
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_booking_id FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE;
