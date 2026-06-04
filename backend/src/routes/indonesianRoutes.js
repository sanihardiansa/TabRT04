import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, getClient } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLogger.js';

const router = express.Router();

// Semua endpoint ini memerlukan token autentikasi JWT
router.use(authenticateToken);

// ==========================================================
// 1. MANAJEMEN ANGGOTA (ANGGOTA PENABUNG)
// ==========================================================

// GET /api/anggota - Ambil semua anggota (mendukung pencarian)
router.get('/anggota', async (req, res) => {
  const { search } = req.query;
  try {
    let sql = `
      SELECT m.id, m.member_number AS no_anggota, u.name AS nama, u.address AS alamat, u.phone AS no_hp, m.balance AS saldo, u.is_active
      FROM members m
      JOIN users u ON m.user_id = u.id
    `;
    const params = [];
    if (search) {
      sql += ` WHERE m.member_number ILIKE $1 OR u.name ILIKE $1 OR u.address ILIKE $1`;
      params.push(`%${search}%`);
    }
    sql += ' ORDER BY m.member_number ASC';
    
    const result = await query(sql, params);
    return res.status(200).json({
      success: true,
      data: result.rows.map(r => ({
        ...r,
        saldo: parseFloat(r.saldo)
      }))
    });
  } catch (err) {
    console.error('Error saat mengambil data anggota:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data anggota dari server.'
    });
  }
});

