# Manual Operasi Aplikasi Tabungan Warga RT 04 RW 11

**Kelurahan Jatihanda, Kecamatan Mandalajati, Kota Bandung**

---

## 1. Akses Aplikasi

Buka browser (Chrome, Firefox, Safari, Edge) di HP atau komputer:

```
https://tabrt04-rase135.vercel.app
```

Aplikasi bisa diakses dari semua perangkat dan sistem operasi (Windows, Mac, Android, iPhone).

---

## 2. Login / Masuk

1. Buka halaman aplikasi
2. Masukkan **Email** dan **Kata Sandi** yang sudah diberikan
3. Klik **Masuk ke Sistem**

### Akun yang Tersedia:

| Role | Email | Password | Hak Akses |
|------|-------|----------|-----------|
| Admin | admin@rt04.local | Admin@123 | Akses penuh + audit log + hapus anggota |
| Bendahara | treasurer@rt04.local | Treasurer@123 | Input setoran, penarikan, kelola anggota |

> Segera ganti password default setelah login pertama kali.

---

## 3. Menu Utama

Setelah login, menu yang tersedia:

| Menu | Fungsi |
|------|--------|
| Dashboard | Ringkasan saldo, statistik, transaksi terbaru |
| Anggota | Kelola data warga penabung |
| Transaksi | Input setoran dan penarikan tabungan |
| Setoran | Lihat riwayat semua setoran |
| Penarikan | Lihat riwayat semua penarikan |
| Laporan | Laporan transaksi dengan filter tanggal |
| Audit Log | Riwayat perubahan data (khusus Admin) |

---

## 4. Kelola Anggota

### 4.1 Tambah Anggota Baru

1. Masuk ke menu **Anggota**
2. Klik tombol **Tambah Anggota Baru**
3. Isi data:
   - **Nama Lengkap** (wajib)
   - **Nomor Telepon / WhatsApp** (opsional)
   - **Alamat Rumah** (opsional)
4. Klik **Simpan Data**

> Sistem otomatis membuat nomor anggota (RT04-001, RT04-002, dst.)

### 4.2 Edit Data Anggota

1. Di halaman Anggota, klik tombol **Edit** pada baris anggota
2. Ubah data yang diperlukan
3. Klik **Simpan Data**

### 4.3 Nonaktifkan Anggota

1. Klik **Edit** pada anggota yang ingin dinonaktifkan
2. Hapus centang **Status Tabungan Warga Aktif**
3. Klik **Simpan Data**

> Anggota non-aktif tidak bisa melakukan transaksi setoran/penarikan.

### 4.4 Hapus Anggota (Khusus Admin)

1. Klik tombol **Hapus** pada baris anggota
2. Konfirmasi penghapusan

> Anggota yang sudah memiliki riwayat transaksi tidak bisa dihapus, hanya bisa dinonaktifkan.

---

## 5. Input Setoran Tabungan

1. Masuk ke menu **Transaksi**
2. Pilih tab **Input Setoran Baru**
3. Ketik nama atau nomor anggota di kolom pencarian
4. Pilih anggota dari dropdown
5. Isi **Tanggal Transaksi**:
   - Kosongkan jika transaksi hari ini
   - Isi tanggal jika mencatat data lama (tanggal mundur)
6. Masukkan **Nominal Uang** (dalam Rupiah, contoh: 50000)
7. Isi **Keterangan** jika perlu (opsional, contoh: "Setoran bulan Januari")
8. Periksa preview saldo baru
9. Klik **Konfirmasi & Posting Setoran**
10. Struk otomatis muncul — bisa dicetak atau disimpan

---

## 6. Input Penarikan Tabungan

1. Masuk ke menu **Transaksi**
2. Pilih tab **Input Penarikan Baru**
3. Ketik nama atau nomor anggota di kolom pencarian
4. Pilih anggota dari dropdown
5. Isi **Tanggal Transaksi** (sama seperti setoran)
6. Masukkan **Nominal Penarikan**
   - Sistem otomatis cek apakah saldo mencukupi
   - Jika saldo tidak cukup, tombol konfirmasi akan diblokir
