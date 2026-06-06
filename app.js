const express = require('express');
const path = require('path');
const session = require('express-session');
const { loadEnv } = require('./utils/env');
loadEnv();
const app = express();

const port = process.env.PORT || 3000;

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'travelgo-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Routes
const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const customerRouter = require('./routes/customer');
app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/customer', customerRouter);

// Socket.IO
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
app.set('io', io);

io.on('connection', (socket) => {
    console.log('Client connected');
});

// Periodic expiration of stale pending bookings (every 60 seconds)
const ExpirationService = require('./services/expirationService');
setInterval(async () => {
    try {
        const count = await ExpirationService.expireStaleBookings();
        if (count > 0) console.log(`[auto-expire] Expired ${count} stale pending booking(s).`);
    } catch (err) {
        console.error('[auto-expire] Error:', err.message);
    }
}, 60 * 1000);

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
