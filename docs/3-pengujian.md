[← Kembali ke daftar panduan](../README.md)

# 3. Pengujian

Rangkaian uji otomatis memanggil API sungguhan pada aplikasi yang sedang
berjalan — bukan tiruan. Jadi yang dibuktikan benar-benar perilaku aplikasi,
bukan perilaku yang dianggap benar oleh pengujiannya sendiri.

---

## Menjalankannya

Pastikan backend dan frontend hidup, lalu:

```powershell
powershell -ExecutionPolicy Bypass -File uji\jalankan-semua.ps1
```

Hasil terakhir: **234 lulus, 0 gagal, 2 dilewati** (kuota kurir habis).

> ### Peringatan
>
> **Rangkaian uji mengisi database dengan data palsu** — produk uji, pesanan
> uji, arus kas uji. Kalau tidak dibersihkan, laporan keuangan Anda akan
> menampilkan omzet yang tidak pernah terjadi.
>
> Selalu jalankan ini sesudahnya:
>
> ```powershell
> powershell -ExecutionPolicy Bypass -File operasi\kosongkan-data.ps1
> ```

Bisa juga dijalankan satu per satu:

```powershell
powershell -ExecutionPolicy Bypass -File uji\uji-normal.ps1          # alur wajar, 102 pemeriksaan
powershell -ExecutionPolicy Bypass -File uji\uji-tambahan.ps1        # fitur baru, 58 pemeriksaan
powershell -ExecutionPolicy Bypass -File uji\uji-tidak-normal.ps1    # penyalahgunaan, 74 pemeriksaan
```

Urutannya penting kalau dijalankan sekaligus: uji pembatas laju permintaan
memblokir pencarian wilayah selama 60 detik, jadi ia dijalankan paling akhir.

---

## Yang diperiksa

### Alur wajar (`uji-normal.ps1`)

Masuk sebagai kedua peran, katalog dan penyaringnya, keranjang, alamat,
checkout, seluruh perpindahan status pesanan, pelacakan, retur, kasir offline,
pengeluaran, arus kas, laba rugi, laporan bulanan, dan analisis penjualan.

### Fitur baru (`uji-tambahan.ps1`)

Pemberitahuan dalam aplikasi, pengelolaan akun, unggahan berkas, dan:

- **Foto produk** — foto disimpan sebagai berkas bukan teks panjang di
  database, berkas lama dibuang saat foto diganti, tautan dari luar tetap
  dipakai apa adanya, berkas bukan gambar ditolak, dan foto ikut terhapus
  saat produknya dihapus
- **Kesiapan operasi** — endpoint kesehatan terjawab tanpa perlu masuk, dan
  jam server benar-benar jam Indonesia

### Penyalahgunaan (`uji-tidak-normal.ps1`)

Bagian ini yang paling banyak menemukan masalah nyata:

| Yang dicoba | Yang harus terjadi |
| --- | --- |
| Enam pembeli berebut satu barang terakhir, bersamaan | Tepat satu yang lolos, stok tidak pernah minus |
| Mendaftarkan diri sendiri sebagai admin | Ditolak begitu toko sudah ada penghuninya |
| Membuka data pelanggan lain | Ditolak, kepemilikan diperiksa di server |
| Notifikasi pembayaran Midtrans palsu | Ditolak karena tanda tangannya tidak cocok |
| Melompati urutan status pesanan | Ditolak dengan pesan yang jelas |
| Menandai dikirim tanpa nomor resi | Ditolak |
| Nama produk sepanjang 5000 huruf | Ditolak rapi, bukan galat mentah |
| Alamat API yang tidak ada | Dijawab 404, bukan 500 |
| Permintaan beruntun tanpa henti | Dibatasi dengan 429 |
| Menghapus produk yang masih ada di keranjang orang | Berhasil, keranjangnya ikut dibersihkan, riwayat pesanan tetap utuh |

---

## Membaca hasilnya

```
  OK    barang kembali ke stok 1 -> 2
  GAGAL menandai dikirim tanpa resi ditolak
  LEWAT pelacakan resi karangan - Layanan pelacakan sedang tidak bisa dihubungi
```

- **OK** — sesuai harapan
- **GAGAL** — perlu diperbaiki
- **LEWAT** — layanan luar sedang tidak bisa dipanggil, bukan kesalahan kode

Baris **LEWAT** biasanya muncul saat kuota harian RajaOngkir habis. Itu wajar
dan tidak berarti ada yang rusak.

---

## Kalau ada yang gagal

Pesan galatnya dicetak apa adanya dari backend, jadi biasanya sudah cukup
menjelaskan. Kalau perlu menelusuri lebih dalam, jalankan berkas ujinya
sendirian supaya keluarannya tidak tercampur, lalu cocokkan dengan log backend.

Perlu diingat: uji yang gagal belum tentu berarti kodenya salah. Bisa jadi
perilakunya memang sengaja diubah dan ujinya yang perlu menyesuaikan — seperti
yang terjadi saat ongkir tanpa tujuan diubah dari "ditolak" menjadi "diberi
tarif cadangan".

---

**Selanjutnya:** [4. Deploy →](4-deploy.md)
