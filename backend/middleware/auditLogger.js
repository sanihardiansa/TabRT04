const { query } = require('../config/db');

/**
 * Mencatat log audit ke database PostgreSQL secara asinkron
 * @param {string|null} userId - ID pengguna yang melakukan tindakan
 * @param {string} action - Jenis tindakan (e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN')
 * @param {string} tableName - Nama tabel database yang diubah
 * @param {string} recordId - ID record/baris yang dikenai tindakan
 * @param {object|null} beforeState - Kondisi data sebelum diubah (JSON/Object)
 * @param {object|null} afterState - Kondisi data setelah diubah (JSON/Object)
 * @param {object|null} req - Objek request Express untuk menangkap IP dan User Agent
 */
const writeAuditLog = async (userId, action, tableName, recordId, beforeState = null, afterState = null, req = null) => {
    try {
        let ipAddress = '127.0.0.1';
        let userAgent = 'Unknown';

        if (req) {
            ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1';
            userAgent = req.headers['user-agent'] || 'Unknown';
        }

        const sql = `
            INSERT INTO audit_log (user_id, action, table_name, record_id, before_state, after_state, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        await query(sql, [
            userId || null,
            action,
            tableName,
            recordId.toString(),
            beforeState ? JSON.stringify(beforeState) : null,
            afterState ? JSON.stringify(afterState) : null,
            ipAddress,
            userAgent
        ]);
    } catch (err) {
        console.error('Gagal mencatat log audit ke database:', err.message);
    }
};

module.exports = {
    writeAuditLog
};
