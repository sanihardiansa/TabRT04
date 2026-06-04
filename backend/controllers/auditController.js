const { query } = require('../config/db');

// 1. GET ALL AUDIT LOGS (Hanya untuk Admin)
const getAuditLogs = async (req, res) => {
    const { action, table_name, limit = 50, offset = 0 } = req.query;

    try {
        let sql = `
            SELECT 
                a.id, a.action, a.table_name, a.record_id, 
                a.before_state, a.after_state, a.ip_address, 
                a.user_agent, a.created_at,
                u.username, u.nama as nama_petugas
            FROM audit_log a
            LEFT JOIN users u ON a.user_id = u.id
        `;
        const params = [];
        const conditions = [];

        if (action) {
            params.push(action);
            conditions.push(`a.action = $${params.length}`);
        }

        if (table_name) {
            params.push(table_name);
            conditions.push(`a.table_name = $${params.length}`);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY a.created_at DESC';

        // Add Limit and Offset safely
        params.push(parseInt(limit));
        sql += ` LIMIT $${params.length}`;

        params.push(parseInt(offset));
        sql += ` OFFSET $${params.length}`;

        const result = await query(sql, params);

        // Hitung total record untuk pagination
        let countSql = 'SELECT COUNT(*) FROM audit_log a';
        const countParams = params.slice(0, params.length - 2); // Exclude limit & offset
        if (conditions.length > 0) {
            countSql += ' WHERE ' + conditions.join(' AND ');
        }
        const countRes = await query(countSql, countParams);
        const totalLogs = parseInt(countRes.rows[0].count);

        return res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                total: totalLogs,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (err) {
        console.error('Error saat mengambil audit log:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data log audit dari server.'
        });
    }
};

module.exports = {
    getAuditLogs
};
