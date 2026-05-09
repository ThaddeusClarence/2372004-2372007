<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>TravelGo - Authentication</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
        
        <!-- Lucide Icons -->
        <script src="https://unpkg.com/lucide@latest"></script>

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])

        <style>
            :root {
                --primary: #FF5A5F;
                --dark: #1A1A1A;
                --white: #FFFFFF;
                --glass: rgba(255, 255, 255, 0.9);
            }

            body {
                font-family: 'Outfit', sans-serif;
                margin: 0;
                padding: 0;
            }

            .auth-wrapper {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/images/hero.png');
                background-size: cover;
                background-position: center;
                padding: 2rem;
            }

            .auth-card {
                width: 100%;
                max-width: 450px;
                background: var(--glass);
                backdrop-filter: blur(10px);
                padding: 3rem;
                border-radius: 32px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                animation: fadeInUp 0.8s ease-out;
            }

            .logo-wrapper {
                margin-bottom: 2.5rem;
                text-align: center;
            }

            .logo {
                font-size: 2.5rem;
                font-weight: 700;
                color: var(--dark);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                text-decoration: none;
            }

            .logo span {
                color: var(--primary);
            }

            /* Customizing Breeze Components */
            input {
                border-radius: 12px !important;
                border: 1px solid #ddd !important;
                padding: 0.75rem 1rem !important;
                transition: all 0.3s !important;
            }

            input:focus {
                border-color: var(--primary) !important;
                ring: 2px var(--primary) !important;
            }

            button[type="submit"] {
                background-color: var(--primary) !important;
                border-radius: 12px !important;
                padding: 0.75rem !important;
                font-weight: 600 !important;
                text-transform: none !important;
                letter-spacing: normal !important;
                transition: all 0.3s !important;
            }

            button[type="submit"]:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(255, 90, 95, 0.4);
            }

            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        </style>
    </head>
    <body>
        <div class="auth-wrapper">
            <!-- Back Button -->
            <a href="/" class="back-btn" style="position: absolute; top: 2rem; left: 2rem; display: flex; align-items: center; gap: 0.5rem; color: white; text-decoration: none; font-weight: 600; background: rgba(255,255,255,0.1); padding: 0.75rem 1.5rem; border-radius: 50px; backdrop-filter: blur(10px); transition: all 0.3s;">
                <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
                Kembali ke Beranda
            </a>

            <div class="logo-wrapper">
                <a href="/" class="logo">
                    <i data-lucide="bus" style="width: 32px; height: 32px; color: var(--primary)"></i>
                    Travel<span>Go</span>
                </a>
            </div>

            <div class="auth-card">
                {{ $slot }}
            </div>
        </div>

        <script>
            lucide.createIcons();
        </script>
    </body>
</html>
