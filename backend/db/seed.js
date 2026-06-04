const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seedDatabase() {
    console.log('=== Memulai Proses Inisialisasi Database Tabungan RT 04 ===');

    try {
        // 1. Baca dan Jalankan schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('1. Membuat tabel-tabel database...');
        await pool.query(schemaSql);
        console.log('✔ Tabel-tabel berhasil dibuat.');

        // 2. Hash Password untuk Admin Default
        console.log('2. Menghitung hash password untuk admin default...');
        const adminPassword = 'adminRT04!';
        const salt = await bcrypt.genSalt(10);
        const adminHash = await bcrypt.hash(adminPassword, salt);
        console.log('✔ Hash password berhasil dibuat.');

        // 3. Masukkan Data Petugas (Admin & Operator)
        console.log('3. Memasukkan data petugas default...');
        const userInsertQuery = `
            INSERT INTO users (username, password_hash, nama, role)
            VALUES 
            ($1, $2, 'Administrator RT 04', 'admin'),
            ('operator1', $3, 'Petugas Operator RT', 'operator')
            RETURNING id, username, role;
        `;
        const operatorHash = await bcrypt.hash('operator123', salt);
        const userRes = await pool.query(userInsertQuery, ['admin', adminHash, operatorHash]);
        const adminUser = userRes.rows.find(u => u.role === 'admin');
        const operatorUser = userRes.rows.find(u => u.role === 'operator');
        console.log(`✔ Petugas berhasil dibuat. Admin ID: ${adminUser.id}, Operator ID: ${operatorUser.id}`);

        // 4. Masukkan Data Anggota (Penabung)
        console.log('4. Memasukkan data anggota contoh...');
        const anggotaInsertQuery = `
            INSERT INTO anggota (no_anggota, nama, alamat, no_hp, saldo)
            VALUES 
            ('RT04-001', 'Budi Santoso', 'Jl. Mawar No. 12, RT 04/RW 02', '081234567890', 2500000.00),
            ('RT04-002', 'Siti Aminah', 'Jl. Melati No. 5, RT 04/RW 02', '081298765432', 1200000.00),
            ('RT04-003', 'Joko Susilo', 'Jl. Kamboja No. 8, RT 04/RW 02', '081345678901', 500000.00),
            ('RT04-004', 'Dewi Lestari', 'Jl. Dahlia No. 3, RT 04/RW 02', '081567890123', 4350000.00),
            ('RT04-005', 'Hendra Wijaya', 'Jl. Tulip No. 14, RT 04/RW 02', '081789012345', 0.00)
            RETURNING id, no_anggota, nama, saldo;
        `;
        const anggotaRes = await pool.query(anggotaInsertQuery);
        console.log(`✔ ${anggotaRes.rowCount} Anggota contoh berhasil dibuat.`);

        // Petakan ID Anggota untuk pembuatan riwayat transaksi
        const anggotaMap = {};
        anggotaRes.rows.forEach(a => {
            anggotaMap[a.no_anggota] = a.id;
        });

        // 5. Masukkan Data Transaksi Riwayat
        console.log('5. Memasukkan data riwayat transaksi contoh...');
        const transaksiInsertQuery = `
            INSERT INTO transaksi (anggota_id, jenis, jumlah, keterangan, tanggal, petugas_id)
            VALUES 
            ($1, 'setoran', 2000000.00, 'Setoran Awal Pembukaan Tabungan', NOW() - INTERVAL '30 days', $6),
            ($1, 'setoran', 500000.00, 'Setoran Bulanan Mei', NOW() - INTERVAL '15 days', $6),
            ($2, 'setoran', 1500000.00, 'Setoran Awal', NOW() - INTERVAL '25 days', $6),
            ($2, 'penarikan', 300000.00, 'Tarik tunai untuk keperluan darurat', NOW() - INTERVAL '10 days', $6),
            ($3, 'setoran', 500000.00, 'Setoran Koperasi RT', NOW() - INTERVAL '20 days', $5),
            ($4, 'setoran', 4000000.00, 'Setoran Awal', NOW() - INTERVAL '12 days', $6),
            ($4, 'setoran', 350000.00, 'Setoran Tambahan', NOW() - INTERVAL '5 days', $5)
        `;
        await pool.query(transaksiInsertQuery, [
            anggotaMap['RT04-001'],
            anggotaMap['RT04-002'],
            anggotaMap['RT04-003'],
            anggotaMap['RT04-004'],
            adminUser.id,
            operatorUser.id
        ]);
        console.log('✔ Riwayat transaksi contoh berhasil dibuat.');

        // 6. Masukkan Audit Log Awal
        console.log('6. Memasukkan data audit log awal...');
        const auditLogInsertQuery = `
            INSERT INTO audit_log (user_id, action, table_name, record_id, before_state, after_state, ip_address, user_agent)
            VALUES 
            ($1, 'CREATE', 'users', $2, NULL, '{"username":"admin", "role":"admin"}', '127.0.0.1', 'System Seeder'),
            ($1, 'CREATE', 'anggota', $3, NULL, '{"no_anggota":"RT04-001", "nama":"Budi Santoso", "saldo":2500000}', '127.0.0.1', 'System Seeder'),
            ($1, 'CREATE', 'anggota', $4, NULL, '{"no_anggota":"RT04-002", "nama":"Siti Aminah", "saldo":1200000}', '127.0.0.1', 'System Seeder'),
            ($1, 'LOGIN', 'users', $2, NULL, NULL, '127.0.0.1', 'System Seeder')
        `;
        await pool.query(auditLogInsertQuery, [
            adminUser.id,
            adminUser.id,
            anggotaMap['RT04-001'],
            anggotaMap['RT04-002']
        ]);
        console.log('✔ Audit log awal berhasil dibuat.');

        console.log('\n=== Inisialisasi Database Selesai dengan Sukses ===');
        console.log('Informasi Login Default:');
        console.log('- Administrator: username: "admin" | password: "adminRT04!"');
        console.log('- Operator: username: "operator1" | password: "operator123"');
    } catch (err) {
        console.error('❌ Terjadi kesalahan saat inisialisasi database:', err);
    } finally {
        await pool.end();
    }
}

seedDatabase();
