const ExpirationService = require('../services/expirationService');

async function run() {
    try {
        const count = await ExpirationService.expireStaleBookings();
        console.log(`Expired ${count} stale pending booking(s).`);
        process.exit(0);
    } catch (err) {
        console.error('Expiration failed:', err.message);
        process.exit(1);
    }
}

run();