7. Isi **Keterangan** jika perlu
8. Klik **Konfirmasi & Posting Penarikan**
9. Struk otomatis muncul

---

## 7. Cetak Struk / Bukti Transaksi

Setelah transaksi berhasil:

1. Struk muncul otomatis di layar
2. Klik **Cetak Struk (PDF / Printer)**
3. Pilih printer atau simpan sebagai PDF
4. Klik **Tutup Struk** jika tidak perlu dicetak

Struk berisi:
- Nomor transaksi
- Tanggal & waktu
- Data anggota
- Jenis transaksi (Setoran/Penarikan)
- Nominal
- Saldo akhir
- Kolom tanda tangan petugas & warga

---

## 8. Lihat Riwayat Setoran

1. Masuk ke menu **Setoran**
2. Tampil daftar semua setoran yang pernah dicatat
3. Informasi: No. Anggota, Jumlah, Tanggal, Keterangan, Petugas

---

## 9. Lihat Riwayat Penarikan

1. Masuk ke menu **Penarikan**
2. Tampil daftar semua penarikan beserta statusnya

---

## 10. Laporan Transaksi

1. Masuk ke menu **Laporan**
2. Gunakan filter:
   - **Tanggal Mulai** dan **Tanggal Akhir** — untuk rentang waktu
   - **Jenis** — Setoran saja / Penarikan saja / Semua
   - **Anggota** — filter per anggota tertentu
3. Klik **Tampilkan Laporan**
4. Lihat ringkasan:
   - Total Setoran
   - Total Penarikan
   - Selisih (Net Savings)

---

## 11. Dashboard

Halaman utama setelah login, menampilkan:

- Total anggota terdaftar
- Anggota aktif
- Total saldo seluruh warga
- Setoran bulan ini
- Penarikan bulan ini
- 5 transaksi terbaru
- Grafik tren bulanan (6 bulan terakhir)

---

## 12. Audit Log (Khusus Admin)

1. Masuk ke menu **Audit Log**
2. Lihat semua aktivitas perubahan data:
   - Siapa yang melakukan
   - Kapan dilakukan
   - Tabel apa yang berubah
   - Detail perubahan (sebelum & sesudah)
3. Filter berdasarkan:
   - Jenis aksi (CREATE, UPDATE, DELETE)
   - Tabel (Anggota, Transaksi)

---

## 13. Tips Penggunaan

### Mencatat Data Lama (Backdate)
Saat input setoran/penarikan, isi field **Tanggal Transaksi** dengan tanggal yang sesuai. Ini berguna untuk:
- Migrasi data dari buku manual ke aplikasi
- Mencatat transaksi yang belum sempat di-input

### Keamanan
- Jangan bagikan akun login ke orang lain
- Logout setelah selesai menggunakan aplikasi
- Semua aktivitas tercatat di Audit Log

### Akses dari HP
- Buka browser di HP (Chrome/Safari)
- Ketik alamat aplikasi
- Tampilan otomatis menyesuaikan layar HP

---

## 14. Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Tidak bisa login | Periksa email dan password, pastikan huruf besar/kecil benar |
| Halaman loading lama | Tunggu 10-30 detik (server gratis butuh waktu "bangun" jika lama tidak diakses) |
| Transaksi gagal | Pastikan anggota dalam status aktif dan saldo mencukupi (untuk penarikan) |
| Struk tidak muncul | Pastikan pop-up tidak diblokir oleh browser |
| Data tidak tampil | Refresh halaman (tekan F5 atau tarik ke bawah di HP) |

---

## 15. Kontak Bantuan

Jika ada kendala teknis, hubungi pengelola sistem.

---

*Dokumen ini dibuat untuk memudahkan operasional harian Tabungan Warga RT 04 RW 11 Kelurahan Jatihanda, Kecamatan Mandalajati, Kota Bandung.*
