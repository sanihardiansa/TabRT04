-- Schema Database Tabungan RT 04
-- Database: tabungan_rt04
-- Menggunakan PostgreSQL native gen_random_uuid() untuk UUID v4

-- Drop tabel jika sudah ada (untuk keperluan inisialisasi ulang yang bersih)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS transaksi CASCADE;
DROP TABLE IF EXISTS anggota CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. TABEL USERS (Petugas / Administrator RT)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nama VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL ANGGOTA (Penabung)
CREATE TABLE anggota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_anggota VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    alamat TEXT,
    no_hp VARCHAR(20),
    saldo NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (saldo >= 0.00),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk mempercepat pencarian anggota
CREATE INDEX idx_anggota_no_anggota ON anggota(no_anggota);
CREATE INDEX idx_anggota_nama ON anggota(nama);

-- 3. TABEL TRANSAKSI (Setoran & Penarikan)
CREATE TABLE transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anggota_id UUID NOT NULL REFERENCES anggota(id) ON DELETE RESTRICT,
    jenis VARCHAR(10) NOT NULL CHECK (jenis IN ('setoran', 'penarikan')),
    jumlah NUMERIC(15, 2) NOT NULL CHECK (jumlah > 0.00),
    keterangan TEXT,
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    petugas_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk mempercepat query laporan transaksi
CREATE INDEX idx_transaksi_anggota_id ON transaksi(anggota_id);
CREATE INDEX idx_transaksi_jenis ON transaksi(jenis);
CREATE INDEX idx_transaksi_tanggal ON transaksi(tanggal);

-- 4. TABEL AUDIT LOG (Pencatatan CRUD)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk log audit
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
