# Dokumentasi Database TravelGo

Dokumen ini berisi informasi mengenai struktur database yang digunakan dalam proyek **TravelGo**.

**Nama Database:** `travelgo`

---

## Daftar Tabel dan Kolom

### 1. `users` (Manajemen Pengguna)
Tabel standar Laravel untuk autentikasi dengan tambahan kolom role.
- `id`: Primary Key
- `name`: Nama lengkap
- `email`: Alamat email (unique)
- `password`: Password (hashed)
- `role`: Peran pengguna (`admin` atau `customer`)
- `created_at` / `updated_at`: Timestamp

### 2. `vehicles` (Armada/Kendaraan)
Menyimpan data kendaraan yang tersedia.
- `id`: Primary Key
- `name`: Nama kendaraan (misal: "XTrans Luxury")
- `type`: Tipe kendaraan (misal: "Bus", "Hiace", "Van")
- `capacity`: Kapasitas jumlah kursi (integer)
- `license_plate`: Nomor plat kendaraan
- `created_at` / `updated_at`: Timestamp

### 3. `routes` (Rute Perjalanan)
Menyimpan rute asal dan tujuan.
- `id`: Primary Key
- `origin`: Kota asal
- `destination`: Kota tujuan
- `distance`: Jarak dalam kilometer (decimal/float)
- `created_at` / `updated_at`: Timestamp

### 4. `schedules` (Jadwal Keberangkatan)
Menghubungkan kendaraan dengan rute dan waktu.
- `id`: Primary Key
- `vehicle_id`: Foreign Key ke `vehicles`
- `route_id`: Foreign Key ke `routes`
- `departure_time`: Waktu keberangkatan (datetime)
- `arrival_time`: Perkiraan waktu sampai (datetime)
- `price`: Harga tiket per kursi (decimal/numeric)
- `created_at` / `updated_at`: Timestamp

### 5. `bookings` (Reservasi Utama)
Data transaksi pemesanan oleh user.
- `id`: Primary Key
- `user_id`: Foreign Key ke `users`
- `schedule_id`: Foreign Key ke `schedules`
- `booking_code`: Kode unik booking (misal: TG-XXXXX)
- `total_price`: Total harga yang harus dibayar
- `status`: Status booking (`pending`, `confirmed`, `cancelled`, `completed`)
- `payment_status`: Status pembayaran (`unpaid`, `paid`, `refunded`)
- `created_at` / `updated_at`: Timestamp

### 6. `booking_details` (Detail Kursi Booking)
Menyimpan nomor kursi yang dipilih dalam satu booking.
- `id`: Primary Key
- `booking_id`: Foreign Key ke `bookings`
- `seat_number`: Nomor kursi yang dipilih (integer)
- `created_at` / `updated_at`: Timestamp

### 7. `stop_points` (Titik Jemput/Turun)
Lokasi spesifik untuk menaikkan/menurunkan penumpang.
- `id`: Primary Key
- `name`: Nama lokasi (misal: "Terminal Leuwi Panjang")
- `address`: Alamat lengkap
- `type`: Tipe lokasi (`pickup` atau `dropoff`)
- `created_at` / `updated_at`: Timestamp

---

**Catatan untuk Tim:**
Pastikan saat membuat tabel secara manual di phpMyAdmin, nama tabel menggunakan format **jamak (plural)** seperti di atas agar sesuai dengan konvensi Eloquent Model di Laravel.
