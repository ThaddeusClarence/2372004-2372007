-- Seed initial routes, vehicles, seats, and schedules to support fresh installations (like Railway)
-- and resolve foreign key constraint failures in subsequent presentation seeds.

-- 1. Seed Routes
INSERT IGNORE INTO routes (route_id, origin_city, destination_city, distance_km, duration) VALUES
(1, 'Jakarta', 'Bandung', 150, '03:00:00'),
(2, 'Bandung', 'Jakarta', 150, '03:00:00'),
(3, 'Jakarta', 'Semarang', 450, '07:00:00'),
(4, 'Semarang', 'Surabaya', 350, '05:30:00'),
(5, 'Surabaya', 'Malang', 90, '02:00:00'),
(6, 'Yogyakarta', 'Semarang', 130, '02:30:00'),
(7, 'Jakarta', 'Yogyakarta', 570, '09:00:00');

-- 2. Seed Vehicles
INSERT IGNORE INTO vehicles (vehicle_id, plate_number, vehicle_type, capacity, status) VALUES
(1, 'B 1234 TGO', 'Bus', 40, 'active'),
(2, 'B 5678 TGO', 'Bus', 40, 'active'),
(3, 'D 9012 TGO', 'Minibus', 16, 'active'),
(4, 'L 3456 TGO', 'Shuttle', 8, 'active'),
(5, 'AB 7890 TGO', 'Shuttle', 8, 'maintenance');

-- 3. Seed Stop Points
INSERT IGNORE INTO stop_points (stop_point_id, name, address, type) VALUES
(1, 'Terminal Pulo Gebang', 'Jl. Raya Bekasi Km. 26, Jakarta Timur', 'pickup'),
(2, 'Terminal Lebak Bulus', 'Jl. Lebak Bulus Raya, Jakarta Selatan', 'pickup'),
(3, 'Terminal Leuwi Panjang', 'Jl. Soekarno Hatta No.205, Bandung', 'dropoff'),
(4, 'Stasiun Hall Bandung', 'Jl. Kebon Kawung No.43, Bandung', 'dropoff'),
(5, 'Terminal Terboyo', 'Jl. Terboyo Industri, Semarang', 'pickup'),
(6, 'Terminal Purabaya (Bungurasih)', 'Jl. Letjen Sutoyo, Waru, Sidoarjo', 'dropoff'),
(7, 'Terminal Giwangan', 'Jl. Imogiri Timur, Yogyakarta', 'pickup'),
(8, 'Terminal Arjosari', 'Jl. Raden Intan, Malang', 'dropoff');

-- 4. Seed Seats
INSERT IGNORE INTO seats (seat_id, vehicle_id, seat_number, seat_class) VALUES
(1, 1, '01', 'VIP'), (2, 1, '02', 'VIP'), (3, 1, '03', 'VIP'), (4, 1, '04', 'VIP'),
(5, 1, '05', 'Regular'), (6, 1, '06', 'Regular'), (7, 1, '07', 'Regular'), (8, 1, '08', 'Regular'), (9, 1, '09', 'Regular'), (10, 1, '10', 'Regular'),
(11, 1, '11', 'Regular'), (12, 1, '12', 'Regular'), (13, 1, '13', 'Regular'), (14, 1, '14', 'Regular'), (15, 1, '15', 'Regular'), (16, 1, '16', 'Regular'),
(17, 1, '17', 'Regular'), (18, 1, '18', 'Regular'), (19, 1, '19', 'Regular'), (20, 1, '20', 'Regular'), (21, 1, '21', 'Regular'), (22, 1, '22', 'Regular'),
(23, 1, '23', 'Regular'), (24, 1, '24', 'Regular'), (25, 1, '25', 'Regular'), (26, 1, '26', 'Regular'), (27, 1, '27', 'Regular'), (28, 1, '28', 'Regular'),
(29, 1, '29', 'Regular'), (30, 1, '30', 'Regular'), (31, 1, '31', 'Regular'), (32, 1, '32', 'Regular'), (33, 1, '33', 'Regular'), (34, 1, '34', 'Regular'),
(35, 1, '35', 'Regular'), (36, 1, '36', 'Regular'), (37, 1, '37', 'Regular'), (38, 1, '38', 'Regular'), (39, 1, '39', 'Regular'), (40, 1, '40', 'Regular');

