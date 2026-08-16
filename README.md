# Knit & Keep

Aplikasi toko thrifting: katalog online, pembayaran lewat Midtrans, pengiriman
dan pelacakan lewat kurir sungguhan, kasir untuk penjualan di toko fisik, dan
pembukuan yang menyatu dengan semuanya.

Satu barang thrift biasanya hanya ada satu. Itu yang membentuk hampir seluruh
keputusan di aplikasi ini: stok dipotong saat checkout dengan penguncian baris
database supaya tidak terjadi penjualan ganda, dan setiap perubahan stok
tercatat lengkap dengan penyebabnya.

---

## Panduan, berurutan

Baca sesuai urutan ini kalau baru pertama kali.

| # | Dokumen | Isinya |
| --- | --- | --- |
| 1 | [Menjalankan di komputer sendiri](docs/1-menjalankan.md) | Menyalakan database, backend, dan frontend. Termasuk kendala yang sudah diketahui. |
| 2 | [Panduan mencoba](docs/2-panduan-mencoba.md) | Tujuh babak dari menambah produk sampai membaca laporan. **Mulai dari sini.** |
| 3 | [Pengujian](docs/3-pengujian.md) | Rangkaian uji otomatis, apa saja yang diperiksa, dan cara membersihkannya. |
| 4 | [Deploy](docs/4-deploy.md) | Menayangkan ke internet: pakai layanan apa, urutannya, dan daftar periksanya. |
| 5 | [Perawatan jangka panjang](docs/5-perawatan.md) | Cadangan, pemantauan, dan hal-hal yang mematikan toko diam-diam. |
| 6 | [Acuan teknis](docs/6-acuan-teknis.md) | Peta berkas, alur status pesanan, daftar variabel lingkungan, ringkasan API. |

---

## Cara cepat menyalakan

```bash
docker start knit-and-keep-db          # database

cd backend && .\mvnw.cmd -o spring-boot:run    # terminal 1

cd frontend && pnpm dev                        # terminal 2
```

Toko di <http://localhost:5173>, panel pengelola di
<http://localhost:5173/login> dengan `admin` / `admin123`.

Pemeriksaan cepat bahwa semuanya hidup:
<http://localhost:8080/api/kesehatan> harus menjawab `"status":"sehat"`.

Rinciannya di [docs/1-menjalankan.md](docs/1-menjalankan.md).

---

## Yang bisa dilakukan

### Pembeli

- Daftar, masuk, dan mengelola profil
- Menjelajah katalog dengan penyaring kategori, harga, dan urutan
- Keranjang yang menolak melebihi sisa stok
- Alamat pengiriman yang dicocokkan dengan daftar wilayah kurir
- Ongkos kirim sungguhan dari beberapa kurir, dihitung berdasarkan berat
- Pembayaran lewat Midtrans (kartu, transfer bank, e-wallet, gerai)
- Melacak pesanan dari dibayar sampai diterima, lengkap dengan nomor resi
- Mengajukan komplain beserta foto bukti bila barang bermasalah

### Pengelola

- Katalog: menambah barang beserta fotonya, langsung dari perangkat
- Stok: barang masuk, barang keluar, dan kartu stok yang mencatat setiap
  perubahan beserta penyebabnya
- Pesanan: memajukan status, mengisi nomor resi, membatalkan
- Komplain & retur: menyetujui retur, mengembalikan dana, atau memberi ganti rugi
- Kasir offline: mencatat penjualan di toko fisik lewat jalur yang sama
- Pembukuan: pengeluaran, arus kas, laba rugi, laporan bulanan, analisis penjualan
- Akun: mengelola pengelola lain dan menonaktifkan pelanggan bermasalah

---

## Teknologi

| Bagian | Dipakai |
| --- | --- |
| Frontend | React 19, Vite 7, Tailwind 4, React Router 7 |
| Backend | Java 17, Spring Boot 3.5 |
| Database | PostgreSQL 15 |
| Masuk & peran | JWT, diperiksa di sisi server pada setiap permintaan |
| Pembayaran | Midtrans Snap, beserta pemeriksaan tanda tangan notifikasi |
| Pengiriman | RajaOngkir (Komerce): pencarian wilayah, ongkir, pelacakan resi |

---

## Peta folder

```
backend/      Spring Boot — API, aturan bisnis, sambungan ke Midtrans & kurir
frontend/     React — toko untuk pembeli dan panel untuk pengelola
uji/          Rangkaian uji otomatis (PowerShell)
operasi/      Skrip cadangan, pemulihan, dan pengosongan data
docs/         Panduan ini
```
