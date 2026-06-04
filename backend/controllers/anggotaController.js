const { query } = require('../config/db');
const { writeAuditLog } = require('../middleware/auditLogger');

// 1. GET ALL ANGGOTA (dengan Pencarian)
const getAllAnggota = async (req, res) => {
    const { search } = req.query;
    try {
        let sql = 'SELECT * FROM anggota';
        const params = [];

        if (search) {
            sql += ' WHERE no_anggota ILIKE $1 OR nama ILIKE $1 OR alamat ILIKE $1';
            params.push(`%${search}%`);
        }

        sql += ' ORDER BY no_anggota ASC';
        
        const result = await query(sql, params);
        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error saat mengambil data anggota:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data anggota dari server.'
        });
    }
};

// 2. GET ANGGOTA BY ID
const getAnggotaById = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = 'SELECT * FROM anggota WHERE id = $1';
        const result = await query(sql, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data anggota tidak ditemukan.'
            });
        }

        // Ambil riwayat transaksi anggota ini juga
        const trxSql = 'SELECT * FROM transaksi WHERE anggota_id = $1 ORDER BY tanggal DESC LIMIT 10';
        const trxResult = await query(trxSql, [id]);

        return res.status(200).json({
            success: true,
            data: {
                ...result.rows[0],
                recent_transactions: trxResult.rows
            }
        });
    } catch (err) {
        console.error('Error saat mengambil detail anggota:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil detail anggota dari server.'
        });
    }
};

// Helper untuk generate no_anggota otomatis (Format: RT04-XXX)
const generateNoAnggota = async () => {
    const sql = `
        SELECT MAX(CAST(SUBSTRING(no_anggota FROM 6) AS INTEGER)) as max_num 
        FROM anggota 
        WHERE no_anggota LIKE 'RT04-%'
    `;
    const res = await query(sql);
    const maxNum = res.rows[0].max_num || 0;
    const nextNum = maxNum + 1;
    // Format pad left zero: 001, 002, dst
    const suffix = nextNum.toString().padStart(3, '0');
    return `RT04-${suffix}`;
};

// 3. CREATE ANGGOTA (Tambah Anggota Baru)
const createAnggota = async (req, res) => {
    const { nama, alamat, no_hp } = req.body;

    if (!nama) {
        return res.status(400).json({
            success: false,
            message: 'Nama anggota wajib diisi.'
        });
    }

    try {
        const no_anggota = await generateNoAnggota();
        const sql = `
            INSERT INTO anggota (no_anggota, nama, alamat, no_hp, saldo)
            VALUES ($1, $2, $3, $4, 0.00)
            RETURNING *
        `;
        const result = await query(sql, [no_anggota, nama, alamat, no_hp]);
        const newAnggota = result.rows[0];

        // Tulis Audit Log
        await writeAuditLog(req.user.id, 'CREATE', 'anggota', newAnggota.id, null, newAnggota, req);

        return res.status(201).json({
            success: true,
            message: 'Anggota baru berhasil ditambahkan.',
            data: newAnggota
        });
    } catch (err) {
        console.error('Error saat menambahkan anggota:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Gagal menambahkan data anggota baru ke server.'
        });
    }
};

// 4. UPDATE ANGGOTA
const updateAnggota = async (req, res) => {
    const { id } = req.params;
    const { nama, alamat, no_hp, is_active } = req.body;

    if (!nama) {
        return res.status(400).json({
            success: false,
            message: 'Nama anggota wajib diisi.'
        });
    }

    try {
        // Ambil data sebelum diupdate
        const beforeRes = await query('SELECT * FROM anggota WHERE id = $1', [id]);
        if (beforeRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data anggota tidak ditemukan.'
            });
        }
        const beforeState = beforeRes.rows[0];

        // Lakukan update
        const sql = `
            UPDATE anggota 
            SET nama = $1, alamat = $2, no_hp = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
        `;
        const result = await query(sql, [nama, alamat, no_hp, is_active !== undefined ? is_active : true, id]);
        const afterState = result.rows[0];

        // Tulis Audit Log
        await writeAuditLog(req.user.id, 'UPDATE', 'anggota', id, beforeState, afterState, req);

        return res.status(200).json({
            success: true,
            message: 'Data anggota berhasil diperbarui.',
            data: afterState
        });
    } catch (err) {
        console.error('Error saat memperbarui anggota:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Gagal memperbarui data anggota.'
        });
    }
};

// 5. DELETE ANGGOTA
const deleteAnggota = async (req, res) => {
    const { id } = req.params;

    try {
        // Cek data sebelum didelete
        const beforeRes = await query('SELECT * FROM anggota WHERE id = $1', [id]);
        if (beforeRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data anggota tidak ditemukan.'
            });
        }
        const beforeState = beforeRes.rows[0];

        // Verifikasi integritas data: Cek apakah anggota sudah memiliki transaksi tabungan
        const checkTrx = await query('SELECT COUNT(*) FROM transaksi WHERE anggota_id = $1', [id]);
        const countTrx = parseInt(checkTrx.rows[0].count);

        if (countTrx > 0) {
            return res.status(400).json({
                success: false,
                message: 'Anggota tidak dapat dihapus karena sudah memiliki riwayat transaksi setoran/penarikan. Anda dapat menonaktifkan status anggota saja.'
            });
        }

        // Lakukan delete
        await query('DELETE FROM anggota WHERE id = $1', [id]);

        // Tulis Audit Log
        await writeAuditLog(req.user.id, 'DELETE', 'anggota', id, beforeState, null, req);

        return res.status(200).json({
            success: true,
            message: 'Data anggota berhasil dihapus.'
        });
    } catch (err) {
        console.error('Error saat menghapus anggota:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Gagal menghapus data anggota dari server.'
        });
    }
};

module.exports = {
    getAllAnggota,
    getAnggotaById,
    createAnggota,
    updateAnggota,
    deleteAnggota
};
