const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { writeAuditLog } = require('../middleware/auditLogger');

// 1. LOGIN USER
const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username dan password wajib diisi.'
        });
    }

    try {
        const sql = 'SELECT * FROM users WHERE username = $1';
        const result = await query(sql, [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah.'
            });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah.'
            });
        }

        // Buat token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, nama: user.nama, role: user.role },
            process.env.JWT_SECRET || 'rahasia_super_aman_rt04_tabungan_2026_xyz',
            { expiresIn: '8h' }
        );

        // Catat log audit LOGIN sukses
        await writeAuditLog(user.id, 'LOGIN', 'users', user.id, null, { username: user.username, role: user.role }, req);

        return res.status(200).json({
            success: true,
            message: 'Login berhasil.',
            token,
            user: {
                id: user.id,
                username: user.username,
                nama: user.nama,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Error saat login:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server saat login.'
        });
    }
};

// 2. GET CURRENT USER PROFILE
const getProfile = async (req, res) => {
    try {
        const sql = 'SELECT id, username, nama, role, created_at FROM users WHERE id = $1';
        const result = await query(sql, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profil petugas tidak ditemukan.'
            });
        }

        return res.status(200).json({
            success: true,
            user: result.rows[0]
        });
    } catch (err) {
        console.error('Error saat mengambil profil:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server saat mengambil profil.'
        });
    }
};

// 3. CHANGE PASSWORD
const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Password lama dan password baru wajib diisi.'
        });
    }

    try {
        // Ambil password hash saat ini
        const selectSql = 'SELECT id, password_hash FROM users WHERE id = $1';
        const selectRes = await query(selectSql, [req.user.id]);

        if (selectRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pengguna tidak ditemukan.'
            });
        }

        const user = selectRes.rows[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Password lama yang Anda masukkan salah.'
            });
        }

        // Hash password baru
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        // Update password di database
        const updateSql = 'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
        await query(updateSql, [newHash, req.user.id]);

        // Catat log audit penggantian password
        await writeAuditLog(req.user.id, 'CHANGE_PASSWORD', 'users', req.user.id, null, null, req);

        return res.status(200).json({
            success: true,
            message: 'Password berhasil diubah.'
        });
    } catch (err) {
        console.error('Error saat mengubah password:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server saat mengubah password.'
        });
    }
};

module.exports = {
    login,
    getProfile,
    changePassword
};
