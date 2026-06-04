const { query, pool } = require('../config/db');
const { writeAuditLog } = require('../middleware/auditLogger');

// 1. TAMBAH TRANSAKSI SETORAN
const createSetoran = async (req, res) => {
    const { anggota_id, jumlah, keterangan } = req.body;

    if (!anggota_id || !jumlah || jumlah <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID Anggota dan Jumlah Setoran valid wajib diisi.'
        });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Lock dan ambil data anggota saat ini untuk mencegah race-condition (SELECT FOR UPDATE)
        const selectSql = 'SELECT * FROM anggota WHERE id = $1 FOR UPDATE';
        const selectRes = await client.query(selectSql, [anggota_id]);

        if (selectRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Anggota tidak ditemukan.'
            });
        }

        const anggota = selectRes.rows[0];

        // 2. Verifikasi status keaktifan anggota
        if (!anggota.is_active) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Transaksi ditolak. Status tabungan anggota dalam keadaan tidak aktif.'
            });
        }

        // 3. Masukkan record transaksi setoran
        const trxSql = `
            INSERT INTO transaksi (anggota_id, jenis, jumlah, keterangan, petugas_id)
            VALUES ($1, 'setoran', $2, $3, $4)
            RETURNING *
        `;
        const trxRes = await client.query(trxSql, [anggota_id, jumlah, keterangan || 'Setoran Tabungan', req.user.id]);
        const newTrx = trxRes.rows[0];

        // 4. Update saldo anggota
        const updateSql = `
            UPDATE anggota 
            SET saldo = saldo + $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        const updateRes = await client.query(updateSql, [jumlah, anggota_id]);
        const updatedAnggota = updateRes.rows[0];

        await client.query('COMMIT');

        // Tulis Audit Log
        await writeAuditLog(req.user.id, 'CREATE', 'transaksi', newTrx.id, null, newTrx, req);
        await writeAuditLog(req.user.id, 'UPDATE_BALANCE', 'anggota', anggota_id, { saldo: anggota.saldo }, { saldo: updatedAnggota.saldo }, req);

        return res.status(201).json({
            success: true,
            message: 'Setoran berhasil disimpan.',
            data: {
                transaksi: newTrx,
                anggota: {
                    nama: updatedAnggota.nama,
                    no_anggota: updatedAnggota.no_anggota,
                    saldo_baru: updatedAnggota.saldo
                }
            }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error saat melakukan setoran:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Gagal memproses setoran tabungan pada server.'
        });
    } finally {
        client.release();
    }
};

// 2. TAMBAH TRANSAKSI PENARIKAN
const createPenarikan = async (req, res) => {
    const { anggota_id, jumlah, keterangan } = req.body;

    if (!anggota_id || !jumlah || jumlah <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID Anggota dan Jumlah Penarikan valid wajib diisi.'
        });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Lock dan ambil data anggota saat ini untuk mencegah race-condition (SELECT FOR UPDATE)
        const selectSql = 'SELECT * FROM anggota WHERE id = $1 FOR UPDATE';
        const selectRes = await client.query(selectSql, [anggota_id]);

        if (selectRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Anggota tidak ditemukan.'
            });
        }

        const anggota = selectRes.rows[0];

        // 2. Verifikasi status keaktifan anggota
        if (!anggota.is_active) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Transaksi ditolak. Status tabungan anggota dalam keadaan tidak aktif.'
            });
        }

        // 3. Verifikasi kecukupan saldo tabungan
        const saldoSaatIni = parseFloat(anggota.saldo);
        const jumlahTarik = parseFloat(jumlah);

        if (saldoSaatIni < jumlahTarik) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `Transaksi ditolak. Saldo tidak mencukupi. Saldo saat ini: Rp ${saldoSaatIni.toLocaleString('id-ID')}`
            });
        }

        // 4. Masukkan record transaksi penarikan
        const trxSql = `
            INSERT INTO transaksi (anggota_id, jenis, jumlah, keterangan, petugas_id)
            VALUES ($1, 'penarikan', $2, $3, $4)
            RETURNING *
        `;
        const trxRes = await client.query(trxSql, [anggota_id, jumlah, keterangan || 'Penarikan Tabungan', req.user.id]);
        const newTrx = trxRes.rows[0];

        // 5. Update saldo anggota
        const updateSql = `
            UPDATE anggota 
            SET saldo = saldo - $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        const updateRes = await client.query(updateSql, [jumlah, anggota_id]);
        const updatedAnggota = updateRes.rows[0];

        await client.query('COMMIT');

        // Tulis Audit Log
        await writeAuditLog(req.user.id, 'CREATE', 'transaksi', newTrx.id, null, newTrx, req);
        await writeAuditLog(req.user.id, 'UPDATE_BALANCE', 'anggota', anggota_id, { saldo: anggota.saldo }, { saldo: updatedAnggota.saldo }, req);

        return res.status(201).json({
            success: true,
            message: 'Penarikan berhasil disimpan.',
            data: {
                transaksi: newTrx,
                anggota: {
                    nama: updatedAnggota.nama,
                    no_anggota: updatedAnggota.no_anggota,
                    saldo_baru: updatedAnggota.saldo
                }
            }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error saat melakukan penarikan:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Gagal memproses penarikan tabungan pada server.'
        });
    } finally {
        client.release();
    }
};

