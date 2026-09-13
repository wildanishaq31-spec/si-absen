# 📖 Panduan Lengkap Setup Vercel Postgres Serverless & Custom Domain SI-ABSEN

Dokumentasi ini dibuat sebagai panduan resmi bagi pembeli/pengembang untuk men-deploy aplikasi **SI-ABSEN** ke **Vercel**, menghubungkan database cloud **Vercel Postgres (Neon)**, dan memasang **Custom Domain** (misal: `absen.sekolah.sch.id` atau `presensi.kantor.com`) dengan SSL HTTPS gratis.

---

## 🚀 BAGIAN 1: Deploy Aplikasi & Setup Vercel Postgres Database

### Langkah 1: Import Repository ke Vercel
1. Buka dashboard [Vercel](https://vercel.com) dan login menggunakan akun GitHub Anda.
2. Klik tombol **"Add New..."** > **"Project"**.
3. Temukan repository **`si-absen`** pada daftar GitHub Anda, lalu klik **"Import"**.
4. Pada bagian *Build & Development Settings*, biarkan default (*Framework Preset: Vite*).
5. Klik **"Deploy"**. Tunggu sekitar 1 menit hingga deployment pertama selesai.

---

### Langkah 2: Buat Database Vercel Postgres (Neon)
1. Di dashboard project Vercel Anda, klik tab **"Storage"** di navigasi atas.
2. Klik tombol **"Create Database"** / **"Connect Store"**.
3. Pilih opsi **"Postgres"** (didukung oleh Neon Serverless).
4. Beri nama database Anda (misal: `si-absen-db`), lalu pilih lokasi server terdekat (contoh: **Singapore / sin1** untuk akses tercepat dari Indonesia).
5. Klik **"Create"**.

---

### Langkah 3: Hubungkan Database ke Project (*Auto Environment Variables*)
1. Setelah database dibuat, pilih tab **".env.local"** atau klik **"Connect to Project"**.
2. Pilih project `si-absen` Anda, lalu klik **"Connect"**.
3. Vercel akan **secara otomatis** menyuntikkan seluruh environment variable yang dibutuhkan:
   * `POSTGRES_URL`
   * `POSTGRES_PRISMA_URL`
   * `POSTGRES_URL_NON_POOLING`
   * `POSTGRES_USER`, `POSTGRES_PASSWORD`, dll.

---

### Langkah 4: Redeploy Project
1. Masuk ke tab **"Deployments"** di dashboard Vercel.
2. Klik tanda titik tiga `...` pada deployment teratas, lalu klik **"Redeploy"** (centang *Include existing Build Cache* atau biarkan default).
3. Backend Serverless API (`/api/sync.js`) akan otomatis:
   * Mendeteksi koneksi PostgreSQL `POSTGRES_URL`.
   * Membuat tabel `users`, `attendance`, dan `settings` secara otomatis (*auto-migration*).
   * Mengisi akun Administrator awal (`admin@siabsen.go.id` / password: `admin`).

---

## 🌐 BAGIAN 2: Setup Custom Domain di Vercel (Gratis SSL HTTPS)

Anda dapat menggunakan domain instansi Anda sendiri tanpa biaya hosting tambahan dari Vercel.

### Contoh Kasus:
* Ingin menggunakan subdomain sekolah: `absen.smkn1cermee.sch.id`
* Ingin menggunakan domain utama perusahaan: `presensi.perusahaan.com`

---

### Langkah 1: Tambahkan Domain di Dashboard Vercel
1. Buka dashboard project `si-absen` Anda di Vercel.
2. Klik tab **"Settings"** di pojok kanan atas.
3. Pilih menu **"Domains"** di sidebar kiri.
4. Masukkan nama domain yang diinginkan pada kolom input (contoh: `absen.namasekolah.sch.id` atau `presensi.kantor.com`), lalu klik tombol **"Add"**.

---

### Langkah 2: Konfigurasi DNS di Penyedia Domain (Cloudflare, Niagahoster, Domainesia, Rumahweb, dll)
Buka panel DNS manager di tempat Anda membeli domain / mengelola DNS:

#### Opsi A: Jika Menggunakan Subdomain (Direkomendasikan, contoh: `absen.sekolah.sch.id`)
Tambahkan DNS Record bertipe **CNAME**:
* **Type:** `CNAME`
* **Name / Host:** `absen` *(nama awalan subdomain)*
* **Target / Value:** `cname.vercel-dns.com`
* **TTL:** `Auto` / `3600`
* **Proxy Status:** *DNS Only* (atau jika pakai Cloudflare, bisa set Proxied / DNS Only).

#### Opsi B: Jika Menggunakan Domain Utama (Apex Domain, contoh: `presensi-kantor.com`)
Tambahkan DNS Record bertipe **A**:
* **Type:** `A`
* **Name / Host:** `@`
* **Target / Value:** `76.76.21.21` *(IP Anycast Vercel)*
* **TTL:** `Auto` / `3600`

---

### Langkah 3: Verifikasi & Penerbitan SSL Otomatis
1. Kembali ke tab **Settings > Domains** di Vercel.
2. Status domain akan berubah menjadi **Valid Configuration** (Ikon centang hijau).
3. Vercel akan menerbitkan sertifikat **SSL HTTPS (Let's Encrypt)** secara otomatis dalam 1-5 menit.
4. Sekarang aplikasi SI-ABSEN Anda sudah live dan dapat diakses dengan domain resmi instansi!

---

## 📁 BAGIAN 3: Menghubungkan Google Drive untuk Foto Bukti Presensi

1. Buka [Google Drive](https://drive.google.com).
2. Buat folder baru (misal: `BUKTI PRESENSI PEGAWAI`).
3. Klik kanan folder tersebut > **Bagikan (Share)** > Ubah akses umum menjadi: **"Siapa saja yang memiliki link" sebagai "Pelihat / Viewer"**.
4. Salin link folder tersebut (contoh: `https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ`).
5. Masuk ke Panel Admin SI-ABSEN > Tab **Pengaturan** > Pilih **🌐 Vercel Postgres** > Tempel link folder di kolom **"Link Folder Utama Google Drive"** > Klik **"Simpan Konfigurasi Storage"**.
6. Selesai! Foto presensi wajah dan izin pegawai akan otomatis tersusun rapi berdasarkan Tahun/Bulan/Tanggal di folder Google Drive tersebut.
