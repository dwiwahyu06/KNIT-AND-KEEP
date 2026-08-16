[← Kembali ke daftar panduan](../README.md)

# 5. Perawatan jangka panjang

Aplikasi yang sudah tayang jarang rusak karena kodenya salah. Ia berhenti
karena kartu kredit kedaluwarsa, kuota habis, cadangan tidak pernah dibuat,
atau tidak ada yang tahu ia sudah mati sejak Selasa.

---

## Yang sudah dipasang untuk itu

| Perlindungan | Kalau tidak ada |
| --- | --- |
| Tarif ongkir cadangan (`TOKO_ONGKIR_CADANGAN`) | Kuota kurir habis → pembeli tidak punya satu pun pilihan kirim → toko berhenti menerima pesanan. Ini sudah terbukti terjadi saat pengujian. |
| `GET /api/kesehatan` | Gangguan baru ketahuan setelah ada pembeli yang mengeluh. |
| Alamat bisa diisi sendiri saat pencarian wilayah mati | Pembeli tidak bisa menyimpan alamat sama sekali, jadi tidak bisa berbelanja. |
| Zona waktu dikunci `Asia/Jakarta` | Server sewaan berjalan di UTC. Penjualan sore hari jatuh ke tanggal kemarin, dan laporan harian meleset tanpa terlihat salah. |
| Pembersihan pemberitahuan lama | Satu tabel tumbuh tanpa batas selama bertahun-tahun. |
| `operasi/cadangkan.ps1` | Data penjualan dan pembukuan hilang selamanya. |
| Admin awal bersandi acak di produksi | `admin` / `admin123` ikut terbawa ke server. |

---

## Lima cara toko mati diam-diam

### Perlu dijaga sendiri

**Tagihan berhenti, layanan ikut berhenti.** Domain diperpanjang setahun
sekali; hosting dan database ditagih tiap bulan; paket kurir punya kuota
harian. Satu kartu yang kedaluwarsa cukup untuk mematikan seluruhnya, biasanya
tanpa pemberitahuan yang terbaca. Pasang pengingat kalender terpisah untuk tiap
tanggal jatuh tempo.

**Foto hilang setiap kali aplikasi diperbarui.** Foto produk dan foto bukti
komplain disimpan di folder `UNGGAHAN_FOLDER`, bukan di database. Di hosting
berbasis kontainer, isi folder itu terhapus setiap kali aplikasi dinyalakan
ulang. Arahkan ke volume permanen (`/data/unggahan`), bukan ke `./unggahan`.

**Kunci yang sudah terlanjur ada di dalam kode.** Kunci sandbox Midtrans dan
kunci RajaOngkir bawaan tertulis di `application.properties` dan ikut masuk
riwayat Git. Anggap ketiganya sudah bocor: terbitkan kunci baru sebelum tayang,
lalu isikan lewat variabel lingkungan.

### Sudah ditangani aplikasi

**Layanan luar mati, toko ikut mati.** Kalau layanan kurir tidak menjawab,
pembeli tetap mendapat pilihan kirim cadangan yang ditandai "perkiraan", dan
alamat tetap bisa disimpan dengan mengisi wilayahnya sendiri. Kalau notifikasi
Midtrans tidak sampai, backend menanyakan sendiri status pembayaran tiap 60
detik.

**Pengaturan pengembangan terbawa ke server.** Begitu
`MIDTRANS_PRODUCTION=true`, aplikasi memeriksa kunci JWT, kunci Midtrans, kunci
RajaOngkir, sandi database, alamat CORS, dan `DDL_AUTO`. Kalau ada yang masih
bawaan, aplikasi menolak menyala dan mencetak daftar yang harus diperbaiki.

---

## Jadwal perawatan

| Irama | Yang dikerjakan | Alasannya |
| --- | --- | --- |
| **Harian** | Otomatis: `operasi/cadangkan.ps1` lewat Task Scheduler | Kehilangan data terburuk jadi sebatas satu hari penjualan. |
| **Mingguan** | Salin cadangan terbaru ke tempat lain (Drive, hard disk luar) | Cadangan di komputer yang sama ikut hilang bersama komputernya. |
| **Bulanan** | Uji pemulihan dengan `operasi/pulihkan.ps1` ke database percobaan | Cadangan yang belum pernah dipulihkan belum tentu bisa dipakai. |
| **Tahunan** | Perpanjang domain, ganti kunci JWT dan Midtrans, perbarui Java dan Node ke LTS terbaru | Kunci yang tidak pernah diganti hanya menunggu giliran bocor. |

