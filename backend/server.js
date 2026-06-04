const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const anggotaRoutes = require('./routes/anggotaRoutes');
const transaksiRoutes = require('./routes/transaksiRoutes');
const laporanRoutes = require('./routes/laporanRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// ==========================================
// 1. PENGAMANAN & MIDDLEWARE (BEST PRACTICES)
// ==========================================

// Helmet untuk mengamankan HTTP headers dari serangan umum
app.use(helmet());

// Konfigurasi CORS (Cross-Origin Resource Sharing) yang aman
app.use(cors({
    origin: '*', // Pada tahap produksi, ganti dengan domain frontend yang diizinkan saja
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiter untuk membatasi DDoS / Brute Force (maksimal 150 request per 15 menit per IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 150,
    message: {
        success: false,
        message: 'Terlalu banyak permintaan dari IP Anda. Silakan coba kembali dalam 15 menit.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Logging request HTTP
app.use(morgan('dev'));

// Parsing request body JSON & URL Encoded secara aman dengan batasan ukuran payload
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ==========================================
// 2. PEMETAAN RUTE API
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/anggota', anggotaRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/audit', auditRoutes);

// Rute uji coba status server
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server Tabungan RT 04 berjalan normal.',
        timestamp: new Date()
    });
});

// ==========================================
// 3. PENANGANAN ERROR & RUTE NOT FOUND
// ==========================================

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Endpoint '${req.originalUrl}' tidak ditemukan.`
    });
});

// Global Error Handler (Menyembunyikan stack trace di production untuk keamanan)
app.use((err, req, res, next) => {
    console.error('❌ Terjadi kesalahan tidak terduga:', err);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Terjadi masalah pada server. Silakan hubungi Administrator.' 
            : err.message || 'Kesalahan Server Internal.'
    });
});

// ==========================================
// 4. MEMULAI SERVER EXPRESS
// ==========================================
app.listen(PORT, () => {
    console.log(`\n🚀 Server Tabungan RT 04 berhasil dijalankan!`);
    console.log(`📡 URL API: http://localhost:${PORT}`);
    console.log(`🛡️  Fitur keamanan aktif: Helmet, Rate Limiter, CORS, Input Size Limit.`);
    console.log(`🔧 Mode: ${process.env.NODE_ENV || 'development'}\n`);
});
