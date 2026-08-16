[← Kembali ke daftar panduan](../README.md)

# 2. Panduan mencoba

Tujuh babak berurutan. Setelah menyelesaikan semuanya, Anda sudah melewati
setiap jalur yang dipakai toko sungguhan — termasuk jalur yang jarang
disentuh seperti retur dan penjualan offline.

Pastikan dulu ketiganya hidup ([lihat langkah 1](1-menjalankan.md)).

---

## Babak 1 — Isi katalog dengan barang Anda

> Masuk di <http://localhost:5173/login> sebagai `admin` / `admin123`

Buka **Katalog Produk** di sidebar, lalu klik **Tambah produk**.

1. Isi nama, kategori, harga modal, harga jual, dan stok.
2. **Berat (gram) jangan dikosongkan.** Ongkos kirim dihitung dari berat, dan
   barang tanpa berat dianggap 1000 gram.
3. Pada bagian **Foto produk**, klik *Choose File* lalu pilih foto dari
   komputer atau ponsel. Pratinjaunya langsung muncul di sebelah kiri, dan
   fotonya dikecilkan sendiri ke sisi 1200 piksel — foto langsung dari ponsel
   boleh dipakai.
4. Simpan, lalu ulangi sampai ada **tiga produk**. Katalog berisi satu barang
   sulit dinilai.

**Yang perlu dilihat sesudahnya:**

- Buka <http://localhost:5173> — foto-fotonya sudah muncul di bagian
  "Baru masuk".
- Di daftar produk, kolom **Foto** paling kiri memperlihatkan barang mana yang
  masih belum berfoto. Yang kosong tampil sebagai kotak abu-abu di katalog
  pelanggan.
- Buka **Kartu Stok** — stok awal setiap produk sudah tercatat sebagai mutasi.

---

## Babak 2 — Belanja sebagai pembeli

> Buka **jendela penyamaran** (Ctrl+Shift+N) supaya sesi pengelola tadi tidak
> tertimpa

1. Daftar akun baru di <http://localhost:5173/RegisterPelanggan>, lalu masuk.
2. **Katalog** → pilih barang → **Tambah ke keranjang**.
3. Menu **Alamat** → **Tambah alamat**. Ketik nama kelurahan atau kecamatan
   minimal 3 huruf, lalu pilih dari daftar yang muncul.
4. **Keranjang** → **Checkout**: pilih alamat, pilih layanan pengiriman, lalu
   **Bayar**.

> **Kalau pencarian wilayah gagal**
>
> Itu berarti kuota harian kurir sedang habis. Klik
> **"Isi wilayah sendiri"** yang muncul di bawah pesan galatnya, isi provinsi
> dan kabupaten, lalu simpan.
>
> Ongkirnya akan memakai tarif perkiraan toko (Rp9.000 / 15.000 / 28.000) dan
> ditandai "perkiraan", tetapi checkout tetap berjalan penuh. Nanti saat
> kuotanya pulih, alamat itu bisa diubah dan wilayahnya dipilih dari daftar
> resmi kurir supaya ongkirnya persis.

---

## Babak 3 — Bayar dengan kartu uji

Popup yang muncul adalah Midtrans sungguhan dalam mode sandbox. Uangnya tidak
nyata.

| Isian | Diisi dengan |
| --- | --- |
| Nomor kartu | `4811 1111 1111 1114` |
| Masa berlaku | bulan/tahun mana pun yang belum lewat, misal `12/28` |
| CVV | `123` |
| OTP / 3DS | `112233` |

Setelah berhasil, tutup popupnya dan buka **Pesanan Saya**. Status berubah
menjadi **Diproses** dalam waktu sekitar satu menit.

Perubahan itu bukan karena browser bilang begitu. Backend menanyakan sendiri
hasilnya ke Midtrans setiap 60 detik, jadi status lunas tidak pernah bisa
dipalsukan dari sisi pembeli.

---

## Babak 4 — Proses dan kirim pesanannya

> Kembali ke jendela pengelola

1. Menu **Pesanan** → buka pesanan yang baru masuk.
2. Ubah status menjadi **Dikirim**. **Nomor resi wajib diisi** — tanpa itu
   sistem menolak, karena pesanan "dikirim" tanpa resi tidak bisa dilacak
   siapa pun.