### Memasang pencadangan harian di Windows

Jalankan sekali sebagai Administrator:

```
schtasks /create /tn "Cadangan Knit and Keep" /sc daily /st 23:00 ^
  /tr "powershell -ExecutionPolicy Bypass -File C:\path\ke\operasi\cadangkan.ps1"
```

### Memasang pemantauan

Daftarkan `https://api-toko-anda.com/api/kesehatan` di UptimeRobot (gratis),
periksa tiap 5 menit, kirim peringatan ke email. Jawabannya `200` saat sehat
dan `503` saat database tidak terjawab. Pada hosting paket gratis, panggilan
berkala ini sekaligus menjaga server tidak tertidur.

---

## Mengosongkan data percobaan

Data contoh berguna saat aplikasi baru dicoba, tetapi mengotori katalog dan
laporan begitu toko diisi barang asli.

```powershell
powershell -ExecutionPolicy Bypass -File operasi\cadangkan.ps1          # selalu cadangkan dulu
powershell -ExecutionPolicy Bypass -File operasi\kosongkan-data.ps1     # kosongkan katalog, pesanan, pembukuan
```

Skrip ini menghapus seluruh data toko dan menyetel ulang nomor urut, tetapi
**tidak** menghapus akun pengelola — kalau ikut terhapus, tidak ada lagi yang
bisa masuk. Berkas foto yang sudah tidak ditunjuk siapa pun ikut dibuang;
hentikan backend dulu supaya berkasnya tidak sedang terkunci.

Produk contoh tidak akan terisi ulang sendiri karena `DATA_CONTOH` bawaannya
`false`. Setel `true` hanya kalau ingin melihat isian contohnya lagi.

---

## Kalau ada yang mati

Mulai selalu dari `/api/kesehatan`. Jawabannya menyempitkan kemungkinan dalam
satu langkah.

| Gejala | Periksa | Tindakan |
| --- | --- | --- |
| Toko tidak terbuka sama sekali | `/api/kesehatan` | Tidak menjawab → aplikasi mati atau tagihan hosting belum dibayar. Menjawab `503` → databasenya yang mati. |
| Ongkir bertanda "perkiraan" | Kuota paket kurir | Isi ulang paketnya. Penjualan tetap jalan, tetapi ongkirnya perlu dicek sebelum barang dikirim. |
| Pencarian wilayah gagal terus | Kuota paket kurir | Sama. Pembeli sementara memakai pilihan "Isi wilayah sendiri". |
| Pembeli sudah bayar, status belum berubah | Tunggu 60 detik | Backend menanyakan sendiri ke Midtrans. Kalau tetap, periksa `MIDTRANS_POLLING=true` dan kunci produksinya. |
| Foto produk atau bukti komplain hilang | `UNGGAHAN_FOLDER` | Masih menunjuk folder sementara. Pindahkan ke volume permanen. |
| Omzet harian terasa meleset | `zonaWaktu` di `/api/kesehatan` | Harus `Asia/Jakarta`. Kalau bukan, setel `TZ` di hosting. |
| Aplikasi menolak menyala | Log saat mulai | Pemeriksa kesiapan rilis mencetak daftar bernomor berisi pengaturan yang belum diganti. |

---

## Batas yang perlu diketahui sejak awal

- **Jalankan satu instans saja.** Pembatas laju permintaan disimpan di memori
  aplikasi, dan tugas berkala (penanya status pembayaran, pembersih
  pemberitahuan) akan berjalan dua kali kalau instansnya dua.
- **Pemberitahuan hanya di dalam aplikasi.** Tidak ada email maupun WhatsApp.
- **Perubahan struktur database dikerjakan sengaja.** Dengan
  `DDL_AUTO=validate`, menambah kolom berarti menjalankan `ALTER TABLE` sendiri
  sebelum versi barunya dinyalakan.
- **Yang tidak pernah dihapus otomatis:** pesanan, mutasi stok, arus kas, dan
  retur. Hanya pemberitahuan yang sudah dibaca dan lebih tua dari 90 hari yang
  dibersihkan.

---

Yang paling menentukan dari semua ini cuma dua: cadangan yang benar-benar
berjalan tiap hari, dan pemantauan yang memberi tahu Anda lebih dulu daripada
pembeli. Sisanya bisa diperbaiki belakangan.

---

**Selanjutnya:** [6. Acuan teknis →](6-acuan-teknis.md)
