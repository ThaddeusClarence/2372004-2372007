<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>TravelGo - Jasa Travel Antar Kota Terpercaya</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        :root {
            --primary: #FF5A5F;
            --secondary: #008489;
            --dark: #1A1A1A;
            --light: #F7F7F7;
            --white: #FFFFFF;
            --glass: rgba(255, 255, 255, 0.1);
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Outfit', sans-serif;
        }

        body {
            background-color: var(--light);
            color: var(--dark);
            overflow-x: hidden;
        }

        /* Hero Section */
        .hero {
            height: 100vh;
            width: 100%;
            background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('/images/hero.png');
            background-size: cover;
            background-position: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            position: relative;
        }

        /* Navigation */
        nav {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            padding: 1.5rem 4rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 100;
            background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
        }

        .logo {
            font-size: 2rem;
            font-weight: 700;
            color: var(--white);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .logo span {
            color: var(--primary);
        }

        .nav-links {
            display: flex;
            gap: 2rem;
            align-items: center;
        }

        .nav-links a {
            color: var(--white);
            text-decoration: none;
            font-weight: 500;
            transition: var(--transition);
        }

        .nav-links a:hover {
            color: var(--primary);
        }

        .btn-login {
            background: var(--white);
            color: var(--dark) !important;
            padding: 0.75rem 1.5rem;
            border-radius: 50px;
            font-weight: 600 !important;
        }

        .btn-register {
            background: var(--primary);
            color: var(--white) !important;
            padding: 0.75rem 1.5rem;
            border-radius: 50px;
            font-weight: 600 !important;
        }

        /* Hero Content */
        .hero-content {
            text-align: center;
            color: var(--white);
            max-width: 800px;
            animation: fadeInUp 1s ease-out;
        }

        .hero-content h1 {
            font-size: 4rem;
            margin-bottom: 1.5rem;
            line-height: 1.1;
        }

        .hero-content p {
            font-size: 1.2rem;
            margin-bottom: 3rem;
            opacity: 0.9;
        }

        /* Search Bar */
        .search-container {
            background: var(--white);
            padding: 1rem;
            border-radius: 100px;
            display: flex;
            align-items: center;
            width: 100%;
            max-width: 900px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            gap: 1rem;
        }

        .search-group {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.5rem 1.5rem;
            border-right: 1px solid #eee;
        }

        .search-group:last-child {
            border-right: none;
        }

        .search-group input {
            border: none;
            outline: none;
            font-size: 1rem;
            width: 100%;
            background: transparent;
        }

        .search-btn {
            background: var(--primary);
            color: var(--white);
            border: none;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--transition);
        }

        .search-btn:hover {
            transform: scale(1.05);
            background: #e04a4e;
        }

        /* Features Section */
        .section {
            padding: 6rem 4rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        .section-header {
            text-align: center;
            margin-bottom: 4rem;
        }

        .section-header h2 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }

        .section-header p {
            color: #666;
            font-size: 1.1rem;
        }

        .destinations {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }

        .dest-card {
            background: var(--white);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 20px rgba(0,0,0,0.05);
            transition: var(--transition);
            cursor: pointer;
            position: relative;
        }

        .dest-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .dest-img {
            height: 250px;
            width: 100%;
            background-size: cover;
            background-position: center;
            transition: var(--transition);
        }

        .dest-card:hover .dest-img {
            transform: scale(1.1);
        }

        .dest-info {
            padding: 1.5rem;
        }

        .dest-info h3 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }

        .dest-info p {
            color: #666;
            font-size: 0.95rem;
        }

        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Responsive */
        @media (max-width: 768px) {
            nav { padding: 1.5rem 2rem; }
            .hero-content h1 { font-size: 2.5rem; }
            .search-container {
                flex-direction: column;
                border-radius: 24px;
                padding: 1.5rem;
            }
            .search-group {
                border-right: none;
                border-bottom: 1px solid #eee;
                width: 100%;
                padding: 1rem 0;
            }
            .search-btn {
                width: 100%;
                border-radius: 12px;
                margin-top: 1rem;
            }
            .section { padding: 4rem 2rem; }
        }
    </style>