INSERT IGNORE INTO seats (seat_id, vehicle_id, seat_number, seat_class) VALUES
(41, 2, '01', 'VIP'), (42, 2, '02', 'VIP'), (43, 2, '03', 'VIP'), (44, 2, '04', 'VIP'),
(45, 2, '05', 'Regular'), (46, 2, '06', 'Regular'), (47, 2, '07', 'Regular'), (48, 2, '08', 'Regular'), (49, 2, '09', 'Regular'), (50, 2, '10', 'Regular'),
(51, 2, '11', 'Regular'), (52, 2, '12', 'Regular'), (53, 2, '13', 'Regular'), (54, 2, '14', 'Regular'), (55, 2, '15', 'Regular'), (56, 2, '16', 'Regular'),
(57, 2, '17', 'Regular'), (58, 2, '18', 'Regular'), (59, 2, '19', 'Regular'), (60, 2, '20', 'Regular'), (61, 2, '21', 'Regular'), (62, 2, '22', 'Regular'),
(63, 2, '23', 'Regular'), (64, 2, '24', 'Regular'), (65, 2, '25', 'Regular'), (66, 2, '26', 'Regular'), (67, 2, '27', 'Regular'), (68, 2, '28', 'Regular'),
(69, 2, '29', 'Regular'), (70, 2, '30', 'Regular'), (71, 2, '31', 'Regular'), (72, 2, '32', 'Regular'), (73, 2, '33', 'Regular'), (74, 2, '34', 'Regular'),
(75, 2, '35', 'Regular'), (76, 2, '36', 'Regular'), (77, 2, '37', 'Regular'), (78, 2, '38', 'Regular'), (79, 2, '39', 'Regular'), (80, 2, '40', 'Regular');

INSERT IGNORE INTO seats (seat_id, vehicle_id, seat_number, seat_class) VALUES
(81, 3, '01', 'VIP'), (82, 3, '02', 'VIP'), (83, 3, '03', 'VIP'), (84, 3, '04', 'VIP'),
(85, 3, '05', 'Regular'), (86, 3, '06', 'Regular'), (87, 3, '07', 'Regular'), (88, 3, '08', 'Regular'), (89, 3, '09', 'Regular'), (90, 3, '10', 'Regular'),
(91, 3, '11', 'Regular'), (92, 3, '12', 'Regular'), (93, 3, '13', 'Regular'), (94, 3, '14', 'Regular'), (95, 3, '15', 'Regular'), (96, 3, '16', 'Regular');

INSERT IGNORE INTO seats (seat_id, vehicle_id, seat_number, seat_class) VALUES
(97, 4, '01', 'VIP'), (98, 4, '02', 'VIP'), (99, 4, '03', 'VIP'), (100, 4, '04', 'VIP'),
(101, 4, '05', 'Regular'), (102, 4, '06', 'Regular'), (103, 4, '07', 'Regular'), (104, 4, '08', 'Regular');

INSERT IGNORE INTO seats (seat_id, vehicle_id, seat_number, seat_class) VALUES
(105, 5, '01', 'VIP'), (106, 5, '02', 'VIP'), (107, 5, '03', 'VIP'), (108, 5, '04', 'VIP'),
(109, 5, '05', 'Regular'), (110, 5, '06', 'Regular'), (111, 5, '07', 'Regular'), (112, 5, '08', 'Regular');

-- 5. Seed Schedules (Matching IDs and future dates referenced by later seeds)
INSERT IGNORE INTO schedules (schedule_id, route_id, vehicle_id, departure_time, arrival_estimate, price, status, pickup_point, dropoff_point) VALUES
(1, 1, 1, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 DAY), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 51 HOUR), 150000.00, 'available', NULL, NULL),
(2, 1, 3, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 DAY), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 51 HOUR), 120000.00, 'available', NULL, NULL),
(3, 2, 2, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 DAY), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 51 HOUR), 150000.00, 'available', NULL, NULL),
(4, 3, 1, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 3 DAY), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 74 HOUR), 300000.00, 'available', NULL, NULL),
(5, 4, 3, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 3 DAY), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 74 HOUR), 200000.00, 'available', NULL, NULL),
(6, 5, 4, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 3 DAY), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 74 HOUR), 75000.00, 'available', NULL, NULL),
(7, 6, 2, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 4 DAY), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 105 HOUR), 100000.00, 'available', NULL, NULL),
(8, 7, 1, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 4 DAY), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 105 HOUR), 350000.00, 'available', NULL, NULL);