// 3. BATALKAN/HAPUS TRANSAKSI (Hanya untuk Admin - Reversal Logis)
const deleteTransaksi = async (req, res) => {
    const { id } = req.params;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Ambil data transaksi yang ingin dihapus
        const trxSql = 'SELECT * FROM transaksi WHERE id = $1';
        const trxRes = await client.query(trxSql, [id]);

        if (trxRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Transaksi tidak ditemukan.'
            });
        }

        const trx = trxRes.rows[0];
        const { anggota_id, jenis, jumlah } = trx;

        // 2. Lock data anggota (SELECT FOR UPDATE)
        const selectSql = 'SELECT * FROM anggota WHERE id = $1 FOR UPDATE';
        const selectRes = await client.query(selectSql, [anggota_id]);

        if (selectRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Anggota dari transaksi ini tidak ditemukan.'
            });
        }

        const anggota = selectRes.rows[0];
        const saldoSaatIni = parseFloat(anggota.saldo);
        const jumlahTrx = parseFloat(jumlah);

        let saldoBaru = saldoSaatIni;

        // 3. Kalkulasi pengembalian saldo (Reversal Math)
        if (jenis === 'setoran') {
            // Jika setoran dibatalkan, kurangi saldo anggota.
            // Pastikan saldo tidak menjadi negatif.
            if (saldoSaatIni < jumlahTrx) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Transaksi setoran tidak dapat dibatalkan karena saldo anggota saat ini sudah lebih kecil dari jumlah setoran tersebut.'
                });
            }
            saldoBaru = saldoSaatIni - jumlahTrx;
        } else if (jenis === 'penarikan') {
            // Jika penarikan dibatalkan, kembalikan saldo anggota.
            saldoBaru = saldoSaatIni + jumlahTrx;
        }

        // 4. Hapus data transaksi
        await client.query('DELETE FROM transaksi WHERE id = $1', [id]);

        // 5. Update saldo anggota
        const updateSql = `
            UPDATE anggota 
            SET saldo = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 
            RETURNING *
        `;
        const updateRes = await client.query(updateSql, [saldoBaru, anggota_id]);
        const updatedAnggota = updateRes.rows[0];

        await client.query('COMMIT');

        // Tulis Audit Log
        await writeAuditLog(req.user.id, 'DELETE', 'transaksi', id, trx, null, req);
        await writeAuditLog(req.user.id, 'REVERSAL_BALANCE', 'anggota', anggota_id, { saldo: anggota.saldo }, { saldo: updatedAnggota.saldo }, req);

        return res.status(200).json({
            success: true,
            message: 'Transaksi berhasil dibatalkan dan saldo telah disesuaikan.',
            data: {
                saldo_akhir: updatedAnggota.saldo
            }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error saat membatalkan transaksi:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Gagal membatalkan transaksi pada server.'
        });
    } finally {
        client.release();
    }
};

module.exports = {
    createSetoran,
    createPenarikan,
    deleteTransaksi
};