3. Kembali ke jendela pembeli, buka **Pesanan Saya**: riwayat perjalanan
   pesanannya sudah bertambah, lengkap dengan waktu setiap perpindahan.
4. Klik **Barang diterima** → status menjadi **Selesai** dan penjualannya
   masuk ke omzet.

Coba juga hal-hal yang seharusnya ditolak:

- Melompat langsung dari **Menunggu Pembayaran** ke **Selesai**
- Menandai **Dikirim** tanpa mengisi resi
- Menghidupkan kembali pesanan yang sudah dibatalkan

---

## Babak 5 — Ajukan komplain, lalu tangani

Ini jalur untuk barang rusak, salah kirim, atau tidak sampai.

**Sebagai pembeli:**

1. Buka pesanan yang sudah selesai → **Ajukan komplain**.
2. Pilih jenis kendala, tulis alasannya, dan unggah foto bukti.

**Sebagai pengelola:**

3. Menu **Komplain & Retur** → buka komplainnya. Foto buktinya tampil di sini.
4. Pilih tindakannya:
   - **Retur disetujui** → barang kembali ke stok
   - **Ganti rugi** → uang keluar dicatat di arus kas
   - **Ditolak** → beserta alasannya

Periksa **Kartu Stok** sesudahnya: perubahan stoknya tercatat lengkap dengan
penyebabnya, bukan cuma angka yang berubah entah kenapa.

---

## Babak 6 — Catat penjualan di toko fisik

Pembeli yang datang langsung tidak punya akun, tetapi penjualannya tetap harus
memotong stok dan masuk pembukuan yang sama.

1. Menu **Kasir Offline** → pilih barang → catat pembayaran tunai.
2. Pesanannya muncul di daftar **Pesanan** dengan pembeli bertanda **Offline**.
3. Buka **Stok** dan **Arus Kas**: keduanya sudah ikut berubah, persis seperti
   penjualan online.

Inilah gunanya satu aplikasi: stok di toko fisik dan stok di katalog online
tidak pernah berbeda.

---

## Babak 7 — Baca laporannya

Catat dulu satu pengeluaran supaya laporannya punya isi di kedua sisi.

| Menu | Isinya |
| --- | --- |
| **Pengeluaran** | Sewa, listrik, plastik kemasan, dan biaya lain |
| **Arus Kas** | Uang masuk dan keluar berurutan waktu |
| **Laba Rugi** | Omzet dikurangi harga pokok dan biaya |
| **Laporan Bulanan** | Bisa diunduh sebagai PDF dan CSV |
| **Analisis Penjualan** | Tren enam bulan, per kategori, pelanggan teratas |
| **Kartu Stok** | Setiap butir perubahan stok beserta penyebabnya |

Satu hal yang perlu diperhatikan di **Laba Rugi**: harga pokok diambil dari
harga modal yang tercatat **saat barang itu terjual**, bukan harga modal hari
ini. Kalau tidak begitu, mengubah harga modal hari ini akan diam-diam mengubah
laba bulan lalu.

---

## Menguji hal yang tidak normal

Empat percobaan cepat yang seharusnya **ditolak**. Kalau ada yang lolos, itu
masalah:

- Pesan barang melebihi stok yang tersisa
- Tandai pesanan **Dikirim** tanpa mengisi nomor resi
- Sebagai pembeli, ketik `/Dashboard` di alamat browser
- Ajukan komplain dua kali untuk pesanan yang sama

Untuk pengujian yang jauh lebih menyeluruh — 234 pemeriksaan, termasuk enam
pembeli berebut satu barang terakhir — lihat [3. Pengujian](3-pengujian.md).

---

## Membersihkan setelah selesai mencoba

Barang percobaan dan pesanan uji akan mengotori laporan. Sebelum mulai
memakai aplikasinya dengan sungguhan:

```powershell
powershell -ExecutionPolicy Bypass -File operasi\cadangkan.ps1          # selalu cadangkan dulu
powershell -ExecutionPolicy Bypass -File operasi\kosongkan-data.ps1     # kosongkan katalog, pesanan, pembukuan
```

Akun pengelola tidak ikut terhapus.

---

**Selanjutnya:** [3. Pengujian →](3-pengujian.md)
