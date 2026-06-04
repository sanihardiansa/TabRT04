const jwt = require('jsonwebtoken');

// Middleware untuk memverifikasi token JWT
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Akses ditolak. Token autentikasi tidak ditemukan.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia_super_aman_rt04_tabungan_2026_xyz');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: 'Token tidak valid atau telah kedaluwarsa.'
        });
    }
};

// Middleware untuk memeriksa role admin
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Hak akses Administrator diperlukan.'
        });
    }
    next();
};

module.exports = {
    verifyToken,
    requireAdmin
};
