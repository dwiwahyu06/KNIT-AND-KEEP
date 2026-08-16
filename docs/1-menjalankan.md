[← Kembali ke daftar panduan](../README.md)

# 1. Menjalankan di komputer sendiri

---

## Yang perlu terpasang

| Perkakas | Versi | Keterangan |
| --- | --- | --- |
| Java (JDK) | 17 atau lebih baru | Backend memakai Java 17 |
| Node.js | 20 atau lebih baru | Untuk menjalankan frontend |
| pnpm | 9 atau lebih baru | `npm install -g pnpm` |
| Docker Desktop | terbaru | Menjalankan PostgreSQL tanpa memasangnya langsung |

Maven tidak perlu dipasang. Proyek ini membawa `mvnw` sendiri.

### Menjalankan skrip `.ps1`

Skrip di folder `uji/` dan `operasi/` ditulis untuk **Windows PowerShell 5.1**
yang sudah ada bawaan di Windows. Jalankan dengan bentuk ini:

```powershell
powershell -ExecutionPolicy Bypass -File uji\jalankan-semua.ps1
```

Perintah `pwsh` hanya tersedia kalau PowerShell 7 dipasang terpisah. Kalau
muncul `pwsh is not recognized`, pakai bentuk di atas.

---

## Tiga hal yang harus hidup

Jalankan berurutan. Backend dan frontend masing-masing perlu jendela terminal
sendiri karena keduanya terus berjalan.

### 1. Database

```bash
docker start knit-and-keep-db
```

Kalau containernya belum pernah dibuat:

```bash
docker run --name knit-and-keep-db \
  -e POSTGRES_PASSWORD=12345 \
  -e POSTGRES_DB=knit-and-keep \
  -p 5432:5432 -d postgres:15
```

### 2. Backend

```bash
cd backend
.\mvnw.cmd -o spring-boot:run
```

Berhasil kalau muncul `Started BackendApplication`.

### 3. Frontend

```bash
cd frontend
pnpm install     # cukup sekali
pnpm dev
```

---

## Memastikan semuanya sehat

Buka <http://localhost:8080/api/kesehatan>. Jawabannya harus seperti ini:

```json
{
  "waktu": "2026-08-16T16:00:00",
  "zonaWaktu": "Asia/Jakarta",
  "mode": "pengembangan",
  "database": "terhubung",
  "jumlahProduk": 0,
  "jumlahPesanan": 0,
  "status": "sehat"
}
```

Kalau `database` bukan `terhubung`, containernya belum menyala.

| Alamat | Isinya |
| --- | --- |
| <http://localhost:5173> | Toko untuk pembeli |
| <http://localhost:5173/login> | Masuk sebagai pengelola |
| <http://localhost:8080/api> | Backend |

Akun pengelola bawaan: **`admin` / `admin123`**. Akun ini hanya dibuat di mode
pengembangan; di server, kata sandinya dibuat acak (lihat
[Deploy](4-deploy.md)).

---

## Kendala yang sudah diketahui

### Kenapa harus `mvnw -o`?

Tanda `-o` berarti *offline*. Jaringan tempat proyek ini dikerjakan memutus
sambungan TLS ke Maven Central, jadi backend hanya bisa dibangun dari
dependency yang sudah tersimpan di komputer. Di jaringan normal — termasuk di
server nanti — tanda ini tidak diperlukan.

Karena alasan yang sama, **hindari `mvnw clean`**: plugin pembersihnya ikut
tidak tersedia. Kalau perlu membersihkan hasil build, hapus sendiri folder
`backend/target/classes`.

### Kuota layanan kurir

RajaOngkir punya batas panggilan harian. Kalau kuotanya habis:

- Pencarian wilayah di formulir alamat gagal. **Klik "Isi wilayah sendiri"**
  yang muncul di bawah pesan galatnya, lalu isi provinsi dan kabupaten.
- Ongkos kirim memakai tarif perkiraan toko dan ditandai "perkiraan".
- Pelacakan resi tidak bisa dipanggil.

Toko tetap bisa menerima pesanan sepenuhnya. Ini memang dirancang begitu:
layanan pihak lain yang mati tidak boleh menghentikan penjualan.

### Port sudah dipakai

Kalau backend menolak menyala karena port 8080 sudah terisi, biasanya masih ada
proses Java lama yang berjalan:

```powershell
Get-Process java | Stop-Process -Force
```

Hati-hati kalau VS Code juga sedang menjalankan aplikasinya — perintah di atas
akan ikut menghentikannya.

### Data contoh tidak muncul

Memang. `DATA_CONTOH` bawaannya `false`, jadi katalog dibiarkan kosong supaya
bisa diisi barang sungguhan. Kalau ingin melihat sepuluh produk contoh lagi,
jalankan backend dengan `DATA_CONTOH=true` pada database yang katalognya masih
kosong.

---

**Selanjutnya:** [2. Panduan mencoba →](2-panduan-mencoba.md)
