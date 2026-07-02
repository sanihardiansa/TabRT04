# 🚀 Panduan Deploy TabRT04 - GRATIS

Deploy aplikasi Tabungan RT 04 agar bisa diakses di **semua browser** dan **semua OS** (Windows, Mac, Linux, Android, iOS) tanpa biaya.

---

## 📋 Arsitektur Deployment

```
┌─────────────────────────────────┐
│   Frontend (Vercel - GRATIS)    │
│   https://tabrt04.vercel.app    │
│   React + Vite (Static SPA)    │
└───────────────┬─────────────────┘
                │ HTTPS API calls
                ▼
┌─────────────────────────────────┐
│  Backend (Render.com - GRATIS)  │
│  https://tabrt04-backend.onrender.com │
│  Node.js + Express             │
└───────────────┬─────────────────┘
                │ SQL (SSL)
                ▼
┌─────────────────────────────────┐
│  Database (Render PostgreSQL)   │
│  Free tier - 256MB             │
└─────────────────────────────────┘
```

---

## 🗂️ Langkah 1: Push ke GitHub

Pastikan repo sudah di-push ke GitHub:

```bash
git add .
git commit -m "feat: configure for free cloud deployment"
git push origin main
```

---

## 🗄️ Langkah 2: Deploy Backend + Database di Render.com

### Cara Cepat (Blueprint):

1. Buka https://render.com dan sign up (gratis via GitHub)
2. Klik **"New" → "Blueprint"**
3. Connect repository GitHub kamu
4. Render akan otomatis baca file `render.yaml` dan setup:
   - ✅ PostgreSQL database (gratis)
   - ✅ Web service backend (gratis)
5. Klik **"Apply"** dan tunggu deploy selesai (~3-5 menit)

### Cara Manual (jika Blueprint tidak tersedia):

#### 2a. Buat Database PostgreSQL:
1. Dashboard Render → **"New" → "PostgreSQL"**
2. Isi:
   - Name: `tabungan-rt04-db`
   - Database: `tabungan_rt04`
   - User: `tabrt04_user`
   - Region: Singapore
   - Plan: **Free**
3. Klik **"Create Database"**
4. Salin **Internal Database URL** (format: `postgresql://user:pass@host:5432/db`)

#### 2b. Buat Web Service Backend:
1. Dashboard Render → **"New" → "Web Service"**
2. Connect ke repository GitHub
3. Isi konfigurasi:
   - Name: `tabrt04-backend`
   - Region: Singapore
   - Runtime: **Node**
   - Root Directory: `backend`
   - Build Command: `npm install && npm run migrate && npm run seed`
   - Start Command: `npm start`
   - Plan: **Free**
4. Tambahkan **Environment Variables**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DATABASE_URL` | *(paste Internal Database URL dari step 2a)* |
| `JWT_SECRET` | *(generate random string, min 32 karakter)* |
| `JWT_EXPIRE` | `7d` |
| `CORS_ORIGIN` | `https://tabrt04.vercel.app` |
| `LOG_LEVEL` | `info` |

5. Klik **"Create Web Service"**
6. Tunggu build & deploy selesai
7. Test: buka `https://tabrt04-backend.onrender.com/health`

> ⚠️ **Catatan**: Free tier Render akan "sleep" setelah 15 menit tidak ada request. Request pertama setelah sleep butuh ~30 detik untuk "bangun".

---

## 🌐 Langkah 3: Deploy Frontend di Vercel

1. Buka https://vercel.com dan sign up (gratis via GitHub)
2. Klik **"Add New" → "Project"**
3. Import repository GitHub kamu
4. Konfigurasi:
   - Framework Preset: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Tambahkan **Environment Variable**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://tabrt04-backend.onrender.com/api/v1` |

> ⚡ Ganti `tabrt04-backend` dengan nama service backend kamu di Render.

6. Klik **"Deploy"**
7. Setelah selesai, kamu akan dapat URL seperti: `https://tabrt04.vercel.app`

---

## 🔗 Langkah 4: Update CORS di Backend

Setelah frontend di-deploy dan kamu tahu URL-nya:

1. Buka Render Dashboard → Web Service `tabrt04-backend`
2. Masuk ke **Environment** tab
3. Update `CORS_ORIGIN` dengan URL frontend kamu yang sebenarnya:
   ```
   https://tabrt04.vercel.app
   ```
   Jika ada beberapa domain (custom domain, etc.):
   ```
   https://tabrt04.vercel.app,https://tabunganrt04.com
   ```
4. Klik **Save Changes** - backend akan auto-redeploy

---

## ✅ Langkah 5: Verifikasi

Buka URL frontend di berbagai browser/device:

- [x] Chrome (Windows/Mac/Linux)
- [x] Firefox
- [x] Safari (Mac/iOS)
- [x] Edge
- [x] Browser Android (Chrome, Samsung Internet)
- [x] Mobile Safari (iPhone/iPad)

### Login Test:
- **Admin**: `admin@rt04.local` / `Admin@123`
- **Bendahara**: `treasurer@rt04.local` / `Treasurer@123`
- **Anggota**: `member1@rt04.local` / `Member@123`

---

## 💡 Tips & Troubleshooting

### Backend lambat saat pertama diakses?
Ini normal di free tier Render. Server "tidur" setelah 15 menit tidak aktif. Solusi:
- Gunakan service seperti [UptimeRobot](https://uptimerobot.com/) (gratis) untuk ping `/health` setiap 14 menit agar server tetap hidup.

### CORS Error?
- Pastikan `CORS_ORIGIN` di Render environment sesuai dengan URL frontend Vercel (tanpa trailing slash).
- Contoh yang benar: `https://tabrt04.vercel.app`
- Contoh yang salah: `https://tabrt04.vercel.app/`

### Database penuh?
Free tier Render PostgreSQL = 256MB. Untuk monitoring:
- Dashboard Render → PostgreSQL → Metrics

### Custom Domain (Opsional)?
- **Vercel**: Settings → Domains → Add domain
- **Render**: Settings → Custom Domains

### Generate JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📊 Batasan Free Tier

| Service | Batasan | Cukup Untuk |
|---------|---------|-------------|
| Vercel (Frontend) | 100GB bandwidth/bulan | ~50.000 pengguna/bulan |
| Render (Backend) | 750 jam/bulan, sleep setelah 15 min idle | RT dengan < 100 anggota |
| Render (PostgreSQL) | 256MB storage, 97 hari sebelum expire | ~5 tahun data tabungan RT |

> 💡 Jika aplikasi sudah banyak pengguna, bisa upgrade ke paid tier Render ($7/bulan) untuk server yang tidak "tidur".

---

## 🔄 Auto Deploy

Setiap kali kamu push ke branch `main` di GitHub:
- ✅ Vercel akan otomatis rebuild frontend
- ✅ Render akan otomatis rebuild backend

Tidak perlu deploy manual lagi!
