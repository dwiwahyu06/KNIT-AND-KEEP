[← Kembali ke daftar panduan](../README.md)

# 6. Acuan teknis

Untuk dilihat saat perlu, bukan dibaca berurutan.

---

## Alur status pesanan

Aturannya dipegang satu berkas: `backend/.../model/OrderFlow.java`. Perpindahan
di luar daftar ini **ditolak**, jadi tidak ada pesanan yang bisa melompat dari
belum dibayar langsung ke selesai.

### Alur utama

```
MENUNGGU_PEMBAYARAN → DIPROSES → DIKIRIM → SELESAI
         ↓                ↓
    DIBATALKAN       DIBATALKAN
```

### Cabang kendala

```
DIPROSES / DIKIRIM / SELESAI → KOMPLAIN
                                   ↓
        ┌──────────────────────────┼──────────────┐
        ↓                          ↓              ↓
  RETUR_DIPROSES            RETUR_DITOLAK    GANTI_RUGI
        ↓                          ↓              ↓
  RETUR_DISETUJUI              SELESAI        SELESAI
        ↓
  REFUND / GANTI_RUGI → SELESAI
```

### Perpindahan yang diizinkan

| Dari | Boleh ke |
| --- | --- |
| `MENUNGGU_PEMBAYARAN` | `DIPROSES`, `DIBATALKAN` |
| `DIPROSES` | `DIKIRIM`, `DIBATALKAN`, `KOMPLAIN` |
| `DIKIRIM` | `SELESAI`, `KOMPLAIN` |
| `SELESAI` | `KOMPLAIN` |
| `KOMPLAIN` | `RETUR_DIPROSES`, `RETUR_DITOLAK`, `GANTI_RUGI`, `SELESAI` |
| `RETUR_DIPROSES` | `RETUR_DISETUJUI`, `RETUR_DITOLAK` |
| `RETUR_DISETUJUI` | `REFUND`, `GANTI_RUGI` |
| `RETUR_DITOLAK`, `REFUND`, `GANTI_RUGI` | `SELESAI` |
| `DIBATALKAN` | — tidak bisa dihidupkan lagi |

### Aturan tambahan

- **`DIKIRIM` wajib punya nomor resi.** Pesanan yang ditandai dikirim tanpa
  resi tidak bisa dilacak siapa pun.
- **`DIBATALKAN` mengembalikan stok** dan mencatatnya di kartu stok.
- **Omzet dihitung dari status.** Semua yang sudah dibayar masuk omzet,
  termasuk yang direfund — penjualannya benar-benar terjadi. Uang yang
  dikembalikan dicatat terpisah sebagai kerugian supaya tidak terpotong dua
  kali dari laba. Yang dikecualikan hanya `MENUNGGU_PEMBAYARAN` dan
  `DIBATALKAN`.

### Jenis kendala

`BARANG_RUSAK`, `SALAH_KIRIM`, `BARANG_HILANG`, `TIDAK_SESUAI_DESKRIPSI`,
`KURANG_JUMLAH`, `LAINNYA`

---

## Bagaimana stok dijaga

Satu barang thrift biasanya hanya ada satu, jadi penjualan ganda bukan
kerugian kecil — barangnya benar-benar tidak ada.

1. **Stok dipotong saat checkout**, bukan saat pembayaran lunas. Pesanan yang
   tidak dibayar sampai kedaluwarsa akan melepas stoknya kembali secara
   otomatis.
2. **Baris produknya dikunci** (`SELECT ... FOR UPDATE`) selama perubahan, jadi
   dua checkout bersamaan tidak bisa membaca sisa stok yang sama. Ini diuji
   dengan enam pembeli berebut satu barang terakhir; tepat satu yang lolos.
3. **Semua perubahan stok lewat satu pintu** (`StokService`), dan setiap
   perubahan menulis satu baris di kartu stok beserta penyebabnya:
   `PEMBELIAN`, `PENJUALAN`, `PEMBATALAN`, `RETUR`, `PENYESUAIAN`.

---

## Siapa boleh mengakses apa

