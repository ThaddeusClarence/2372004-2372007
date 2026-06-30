SET FOREIGN_KEY_CHECKS = 0;

-- Mark placeholder schedules as unavailable to hide them from active search results
UPDATE schedules SET status = 'unavailable' WHERE route_id IN (8, 9) OR schedule_id = 9;

-- Insert a wide variety of schedules spanning the next 7 days using all vehicle classes.
-- This ensures that testers choosing different dates or routes during your presentation
-- will always get active schedules and can book concurrent seats without conflicts.

-- Delete existing schedules that might overlap to keep seeds clean and reproducible
DELETE FROM schedules WHERE schedule_id >= 10;

INSERT INTO schedules (schedule_id, route_id, vehicle_id, departure_time, arrival_estimate, price, status, pickup_point, dropoff_point)
VALUES
    -- ==========================================
    -- HARI INI (TODAY)
    -- ==========================================
    -- Jakarta -> Bandung (Executive Class, 16 seats)
    (10, 1, 3, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 HOUR), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 HOUR), 180000.00, 'available', 'Pondok Indah Mall', 'Paris Van Java'),
    -- Bandung -> Jakarta (Minibus Class, 8 seats)
    (11, 2, 4, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 4 HOUR), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 HOUR), 120000.00, 'available', 'Baltos', 'Semanggi'),
    -- Surabaya -> Malang (Premium Class, 8 seats)
    (12, 5, 5, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 HOUR), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 3 HOUR), 110000.00, 'available', 'Stasiun Gubeng', 'Alun-Alun Malang'),

    -- ==========================================
    -- BESOK (TOMORROW)
    -- ==========================================
    -- Jakarta -> Bandung (Bus, 40 seats)
    (13, 1, 1, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 26 HOUR), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 29 HOUR), 150000.00, 'available', 'Terminal Kampung Rambutan', 'Terminal Leuwipanjang'),
    -- Bandung -> Jakarta (Bus, 40 seats)
    (14, 2, 2, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 28 HOUR), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 31 HOUR), 150000.00, 'available', 'Terminal Leuwipanjang', 'Terminal Kampung Rambutan'),
    -- Jakarta -> Semarang (Executive, 16 seats)
    (15, 3, 3, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 HOUR), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 37 HOUR), 320000.00, 'available', 'Semanggi Plaza', 'Simpang Lima'),

    -- ==========================================
    -- LUSA (IN 2 DAYS)
    -- ==========================================
    -- Jakarta -> Yogyakarta (Bus, 40 seats)
    (16, 7, 1, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 50 HOUR), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 59 HOUR), 350000.00, 'available', 'Terminal Pulo Gebang', 'Terminal Giwangan'),
    -- Yogyakarta -> Semarang (Minibus, 8 seats)
    (17, 6, 4, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 52 HOUR), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 55 HOUR), 130000.00, 'available', 'Malioboro', 'Simpang Lima'),

    -- ==========================================
    -- IN 3 DAYS
    -- ==========================================
    -- Surabaya -> Malang (Premium, 8 seats)
    (18, 5, 5, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 73 HOUR), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 75 HOUR), 110000.00, 'available', 'Stasiun Gubeng', 'Alun-Alun Malang'),
    -- Jakarta -> Bandung (Executive, 16 seats)
    (19, 1, 3, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 75 HOUR), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 78 HOUR), 180000.00, 'available', 'Pondok Indah Mall', 'Paris Van Java'),

    -- ==========================================
    -- IN 4 DAYS
    -- ==========================================
    -- Semarang -> Surabaya (Bus, 40 seats)
    (20, 4, 2, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 98 HOUR), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 104 HOUR), 220000.00, 'available', 'Simpang Lima', 'Terminal Purabaya'),

    -- ==========================================
    -- IN 5 DAYS
    -- ==========================================
    -- Bandung -> Jakarta (Minibus, 8 seats)
    (21, 2, 4, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 122 HOUR), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 125 HOUR), 125000.00, 'available', 'Baltos', 'Semanggi'),

    -- ==========================================
    -- IN 6 DAYS
    -- ==========================================
    -- Jakarta -> Semarang (Executive, 16 seats)
    (22, 3, 3, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 146 HOUR), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 153 HOUR), 320000.00, 'available', 'Semanggi Plaza', 'Simpang Lima'),

    -- ==========================================
    -- IN 7 DAYS
    -- ==========================================
    -- Surabaya -> Malang (Premium, 8 seats)
    (23, 5, 5, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 170 HOUR), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 172 HOUR), 110000.00, 'available', 'Stasiun Gubeng', 'Alun-Alun Malang'),
    -- Jakarta -> Bandung (Bus, 40 seats)
    (24, 1, 1, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 172 HOUR), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 175 HOUR), 150000.00, 'available', 'Terminal Kampung Rambutan', 'Terminal Leuwipanjang');

SET FOREIGN_KEY_CHECKS = 1;