</head>
<body>

    <nav>
        <div class="logo">
            <i data-lucide="bus"></i>
            Travel<span>Go</span>
        </div>
        <div class="nav-links">
            <a href="#">Jadwal</a>
            <a href="#">Rute</a>
            @if (Route::has('login'))
                @auth
                    <a href="{{ url('/dashboard') }}" class="btn-login">Dashboard</a>
                @else
                    <a href="{{ route('login') }}" class="btn-login">Masuk</a>
                    @if (Route::has('register'))
                        <a href="{{ route('register') }}" class="btn-register">Daftar</a>
                    @endif
                @endauth
            @endif
        </div>
    </nav>

    <section class="hero">
        <div class="hero-content">
            <h1>Perjalanan Nyaman,<br>Pemesanan Instan.</h1>
            <p>Nikmati kemudahan reservasi travel antar kota secara online. Pilih kursi, bayar digital, dan berangkat tanpa ribet.</p>
            
            <div class="search-container">
                <div class="search-group">
                    <i data-lucide="map-pin" style="color: var(--primary)"></i>
                    <input type="text" placeholder="Asal Kota" value="Jakarta">
                </div>
                <div class="search-group">
                    <i data-lucide="navigation" style="color: var(--primary)"></i>
                    <input type="text" placeholder="Kota Tujuan" value="Bandung">
                </div>
                <div class="search-group">
                    <i data-lucide="calendar" style="color: var(--primary)"></i>
                    <input type="text" placeholder="Tanggal Pergi" onfocus="(this.type='date')">
                </div>
                <button class="search-btn">
                    <i data-lucide="search"></i>
                </button>
            </div>
        </div>
    </section>

    <section class="section">
        <div class="section-header">
            <h2>Rute Populer</h2>
            <p>Destinasi paling sering dikunjungi oleh para pelanggan setia kami.</p>
        </div>

        <div class="destinations">
            <div class="dest-card">
                <div class="dest-img" style="background-image: url('/images/jakarta.png')"></div>
                <div class="dest-info">
                    <h3>Jakarta - Bandung</h3>
                    <p>Mulai dari Rp 150.000 • Tiap 2 Jam</p>
                </div>
            </div>
            <div class="dest-card">
                <div class="dest-img" style="background-image: url('/images/bandung.png')"></div>
                <div class="dest-info">
                    <h3>Bandung - Jakarta</h3>
                    <p>Mulai dari Rp 150.000 • Tiap 2 Jam</p>
                </div>
            </div>
            <div class="dest-card">
                <div class="dest-img" style="background-image: url('https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&q=80&w=800')"></div>
                <div class="dest-info">
                    <h3>Yogyakarta - Solo</h3>
                    <p>Mulai dari Rp 85.000 • Tiap 1 Jam</p>
                </div>
            </div>
        </div>
    </section>

    <section class="section" style="background: var(--dark); color: var(--white); border-radius: 40px; margin: 4rem auto; max-width: 1300px;">
        <div style="display: flex; flex-wrap: wrap; gap: 4rem; align-items: center; justify-content: center;">
            <div style="flex: 1; min-width: 300px;">
                <h2 style="font-size: 2.5rem; margin-bottom: 2rem;">Kenapa Memilih TravelGo?</h2>
                <div style="display: grid; gap: 2rem;">
                    <div style="display: flex; gap: 1rem;">
                        <i data-lucide="check-circle" style="color: var(--primary)"></i>
                        <div>
                            <h4>Real-time Seat Selection</h4>
                            <p style="opacity: 0.7">Pilih kursi favoritmu langsung dari sistem saat melakukan pemesanan.</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <i data-lucide="shield-check" style="color: var(--primary)"></i>
                        <div>
                            <h4>Pembayaran Aman</h4>
                            <p style="opacity: 0.7">Mendukung berbagai metode pembayaran digital yang terjamin keamanannya.</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <i data-lucide="clock" style="color: var(--primary)"></i>
                        <div>
                            <h4>Tepat Waktu</h4>
                            <p style="opacity: 0.7">Komitmen kami adalah menghadirkan jadwal perjalanan yang akurat dan tepat waktu.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div style="flex: 1; min-width: 300px; text-align: center;">
                <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800" style="width: 100%; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            </div>
        </div>
    </section>

    <footer style="padding: 4rem; background: #eee; text-align: center;">
        <div class="logo" style="color: var(--dark); justify-content: center; margin-bottom: 2rem;">
            <i data-lucide="bus"></i>
            Travel<span>Go</span>
        </div>
        <p style="color: #666;">&copy; 2026 TravelGo. Semua hak cipta dilindungi undang-undang.</p>
    </footer>

    <script>
        // Initialize Lucide icons
        lucide.createIcons();
    </script>
</body>
</html>
