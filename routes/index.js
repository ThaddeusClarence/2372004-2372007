const express = require('express');
const router = express.Router();
const pool = require('../config/pool');
const bcrypt = require('bcrypt');

router.get('/', (req, res) => {
    res.render('home', { title: 'TravelGo - Pencarian Jadwal Travel' });
});

// CODE-CITE:
//   Title: Unified Login Interface Route
//   Type: ai
//   Value: Antigravity Gemini
//   Notes: Unified login endpoint handling for both admin and customer authentication.
//   Lines Range: 32
router.get('/login', (req, res) => {
    res.render('login', { title: 'Masuk - TravelGo', error: null });
});

router.get('/login-customer', (req, res) => {
    res.redirect('/login');
});

router.get('/login-admin', (req, res) => {
    res.redirect('/login');
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.render('login', { title: 'Masuk - TravelGo', error: 'Email atau password salah.' });
        }
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('login', { title: 'Masuk - TravelGo', error: 'Email atau password salah.' });
        }
        req.session.user = { id: user.id, email: user.email, username: user.username, role: user.role };
        
        if (user.role === 'admin') {
            res.redirect('/admin/dashboard');
        } else {
            res.redirect('/customer');
        }
    } catch (err) {
        console.error(err);
        res.render('login', { title: 'Masuk - TravelGo', error: 'Terjadi kesalahan server.' });
    }
});

// POST register
router.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const hash = await bcrypt.hash(password, 12);
        await pool.query('INSERT INTO users (email, username, password, role, created_at) VALUES (?,?,?,?,NOW())', [email, username, hash, 'customer']);
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.render('register', { title: 'Register - TravelGo', error: 'Registrasi gagal. Email mungkin sudah terdaftar.' });
    }
});



router.get('/register', (req, res) => {
    res.render('register', { title: 'Register - TravelGo', error: null });
});

// CODE-CITE:
//   Title: Session Logout Handler
//   Type: ai
//   Value: Antigravity Gemini
//   Notes: Destroys user session and redirects to homepage.
//   Lines Range: 5
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;