// GET /api/anggota/:id - Detail anggota & 10 transaksi terakhir
router.get('/anggota/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const sql = `
      SELECT m.id, m.member_number AS no_anggota, u.name AS nama, u.address AS alamat, u.phone AS no_hp, m.balance AS saldo, u.is_active
      FROM members m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = $1
    `;
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data anggota tidak ditemukan.'
      });
    }
    
    const member = result.rows[0];
    member.saldo = parseFloat(member.saldo);

    // Ambil riwayat 10 transaksi terakhir
    const trxSql = `
      SELECT id, type AS jenis, amount AS jumlah, description AS keterangan, transaction_date AS tanggal
      FROM transactions 
      WHERE member_id = $1 
      ORDER BY transaction_date DESC 
      LIMIT 10
    `;
    const trxResult = await query(trxSql, [id]);
    member.recent_transactions = trxResult.rows.map(t => ({
      ...t,
      jenis: t.jenis === 'deposit' ? 'setoran' : 'penarikan',
      jumlah: parseFloat(t.jumlah)
    }));

    return res.status(200).json({
      success: true,
      data: member
    });
  } catch (err) {
    console.error('Error saat mengambil detail anggota:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail anggota dari server.'
    });
  }
});

// POST /api/anggota - Tambah Anggota Baru
router.post('/anggota', async (req, res) => {
  const { nama, alamat, no_hp } = req.body;
  if (!nama) {
    return res.status(400).json({
      success: false,
      message: 'Nama anggota wajib diisi.'
    });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Hitung nomor urut anggota berikutnya
    const countRes = await client.query(`SELECT COUNT(*) FROM members`);
    const count = parseInt(countRes.rows[0].count || 0) + 1;
    const no_anggota = `RT04-${count.toString().padStart(3, '0')}`;

    const userId = uuidv4();
    const memberId = uuidv4();
    const defaultPassword = await bcrypt.hash('Member@123', 10);
    const email = `${no_anggota.toLowerCase()}@rt04.local`;

    // 1. Masukkan data ke tabel users
    await client.query(
      `INSERT INTO users (id, name, email, phone, address, password_hash, role, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'member', true, $7)`,
      [userId, nama, email, no_hp || null, alamat || null, defaultPassword, req.user.id]
    );

    // 2. Masukkan data ke tabel members
    await client.query(
      `INSERT INTO members (id, user_id, member_number, status, balance)
       VALUES ($1, $2, $3, 'active', 0.00)`,
      [memberId, userId, no_anggota]
    );

    await client.query('COMMIT');

    const newAnggota = {
      id: memberId,
      no_anggota,
      nama,
      alamat,
      no_hp,
      saldo: 0.00,
      is_active: true
    };

    // Tulis Audit Log
    await auditLog('CREATE', 'members', memberId, req.user.id, newAnggota, req);

    return res.status(201).json({
      success: true,
      message: 'Anggota baru berhasil ditambahkan.',
      data: newAnggota
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saat menambahkan anggota:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data anggota baru ke server.'
    });
  } finally {
    client.release();
  }
});

// PUT /api/anggota/:id - Perbarui Data Anggota
router.put('/anggota/:id', async (req, res) => {
  const { id } = req.params;
  const { nama, alamat, no_hp, is_active } = req.body;
  if (!nama) {
    return res.status(400).json({
      success: false,
      message: 'Nama anggota wajib diisi.'
    });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Dapatkan data member saat ini
    const currentRes = await client.query('SELECT user_id, member_number FROM members WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Data anggota tidak ditemukan.'
      });
    }
    const userId = currentRes.rows[0].user_id;

    // Ambil detail sebelum update untuk Log Audit
    const beforeRes = await client.query(`
      SELECT m.id, m.member_number AS no_anggota, u.name AS nama, u.address AS alamat, u.phone AS no_hp, m.balance AS saldo, u.is_active
      FROM members m JOIN users u ON m.user_id = u.id WHERE m.id = $1
    `, [id]);
    const beforeState = beforeRes.rows[0];
    beforeState.saldo = parseFloat(beforeState.saldo);

    // Update tabel users
    await client.query(
      `UPDATE users SET name = $1, address = $2, phone = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [nama, alamat || null, no_hp || null, is_active !== undefined ? is_active : true, userId]
    );

    // Update tabel members
    await client.query(
      `UPDATE members SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [is_active === false ? 'inactive' : 'active', id]
    );

    await client.query('COMMIT');

    const afterState = {
      id,
      no_anggota: beforeState.no_anggota,
      nama,
      alamat,
      no_hp,
      saldo: beforeState.saldo,
      is_active: is_active !== undefined ? is_active : true
    };

    // Tulis Audit Log
    await auditLog('UPDATE', 'members', id, req.user.id, { before: beforeState, after: afterState }, req);

    return res.status(200).json({
      success: true,
      message: 'Data anggota berhasil diperbarui.',
      data: afterState
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saat memperbarui anggota:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data anggota.'
    });
  } finally {
    client.release();
  }
});

// DELETE /api/anggota/:id - Hapus Anggota
router.delete('/anggota/:id', async (req, res) => {
  const { id } = req.params;
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Dapatkan data member saat ini
    const memberRes = await client.query('SELECT user_id FROM members WHERE id = $1', [id]);
    if (memberRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Data anggota tidak ditemukan.'
      });
    }
    const userId = memberRes.rows[0].user_id;

    // Cek apakah sudah ada transaksi
    const checkTrx = await client.query('SELECT COUNT(*) FROM transactions WHERE member_id = $1', [id]);
    const countTrx = parseInt(checkTrx.rows[0].count);
    if (countTrx > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Anggota tidak dapat dihapus karena sudah memiliki riwayat transaksi setoran/penarikan. Anda dapat menonaktifkan status anggota saja.'
      });
    }

    // Ambil data sebelum dihapus untuk Log Audit
    const beforeRes = await client.query(`
      SELECT m.id, m.member_number AS no_anggota, u.name AS nama, u.address AS alamat, u.phone AS no_hp, m.balance AS saldo, u.is_active
      FROM members m JOIN users u ON m.user_id = u.id WHERE m.id = $1
    `, [id]);
    const beforeState = beforeRes.rows[0];
    beforeState.saldo = parseFloat(beforeState.saldo);

    // Hapus users (akan meng-cascade members)
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');

    // Tulis Audit Log
    await auditLog('DELETE', 'members', id, req.user.id, beforeState, req);

    return res.status(200).json({
      success: true,
      message: 'Data anggota berhasil dihapus.'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saat menghapus anggota:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus data anggota.'
    });
  } finally {
    client.release();
  }
});


// ==========================================================
// 2. INPUT TRANSAKSI (SETORAN & PENARIKAN)
// ==========================================================

// POST /api/transaksi/setoran - Posting Setoran Tabungan Warga
router.post('/transaksi/setoran', async (req, res) => {
  const { anggota_id, jumlah, keterangan } = req.body;
  if (!anggota_id || !jumlah || jumlah <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID Anggota dan Jumlah Setoran valid wajib diisi.'
    });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Lock baris anggota untuk mencegah race-condition
    const selectRes = await client.query(`
      SELECT m.id, m.balance, u.name, m.member_number, u.is_active
      FROM members m JOIN users u ON m.user_id = u.id
      WHERE m.id = $1 FOR UPDATE
    `, [anggota_id]);

    if (selectRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Anggota tidak ditemukan.'
      });
    }

    const member = selectRes.rows[0];
    if (!member.is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Transaksi ditolak. Status tabungan anggota dalam keadaan tidak aktif.'
      });
    }

    const depositId = uuidv4();
    const transactionId = uuidv4();
    const desc = keterangan || 'Setoran Tabungan';
    const amountVal = parseFloat(jumlah);

    // 1. Simpan ke tabel deposits
    await client.query(
      `INSERT INTO deposits (id, member_id, amount, description, recorded_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [depositId, anggota_id, amountVal, desc, req.user.id]
    );

    // 2. Simpan ke tabel transactions (mutasi log)
    await client.query(
      `INSERT INTO transactions (id, member_id, type, amount, reference_id, description, created_by)
       VALUES ($1, $2, 'deposit', $3, $4, $5, $6)`,
      [transactionId, anggota_id, amountVal, depositId, desc, req.user.id]
    );

    // 3. Update saldo members
    const newBalance = parseFloat(member.balance) + amountVal;
    await client.query(
      `UPDATE members SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newBalance, anggota_id]
    );

    await client.query('COMMIT');

    const responseTrx = {
      id: transactionId,
      jenis: 'setoran',
      jumlah: amountVal,
      keterangan: desc,
      tanggal: new Date()
    };

    // Tulis Audit Logs
    await auditLog('CREATE', 'transactions', transactionId, req.user.id, responseTrx, req);
    await auditLog('UPDATE_BALANCE', 'members', anggota_id, req.user.id, { before: parseFloat(member.balance), after: newBalance }, req);

    return res.status(201).json({
      success: true,
      message: 'Setoran berhasil disimpan.',
      data: {
        transaksi: responseTrx,
        anggota: {
          nama: member.name,
          no_anggota: member.member_number,
          saldo_baru: newBalance
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
});

// POST /api/transaksi/penarikan - Posting Penarikan Tabungan Warga (Langsung Disetujui Operator)
router.post('/transaksi/penarikan', async (req, res) => {
  const { anggota_id, jumlah, keterangan } = req.body;
  if (!anggota_id || !jumlah || jumlah <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID Anggota dan Jumlah Penarikan valid wajib diisi.'
    });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Lock baris anggota untuk mencegah race-condition
    const selectRes = await client.query(`
      SELECT m.id, m.balance, u.name, m.member_number, u.is_active
      FROM members m JOIN users u ON m.user_id = u.id
      WHERE m.id = $1 FOR UPDATE
    `, [anggota_id]);

    if (selectRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Anggota tidak ditemukan.'
      });
    }

    const member = selectRes.rows[0];
    if (!member.is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Transaksi ditolak. Status tabungan anggota dalam keadaan tidak aktif.'
      });
    }

    const currentBalance = parseFloat(member.balance);
    const amountVal = parseFloat(jumlah);
    if (currentBalance < amountVal) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Transaksi ditolak. Saldo tidak mencukupi. Saldo saat ini: Rp ${currentBalance.toLocaleString('id-ID')}`
      });
    }

    const withdrawalId = uuidv4();
    const transactionId = uuidv4();
    const desc = keterangan || 'Penarikan Tabungan';

    // 1. Simpan ke tabel withdrawals (status langsung 'approved' karena diposting oleh petugas/operator)
    await client.query(
      `INSERT INTO withdrawals (id, member_id, amount, reason, status, approved_by, approval_date, recorded_by)
       VALUES ($1, $2, $3, $4, 'approved', $5, CURRENT_TIMESTAMP, $5)`,
      [withdrawalId, anggota_id, amountVal, desc, req.user.id]
    );

    // 2. Simpan ke tabel transactions (mutasi log)
    await client.query(
      `INSERT INTO transactions (id, member_id, type, amount, reference_id, description, created_by)
       VALUES ($1, $2, 'withdrawal', $3, $4, $5, $6)`,
      [transactionId, anggota_id, amountVal, withdrawalId, desc, req.user.id]
    );

    // 3. Update saldo members
    const newBalance = currentBalance - amountVal;
    await client.query(
      `UPDATE members SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newBalance, anggota_id]
    );

    await client.query('COMMIT');

    const responseTrx = {
      id: transactionId,
      jenis: 'penarikan',
      jumlah: amountVal,
      keterangan: desc,
      tanggal: new Date()
    };

    // Tulis Audit Logs
    await auditLog('CREATE', 'transactions', transactionId, req.user.id, responseTrx, req);
    await auditLog('UPDATE_BALANCE', 'members', anggota_id, req.user.id, { before: currentBalance, after: newBalance }, req);

    return res.status(201).json({
      success: true,
      message: 'Penarikan berhasil disimpan.',
      data: {
        transaksi: responseTrx,
        anggota: {
          nama: member.name,
          no_anggota: member.member_number,
          saldo_baru: newBalance
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
});


// ==========================================================
// 3. LAPORAN & DASHBOARD
// ==========================================================

// GET /api/laporan/dashboard - Mengambil data ringkasan untuk dashboard utama
router.get('/laporan/dashboard', async (req, res) => {
  try {
    // a. Total Anggota & Anggota Aktif
    const anggotaCountRes = await query(`
      SELECT COUNT(*) as total, SUM(CASE WHEN u.is_active THEN 1 ELSE 0 END) as aktif 
      FROM members m JOIN users u ON m.user_id = u.id
    `);
    const totalAnggota = parseInt(anggotaCountRes.rows[0].total || 0);
    const anggotaAktif = parseInt(anggotaCountRes.rows[0].aktif || 0);

    // b. Total Saldo Kumulatif Seluruh Warga
    const totalSaldoRes = await query('SELECT SUM(balance) as total_saldo FROM members');
    const totalSaldo = parseFloat(totalSaldoRes.rows[0].total_saldo || 0.00);

    // c. Total Setoran & Penarikan Bulan Ini
    const currentMonthRes = await query(`
        SELECT 
            SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as setoran_bulan_ini,
            SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END) as penarikan_bulan_ini
        FROM transactions 
        WHERE EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);
    const setoranBulanIni = parseFloat(currentMonthRes.rows[0].setoran_bulan_ini || 0.00);
    const penarikanBulanIni = parseFloat(currentMonthRes.rows[0].penarikan_bulan_ini || 0.00);

    // d. 5 Transaksi Terbaru dengan Info Anggota & Petugas
    const recentTrxRes = await query(`
        SELECT 
            t.id, t.type AS jenis, t.amount AS jumlah, t.description AS keterangan, t.transaction_date AS tanggal,
            m.member_number AS no_anggota, u.name as nama_anggota,
            p.name as nama_petugas
        FROM transactions t
        JOIN members m ON t.member_id = m.id
        JOIN users u ON m.user_id = u.id
        JOIN users p ON t.created_by = p.id
        ORDER BY t.transaction_date DESC
        LIMIT 5
    `);

    // e. Data Grafik Tren Tabungan Bulanan (6 Bulan Terakhir)
    const chartRes = await query(`
        SELECT 
            TO_CHAR(transaction_date, 'YYYY-MM') as bulan,
            SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as total_setoran,
            SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END) as total_penarikan
        FROM transactions
        WHERE transaction_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY bulan
        ORDER BY bulan ASC
    `);

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          total_anggota: totalAnggota,
          anggota_aktif: anggotaAktif,
          total_saldo: totalSaldo,
          setoran_bulan_ini: setoranBulanIni,
          penarikan_bulan_ini: penarikanBulanIni
        },
        recent_transactions: recentTrxRes.rows.map(t => ({
          ...t,
          jenis: t.jenis === 'deposit' ? 'setoran' : 'penarikan',
          jumlah: parseFloat(t.jumlah)
        })),
        chart_data: chartRes.rows.map(c => ({
          ...c,
          total_setoran: parseFloat(c.total_setoran),
          total_penarikan: parseFloat(c.total_penarikan)
        }))
      }
    });
  } catch (err) {
    console.error('Error saat mengambil data dashboard:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat data dashboard utama.'
    });
  }
});

