/**
 * Formats a number or string into IDR currency format (e.g. Rp 150.000)
 * @param {number|string} amount 
 * @returns {string}
 */
function formatIDR(amount) {
    if (amount === null || amount === undefined || amount === '') return 'Rp 0';
    const num = Number(amount);
    if (isNaN(num)) return 'Rp 0';
    
    // Add dot as thousands separator
    const formatted = num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `Rp ${formatted}`;
}

module.exports = {
    formatIDR
};