Pemeriksaan peran dilakukan di **server**, pada setiap permintaan, oleh
`PenjagaAkses`. Menyembunyikan tombol di peramban bukan pengamanan.

| Kelompok alamat | Perlu |
| --- | --- |
| `/api/products` (GET), `/api/shipping/*`, `/api/kesehatan` | Siapa saja |
| `/api/auth/login`, `/api/pelanggan/login`, `/api/pelanggan/register` | Siapa saja |
| `/api/payments/notification-handler` | Siapa saja, tetapi tanda tangannya diperiksa |
| `/api/cart/*`, `/api/orders/*`, `/api/addresses/*`, `/api/notifikasi/*` | Sudah masuk — kepemilikan diperiksa lagi di controller |
| `/api/dashboard/*`, `/api/reports/*`, `/api/cashflow/*`, `/api/expenses/*`, `/api/transactions/*`, `/api/orders/admin/*` | Pengelola |
| Alamat lain yang tidak disebut | **Pengelola** |

Baris terakhir itu disengaja: endpoint baru terlindungi secara bawaan, bukan
sebaliknya.

---

## Ringkasan API

Semua di bawah `/api`.

| Kelompok | Alamat penting |
| --- | --- |
| Masuk | `POST /auth/login`, `POST /pelanggan/login`, `POST /pelanggan/register` |
| Katalog | `GET /products`, `GET /products/{id}`, `GET /products/kategori`, `GET /products/stok-menipis`, `GET /products/mutasi` |
| Stok | `POST /products/{id}/stok/tambah`, `POST /products/{id}/stok/kurangi` |
| Keranjang | `GET /cart/{pelangganId}`, `POST /cart/add`, `PUT /cart/update`, `DELETE /cart/remove` |
| Alamat | `GET/POST /pelanggan/{id}/addresses`, `PUT/DELETE /addresses/{id}` |
| Pengiriman | `GET /shipping/cari-tujuan`, `GET /shipping/ongkir`, `GET /shipping/lacak`, `GET /shipping/lacak-pesanan/{id}` |
| Pesanan | `POST /orders/checkout`, `GET /orders/user/{id}`, `GET /orders/{id}`, `POST /orders/{id}/terima` |
| Pesanan (admin) | `GET /orders/admin/all`, `PUT /orders/admin/update/{id}`, `POST /orders/admin/offline` |
| Pembayaran | `POST /payments/create-transaction`, `GET /payments/config`, `POST /payments/notification-handler` |
| Retur | `GET /retur/jenis-kendala`, `POST /retur`, `GET /retur`, `PUT /retur/{id}` |
| Pembukuan | `/cashflow`, `/expenses`, `/reports/*`, `/transactions` |
| Lain | `GET /kesehatan`, `/notifikasi`, `/dashboard` |

---

## Variabel lingkungan

Contoh lengkapnya di [`backend/.env.example`](../backend/.env.example). Semua
punya nilai bawaan supaya aplikasi bisa langsung dijalankan tanpa menyetel apa
pun.

