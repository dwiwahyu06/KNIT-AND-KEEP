[← Kembali ke daftar panduan](../README.md)

# 4. Deploy

Aplikasinya sudah disiapkan untuk ditayangkan: seluruh pengaturan bisa diisi
lewat variabel lingkungan, `backend/Dockerfile` sudah ada, dan ada penjaga yang
**menolak menyalakan aplikasi** kalau masih memakai kunci percobaan.

---

## Tiga bagian yang perlu tempat tinggal

| Bagian | Pakai apa | Perkiraan biaya |
| --- | --- | --- |
| Backend + database | **Railway** atau **Render**. Keduanya membaca `Dockerfile` dan menyediakan PostgreSQL sekali klik. | Gratis untuk mencoba; sekitar Rp80–150 ribu/bulan untuk dipakai sungguhan |
| Frontend | **Vercel**, **Netlify**, atau **Cloudflare Pages**. Hasil `pnpm build` hanya berkas statis. | Gratis |
| Nama domain | Niagahoster, Domainesia, atau Cloudflare | Sekitar Rp150 ribu/tahun |

Backend dan frontend sengaja dipisah karena keduanya berbeda sifat: backend
perlu terus berjalan dan menyimpan data, frontend cuma berkas yang dibagikan.

---

## Urutan pengerjaannya

### 1. Terbitkan kunci baru lebih dulu

Kunci sandbox Midtrans dan kunci RajaOngkir bawaan tertulis di
`application.properties` dan sudah ikut masuk riwayat Git. **Anggap ketiganya
bocor.**

| Kunci | Cara mendapatkannya |
| --- | --- |
| `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY` | Dasbor Midtrans → Settings → Access Keys, ambil kunci **Production** |
| `RAJAONGKIR_KEY` | Dasbor Komerce, terbitkan kunci baru |
| `JWT_SECRET` | Buat sendiri: `openssl rand -base64 48` |
| `DB_PASSWORD` | Kata sandi panjang dan acak, bukan `12345` |

### 2. Siapkan database

Buat PostgreSQL di Railway atau Render, lalu salin alamat sambungannya menjadi
`DB_URL`, `DB_USERNAME`, dan `DB_PASSWORD`.

### 3. Bentuk tabelnya sekali

Di server, `DDL_AUTO` harus `validate` supaya aplikasi tidak pernah mengubah
sendiri tabel berisi data nyata. Tetapi tabelnya harus ada lebih dulu.

Cara paling sederhana, dikerjakan sekali saja:

1. Nyalakan backend dengan `DDL_AUTO=update` pada database yang masih kosong
2. Biarkan tabelnya terbentuk, lalu matikan
3. **Ubah menjadi `DDL_AUTO=validate`** dan nyalakan ulang

Sesudah ini, setiap penambahan kolom baru dikerjakan sendiri dengan perintah
`ALTER TABLE` sebelum versi barunya dinyalakan. Merepotkan, tetapi itulah yang
mencegah satu kesalahan pemetaan menghapus kolom berisi data penjualan.

### 4. Deploy backend

Sambungkan repositori ke Railway/Render, arahkan ke folder `backend`. Isi
seluruh variabel dari [`backend/.env.example`](../backend/.env.example).

> **Yang paling sering terlewat:** `UNGGAHAN_FOLDER` harus menunjuk **volume
> permanen** (misalnya `/data/unggahan`), bukan `./unggahan`. Di hosting
> berbasis kontainer, isi folder biasa terhapus setiap kali aplikasi
> diperbarui — dan semua foto produk beserta foto bukti komplain ikut hilang.

Kalau ada nilai yang masih bawaan, aplikasi akan menolak menyala dan mencetak
daftar bernomor berisi apa saja yang belum diganti. Itu disengaja: lebih baik
gagal menyala daripada melayani uang sungguhan dengan kunci yang bocor.

### 5. Deploy frontend

```bash
cd frontend
VITE_API_BASE=https://api-toko-anda.com/api pnpm build
```

Unggah folder `dist/` ke Vercel/Netlify, atau sambungkan repositorinya dan
setel `VITE_API_BASE` sebagai variabel lingkungan di sana.

Lalu isi `CORS_ORIGINS` di backend dengan alamat frontend itu — tanpa ini,
peramban akan menolak seluruh panggilan API.

### 6. Daftarkan alamat notifikasi Midtrans

Di dasbor Midtrans → Settings → Configuration, isi **Payment Notification
URL**:

```
https://api-toko-anda.com/api/payments/notification-handler
```

Backend memeriksa tanda tangan setiap notifikasi, jadi notifikasi palsu
ditolak. Sebagai jaring pengaman, backend juga menanyakan sendiri status
pembayaran setiap 60 detik kalau notifikasinya tidak sampai.

### 7. Kosongkan data percobaan

```powershell
powershell -ExecutionPolicy Bypass -File operasi\kosongkan-data.ps1
```

Supaya barang percobaan dan angka uji coba tidak ikut terbawa ke toko
sungguhan. Produk contoh tidak akan terisi ulang sendiri karena `DATA_CONTOH`
bawaannya sudah `false`.

### 8. Beli satu barang sungguhan

Nominal terkecil, lalu batalkan. **Ini satu-satunya pembuktian** bahwa uangnya
benar-benar masuk ke rekening Anda — bukan pengujian, bukan mode sandbox.

### 9. Pasang pemantauan dan pencadangan

Sebelum pembeli pertama datang, bukan sesudah ada yang hilang. Caranya di
[5. Perawatan jangka panjang](5-perawatan.md).

---

## Daftar periksa sebelum tayang

- [ ] `JWT_SECRET` teks acak minimal 32 karakter, bukan bawaan
- [ ] `MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY` kunci produksi yang baru
- [ ] `RAJAONGKIR_KEY` kunci baru, bukan yang ada di kode
- [ ] `DB_PASSWORD` panjang dan acak
- [ ] `DDL_AUTO=validate`
- [ ] `CORS_ORIGINS` berisi domain toko, bukan `localhost`
- [ ] `UNGGAHAN_FOLDER` menunjuk volume permanen
- [ ] `TZ=Asia/Jakarta`
- [ ] `DATA_CONTOH=false`
- [ ] URL notifikasi Midtrans sudah didaftarkan
- [ ] Masuk dengan admin awal, ganti sandinya, lalu buat akun pengelola
      sehari-hari yang terpisah
- [ ] Satu pembelian sungguhan sudah dicoba dan uangnya masuk

---

## Akun pengelola pertama di server

Di mode produksi, `admin` / `admin123` **tidak pernah dibuat**. Sebagai
gantinya:

- Kalau `ADMIN_AWAL_PASSWORD` diisi, akun dibuat dengan kata sandi itu
- Kalau dikosongkan, kata sandinya dibuat acak dan **dicetak sekali di log**
  saat aplikasi pertama menyala

Segera masuk dan ganti kata sandinya. Log bisa terbaca orang lain.

---

## Batas yang perlu diketahui

- **Jalankan satu instans saja.** Pembatas laju permintaan disimpan di memori
  aplikasi, dan tugas berkala akan berjalan dua kali kalau instansnya dua.
  Untuk skala satu toko, satu instans lebih dari cukup.
- **Tidak ada email maupun WhatsApp.** Pemberitahuan hanya muncul di dalam
  aplikasi. Menambahkannya butuh layanan pengirim email tersendiri.

---

**Selanjutnya:** [5. Perawatan jangka panjang →](5-perawatan.md)
