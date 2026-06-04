const { query } = require('../config/db');

// 1. GET DATA UNTUK DASHBOARD UTAMA
const getDashboardData = async (req, res) => {
    try {
        // a. Total Anggota & Anggota Aktif
        const anggotaCountRes = await query('SELECT COUNT(*) as total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as aktif FROM anggota');
        const totalAnggota = parseInt(anggotaCountRes.rows[0].total || 0);
        const anggotaAktif = parseInt(anggotaCountRes.rows[0].aktif || 0);

        // b. Total Saldo Kumulatif Seluruh Warga
        const totalSaldoRes = await query('SELECT SUM(saldo) as total_saldo FROM anggota');
        const totalSaldo = parseFloat(totalSaldoRes.rows[0].total_saldo || 0.00);

        // c. Total Setoran & Penarikan Bulan Ini
        const currentMonthRes = await query(`
            SELECT 
                SUM(CASE WHEN jenis = 'setoran' THEN jumlah ELSE 0 END) as setoran_bulan_ini,
                SUM(CASE WHEN jenis = 'penarikan' THEN jumlah ELSE 0 END) as penarikan_bulan_ini
            FROM transaksi 
            WHERE EXTRACT(MONTH FROM tanggal) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(YEAR FROM tanggal) = EXTRACT(YEAR FROM CURRENT_DATE)
        `);
        const setoranBulanIni = parseFloat(currentMonthRes.rows[0].setoran_bulan_ini || 0.00);
        const penarikanBulanIni = parseFloat(currentMonthRes.rows[0].penarikan_bulan_ini || 0.00);

        // d. 5 Transaksi Terbaru dengan Info Anggota & Petugas
        const recentTrxRes = await query(`
            SELECT 
                t.id, t.jenis, t.jumlah, t.keterangan, t.tanggal,
                a.no_anggota, a.nama as nama_anggota,
                u.nama as nama_petugas
            FROM transaksi t
            JOIN anggota a ON t.anggota_id = a.id
            JOIN users u ON t.petugas_id = u.id
            ORDER BY t.tanggal DESC
            LIMIT 5
        `);

        // e. Data Grafik Tren Tabungan Bulanan (6 Bulan Terakhir)
        const chartRes = await query(`
            SELECT 
                TO_CHAR(tanggal, 'YYYY-MM') as bulan,
                SUM(CASE WHEN jenis = 'setoran' THEN jumlah ELSE 0 END) as total_setoran,
                SUM(CASE WHEN jenis = 'penarikan' THEN jumlah ELSE 0 END) as total_penarikan
            FROM transaksi
            WHERE tanggal >= CURRENT_DATE - INTERVAL '6 months'
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
                recent_transactions: recentTrxRes.rows,
                chart_data: chartRes.rows
            }
        });
    } catch (err) {
        console.error('Error saat mengambil data dashboard:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Gagal memuat data dashboard utama.'
        });
    }
};

// 2. GET LAPORAN TRANSAKSI (Filterable untuk Ekspor/Cetak)
const getLaporanTransaksi = async (req, res) => {
    const { start_date, end_date, jenis, anggota_id } = req.query;

    try {
        let sql = `
            SELECT 
                t.id, t.jenis, t.jumlah, t.keterangan, t.tanggal,
                a.no_anggota, a.nama as nama_anggota, a.alamat as alamat_anggota,
                u.nama as nama_petugas
            FROM transaksi t
            JOIN anggota a ON t.anggota_id = a.id
            JOIN users u ON t.petugas_id = u.id
        `;
        const params = [];
        let conditions = [];

        if (start_date) {
            params.push(start_date);
            conditions.push(`t.tanggal >= $${params.length}::timestamp`);
        }

        if (end_date) {
            params.push(`${end_date} 23:59:59`);
            conditions.push(`t.tanggal <= $${params.length}::timestamp`);
        }

        if (jenis) {
            params.push(jenis);
            conditions.push(`t.jenis = $${params.length}`);
        }

        if (anggota_id) {
            params.push(anggota_id);
            conditions.push(`t.anggota_id = $${params.length}`);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY t.tanggal DESC';

        const result = await query(sql, params);
        
        // Hitung total akumulasi dari data yang difilter
        const summarySql = `
            SELECT 
                SUM(CASE WHEN t.jenis = 'setoran' THEN t.jumlah ELSE 0 END) as total_setoran,
                SUM(CASE WHEN t.jenis = 'penarikan' THEN t.jumlah ELSE 0 END) as total_penarikan
            FROM transaksi t
            ${conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : ''}
        `;
        const summaryRes = await query(summarySql, params);

        return res.status(200).json({
            success: true,
            data: result.rows,
            summary: {
                total_setoran: parseFloat(summaryRes.rows[0].total_setoran || 0.00),
                total_penarikan: parseFloat(summaryRes.rows[0].total_penarikan || 0.00),
                net_savings: parseFloat(summaryRes.rows[0].total_setoran || 0.00) - parseFloat(summaryRes.rows[0].total_penarikan || 0.00)
            }
        });
    } catch (err) {
        console.error('Error saat membuat laporan transaksi:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Gagal membuat laporan mutasi transaksi.'
        });
    }
};

module.exports = {
    getDashboardData,
    getLaporanTransaksi
};
