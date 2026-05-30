const express = require('express');
const router = express.Router();
const pool = require('../config/pool');
const bcrypt = require('bcrypt');

router.get('/', (req, res) => {
    res.render('home', { title: 'TravelGo - Pencarian Jadwal Travel' });
});

router.get('/login-customer', (req, res) => {
    res.render('login-customer', { title: 'Customer Login - TravelGo', error: null });
});

router.get('/login-admin', (req, res) => {
    res.render('login-admin', { title: 'Admin Login - TravelGo', error: null });
});

// POST login admin 窶・actually check database
router.post('/login-admin', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'admin']);
        if (rows.length === 0) {
            return res.render('login-admin', { title: 'Admin Login - TravelGo', error: 'Email tidak ditemukan.' });
        }
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('login-admin', { title: 'Admin Login - TravelGo', error: 'Password salah.' });
        }
        req.session.user = { id: user.id, email: user.email, username: user.username, role: user.role };
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        res.render('login-admin', { title: 'Admin Login - TravelGo', error: 'Terjadi kesalahan server.' });
    }
});

// POST login customer 窶・actually check database
router.post('/login-customer', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'customer']);
        if (rows.length === 0) {
            return res.render('login-customer', { title: 'Customer Login - TravelGo', error: 'Email tidak ditemukan.' });
        }
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('login-customer', { title: 'Customer Login - TravelGo', error: 'Password salah.' });
        }
        req.session.user = { id: user.id, email: user.email, username: user.username, role: user.role };
        res.redirect('/customer');
    } catch (err) {
        console.error(err);
        res.render('login-customer', { title: 'Customer Login - TravelGo', error: 'Terjadi kesalahan server.' });
    }
});

// POST register
router.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const hash = await bcrypt.hash(password, 12);
        await pool.query('INSERT INTO users (email, username, password, role, created_at) VALUES (?,?,?,?,NOW())', [email, username, hash, 'customer']);
        res.redirect('/login-customer');
    } catch (err) {
        console.error(err);
        res.render('register', { title: 'Register - TravelGo', error: 'Registrasi gagal. Email mungkin sudah terdaftar.' });
    }
});



router.get('/register', (req, res) => {
    res.render('register', { title: 'Register - TravelGo', error: null });
});

module.exports = router;