// GET /api/laporan/transaksi - Laporan transaksi detail (mendukung filter)
router.get('/laporan/transaksi', async (req, res) => {
  const { start_date, end_date, jenis, anggota_id } = req.query;
  try {
    let sql = `
      SELECT 
          t.id, t.type AS jenis, t.amount AS jumlah, t.description AS keterangan, t.transaction_date AS tanggal,
          m.member_number AS no_anggota, u.name as nama_anggota, u.address as alamat_anggota,
          p.name as nama_petugas
      FROM transactions t
      JOIN members m ON t.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN users p ON t.created_by = p.id
    `;
    const params = [];
    const conditions = [];

    if (start_date) {
      params.push(start_date);
      conditions.push(`t.transaction_date >= $${params.length}::timestamp`);
    }

    if (end_date) {
      params.push(`${end_date} 23:59:59`);
      conditions.push(`t.transaction_date <= $${params.length}::timestamp`);
    }

    if (jenis) {
      params.push(jenis === 'setoran' ? 'deposit' : 'withdrawal');
      conditions.push(`t.type = $${params.length}`);
    }

    if (anggota_id) {
      params.push(anggota_id);
      conditions.push(`t.member_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY t.transaction_date DESC';

    const result = await query(sql, params);
    
    // Hitung total akumulasi
    let summarySql = `
      SELECT 
          SUM(CASE WHEN t.type = 'deposit' THEN t.amount ELSE 0 END) as total_setoran,
          SUM(CASE WHEN t.type = 'withdrawal' THEN t.amount ELSE 0 END) as total_penarikan
      FROM transactions t
    `;
    if (conditions.length > 0) {
      summarySql += ' WHERE ' + conditions.join(' AND ');
    }
    const summaryRes = await query(summarySql, params);

    const totalSetoran = parseFloat(summaryRes.rows[0].total_setoran || 0.00);
    const totalPenarikan = parseFloat(summaryRes.rows[0].total_penarikan || 0.00);

    return res.status(200).json({
      success: true,
      data: result.rows.map(t => ({
        ...t,
        jenis: t.jenis === 'deposit' ? 'setoran' : 'penarikan',
        jumlah: parseFloat(t.jumlah)
      })),
      summary: {
        total_setoran: totalSetoran,
        total_penarikan: totalPenarikan,
        net_savings: totalSetoran - totalPenarikan
      }
    });
  } catch (err) {
    console.error('Error saat membuat laporan transaksi:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat laporan mutasi transaksi.'
    });
  }
});


// ==========================================================
// 4. LOG AUDIT KEAMANAN
// ==========================================================

// GET /api/audit - Log audit dengan filter & paginasi
router.get('/audit', async (req, res) => {
  const limit = parseInt(req.query.limit) || 25;
  const offset = parseInt(req.query.offset) || 0;
  const { action, table_name } = req.query;

  try {
    let sql = `
      SELECT a.id, a.created_at, a.action, a.table_name, a.record_id, a.ip_address, a.user_agent,
             a.changes AS after_state,
             u.name AS nama_petugas, u.email AS username
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (action) {
      params.push(action);
      conditions.push(`a.action = $${params.length}`);
    }

    if (table_name) {
      // Map 'anggota' to 'members', 'transaksi' to 'transactions'
      let mappedTable = table_name;
      if (table_name === 'anggota') mappedTable = 'members';
      else if (table_name === 'transaksi') mappedTable = 'transactions';
      
      params.push(mappedTable);
      conditions.push(`a.table_name = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Dapatkan total logs untuk paginasi
    let countSql = 'SELECT COUNT(*) FROM audit_logs a';
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count || 0);

    // Tambah Limit dan Offset
    params.push(limit, offset);
    sql += ` ORDER BY a.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      data: result.rows.map(r => ({
        ...r,
        // Petakan nama tabel kembali ke versi Indonesia agar cocok dengan UI dropdown/filter
        table_name: r.table_name === 'members' ? 'anggota' : (r.table_name === 'transactions' ? 'transaksi' : r.table_name),
        before_state: r.after_state?.before || null,
        after_state: r.after_state?.after || r.after_state
      })),
      pagination: {
        total,
        limit,
        offset
      }
    });
  } catch (err) {
    console.error('Error saat mengambil audit logs:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data log audit sistem.'
    });
  }
});

export default router;