| Variabel | Bawaan | Untuk apa |
| --- | --- | --- |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | localhost, postgres, 12345 | Sambungan database |
| `DDL_AUTO` | `update` | **Wajib `validate` di server** |
| `PORT` | `8080` | Porta backend |
| `CORS_ORIGINS` | `http://localhost:5173` | Alamat frontend yang diizinkan |
| `JWT_SECRET` | kunci pengembangan | **Wajib diganti.** Menggantinya mengeluarkan semua sesi |
| `JWT_JAM` | `12` | Masa berlaku token |
| `MIDTRANS_PRODUCTION` | `false` | `true` menyalakan pemeriksaan kesiapan rilis |
| `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY` | kunci sandbox | **Wajib diganti** |
| `MIDTRANS_EXPIRY_MINUTES` | `1440` | Batas tunggu pembayaran |
| `MIDTRANS_POLLING`, `MIDTRANS_POLLING_MS` | `true`, `60000` | Backend menanyakan sendiri status pembayaran |
| `RAJAONGKIR_KEY`, `RAJAONGKIR_URL` | kunci bawaan | **Wajib diganti** |
| `TOKO_ORIGIN_ID`, `TOKO_ORIGIN_LABEL` | `4816`, Bandung | Titik asal pengiriman |
| `TOKO_KURIR` | `jne:sicepat:jnt:pos:tiki` | Kurir yang ditawarkan |
| `TOKO_BERAT_MINIMUM` | `1000` | Berat paket bila produk belum diisi beratnya |
| `TOKO_ONGKIR_CADANGAN` | 3 tarif | Dipakai saat layanan kurir mati |
| `UNGGAHAN_FOLDER`, `UNGGAHAN_URL` | `./unggahan`, `/unggahan` | **Wajib volume permanen di server** |
| `TZ` | `Asia/Jakarta` | Menentukan tanggal di seluruh laporan |
| `DATA_CONTOH` | `false` | `true` mengisi produk dan pelanggan contoh |
| `ADMIN_AWAL_USERNAME`, `_EMAIL`, `_PASSWORD` | `admin`, —, kosong | Pengelola pertama di server. Sandi kosong = dibuat acak |
| `SIMPAN_NOTIFIKASI_HARI` | `90` | Umur pemberitahuan terbaca sebelum dibersihkan |

---

## Peta berkas

```
backend/src/main/java/com/knit_and_keep/backend/
  controller/   Pintu masuk API
  service/      Aturan bisnis
      StokService          satu-satunya pintu perubahan stok
      OrderService         checkout dan perpindahan status
      PaymentService       satu-satunya jalur menuju "lunas"
      ShippingService      ongkir, pelacakan, tarif cadangan
      ReportService        laporan dan analisis
      PenyimpananBerkas    menyimpan gambar sebagai berkas
  repository/   Kueri database
  model/
      OrderFlow            seluruh aturan status pesanan
      MutasiStok           kartu stok
  security/
      PenjagaAkses         memeriksa peran setiap permintaan
      Sesi                 pengguna yang sedang masuk
      TokenService         menerbitkan dan membaca JWT
      PembatasLaju         pembatas permintaan beruntun
  config/
      PemeriksaKesiapanRilis   menolak menyala dengan kunci percobaan
      KonfigurasiZonaWaktu     mengunci zona waktu
      DataSeeder               data awal
      PenanganGalat            mengubah galat mentah jadi pesan yang jelas

frontend/src/
  pages/        Satu berkas per halaman
  components/   AdminLayout, ShopLayout, dan kumpulan komponen tampilan
  lib/
      api.js      satu pintu ke backend
      gambar.js   mengecilkan foto sebelum dikirim
      cetak.js    membuat PDF
      csv.js      mengunduh CSV

uji/            Rangkaian uji otomatis
operasi/        cadangkan.ps1, pulihkan.ps1, kosongkan-data.ps1
docs/           Panduan ini
```

---

## Keputusan rancangan yang mungkin mengejutkan

**Stok dipotong saat checkout, bukan saat lunas.** Kalau menunggu lunas, dua
orang bisa memesan barang terakhir yang sama dan salah satunya pasti kecewa.
Pesanan yang tidak dibayar melepas stoknya kembali secara otomatis.

**Harga modal disalin ke rincian pesanan.** Laporan laba rugi memakai harga
modal saat barang itu terjual. Kalau membaca dari produk, mengubah harga modal
hari ini akan diam-diam mengubah laba bulan lalu.

**Produk yang dihapus tidak menghapus riwayat penjualannya.** Rincian pesanan
menyimpan salinan nama dan harganya sendiri, jadi laporan tahun lalu tetap
utuh.

**Status lunas tidak pernah ditentukan peramban.** Setelah popup pembayaran
ditutup, backend yang menanyakan hasilnya ke Midtrans. Notifikasi Midtrans juga
diperiksa tanda tangannya.

**Layanan luar yang mati tidak menghentikan penjualan.** Kurir tidak menjawab →
tarif perkiraan toko. Pencarian wilayah mati → alamat bisa diisi sendiri.
Notifikasi pembayaran tidak sampai → backend bertanya sendiri.
