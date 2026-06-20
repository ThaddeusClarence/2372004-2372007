const assert = require('assert');
const pool = require('../config/pool');
const bookingCodeService = require('../services/bookingCodeService');
const seatAvailability = require('../services/seatAvailability');
const { formatIDR } = require('../utils/format');

// CODE-CITE:
//   Title: TravelGo Automated Test Suite
//   Type: ai
//   Value: Antigravity Gemini
//   Notes: Unit and integration tests for booking codes, IDR formatting, and seat availability.
//   Lines Range: 45
async function runTests() {
    console.log('====================================');
    console.log('Running TravelGo Test Suite...');
    console.log('====================================');

    // 1. Unit Test: Booking Code Generation
    console.log('\n[1/3] Testing Booking Code Generation...');
    const code1 = await bookingCodeService.generateCode();
    const code2 = await bookingCodeService.generateCode();
    
    console.log(`Generated Code 1: ${code1}`);
    console.log(`Generated Code 2: ${code2}`);
    
    assert.match(code1, /^BK[A-Z0-9]{8}$/, 'Code 1 format must match BK[A-Z0-9]{8}');
    assert.match(code2, /^BK[A-Z0-9]{8}$/, 'Code 2 format must match BK[A-Z0-9]{8}');
    assert.notStrictEqual(code1, code2, 'Generated codes must be unique');
    console.log('✓ Booking Code Generation tests passed.');

    // 2. Unit Test: IDR Formatting Helper
    console.log('\n[2/3] Testing IDR Formatting Helper...');
    assert.strictEqual(formatIDR(150000), 'Rp 150.000', 'Should format 150000 to Rp 150.000');
    assert.strictEqual(formatIDR(5000), 'Rp 5.000', 'Should format 5000 to Rp 5.000');
    assert.strictEqual(formatIDR(0), 'Rp 0', 'Should format 0 to Rp 0');
    assert.strictEqual(formatIDR(''), 'Rp 0', 'Should format empty string to Rp 0');
    assert.strictEqual(formatIDR(null), 'Rp 0', 'Should format null to Rp 0');
    assert.strictEqual(formatIDR(undefined), 'Rp 0', 'Should format undefined to Rp 0');
    assert.strictEqual(formatIDR('abc'), 'Rp 0', 'Should format non-numeric string to Rp 0');
    console.log('✓ IDR Formatting Helper tests passed.');

    // 3. Integration Test: Database Seat Availability Query
    console.log('\n[3/3] Testing Database Seat Availability...');
    try {
        const statuses = await seatAvailability.getSeatStatuses(pool, 1);
        assert(Array.isArray(statuses), 'Seat statuses must be returned as an array');
        console.log(`Retrieved seat statuses for schedule 1: [${statuses.join(', ')}]`);
        console.log('✓ Database Seat Availability tests passed.');
    } catch (dbError) {
        console.error('Failed database integration test:', dbError.message);
        throw dbError;
    }

    console.log('\n====================================');
    console.log('All TravelGo tests passed successfully!');
    console.log('====================================');
    
    // Close the DB connection pool so the process can exit
    await pool.end();
    process.exit(0);
}

runTests().catch(err => {
    console.error('\n❌ Test Suite Failed:', err.message);
    pool.end().catch(() => {});
    process.exit(1);
});
