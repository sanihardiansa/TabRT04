const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'cinot',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_DATABASE || 'tabungan_rt04',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '5432'),
});

pool.on('connect', () => {
    // Koneksi terjalin sukses
});

pool.on('error', (err) => {
    console.error('Koneksi database PostgreSQL mengalami masalah:', err.message);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
