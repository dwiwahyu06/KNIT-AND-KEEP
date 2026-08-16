# =============================================================================
#  FITUR BARU - pengelolaan akun, pemberitahuan, laporan analisis, dan
#  pengubahan alamat, beserta penyalahgunaannya.
#
#      powershell -ExecutionPolicy Bypass -File uji/uji-tambahan.ps1
# =============================================================================
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\pustaka.ps1"

Write-Host "`n########## FITUR BARU ##########"

$admin = MasukAdmin
$pelanggan = MasukPelanggan

# ---------------------------------------------------------------------------
Bagian "1. Lubang pendaftaran pengelola sudah ditutup"
$nama = "penyusup$((Get-Random -Maximum 999999))"

$h = Coba POST "$B/auth/register" @{
    username = $nama; email = "$nama@mail.com"; password = "rahasia123"; role = "ADMIN"
}
Cek "orang luar tidak bisa mendaftar sebagai pengelola" ($h.kode -eq 403) $h.pesan

$h = Coba POST "$B/auth/login" @{ username = $nama; password = "rahasia123" }
Cek "akun penyusup memang tidak pernah terbuat" ($h.kode -eq 400) $h.pesan

$kosong = Get1 "$B/auth/perlu-pengelola-pertama"
Cek "toko dilaporkan sudah punya pengelola" ($kosong.kosong -eq $false)

# ---------------------------------------------------------------------------
Bagian "2. Pengelola menambah pengelola lain"
$namaBaru = "kelola$((Get-Random -Maximum 999999))"
$buat = Post1 "$B/auth/register" @{
    username = $namaBaru; email = "$namaBaru@mail.com"; password = "rahasia123"
} $admin
Cek "admin bisa menambah pengelola" ($buat.success -eq $true) $buat.message

$masuk = Post1 "$B/auth/login" @{ username = $namaBaru; password = "rahasia123" }
Cek "pengelola baru bisa masuk" ($masuk.user.role -eq "ADMIN")
Cek "pengelola baru bisa membuka dashboard" ($null -ne (Get1 "$B/dashboard/summary" $masuk.token))

$h = Coba POST "$B/auth/register" @{ username = "x$namaBaru"; email = "x$namaBaru@mail.com"; password = "123" } $admin
Cek "password pendek ditolak" ($h.kode -eq 400) $h.pesan

$daftarAdmin = GetArr "$B/auth/admins" $admin
$idBaru = ($daftarAdmin | Where-Object { $_.username -eq $namaBaru }).id

Put1 "$B/auth/admins/$idBaru/password" @{ passwordBaru = "sandibaru123" } $admin | Out-Null
$h = Coba POST "$B/auth/login" @{ username = $namaBaru; password = "rahasia123" }
Cek "password lama tidak berlaku setelah diatur ulang" ($h.kode -eq 400)
$masukLagi = Post1 "$B/auth/login" @{ username = $namaBaru; password = "sandibaru123" }
Cek "password baru berlaku" ($masukLagi.user.role -eq "ADMIN")

$h = Coba DELETE "$B/auth/admins/$idBaru" $null $pelanggan.token
Cek "pelanggan tidak bisa menghapus pengelola" ($h.kode -eq 403)

Del1 "$B/auth/admins/$idBaru" $admin | Out-Null
$sesudah = GetArr "$B/auth/admins" $admin
Cek "pengelola bisa dihapus" (@($sesudah | Where-Object { $_.id -eq $idBaru }).Count -eq 0)

$sayaSendiri = ($sesudah | Where-Object { $_.username -eq "admin" }).id
$h = Coba DELETE "$B/auth/admins/$sayaSendiri" $null $admin
Cek "tidak bisa menghapus akun sendiri" ($h.kode -eq 400) $h.pesan

# ---------------------------------------------------------------------------
Bagian "3. Menonaktifkan akun pelanggan"
$korban = BuatPelangganBaru
Cek "pelanggan baru bisa masuk sebelum dinonaktifkan" ($korban.token.Length -gt 20)

$h = Coba PUT "$B/pelanggan/$($korban.id)/status" @{ aktif = $false } $pelanggan.token
Cek "pelanggan tidak bisa menonaktifkan akun lain" ($h.kode -eq 403)

$mati = Put1 "$B/pelanggan/$($korban.id)/status" @{ aktif = $false } $admin
Cek "admin bisa menonaktifkan akun" ($mati.aktif -eq $false) $mati.message

$h = Coba POST "$B/pelanggan/login" @{ username = $korban.nama; password = "rahasia123" }
Cek "akun nonaktif tidak bisa masuk" ($h.kode -eq 400) $h.pesan

Put1 "$B/pelanggan/$($korban.id)/status" @{ aktif = $true } $admin | Out-Null
$hidupLagi = Post1 "$B/pelanggan/login" @{ username = $korban.nama; password = "rahasia123" }
Cek "akun bisa diaktifkan kembali" ($hidupLagi.token.Length -gt 20)

# ---------------------------------------------------------------------------
Bagian "4. Pemberitahuan untuk pelanggan"
$produk = BuatProduk $admin "Mantel Uji Kabar" 5
$alamat = AlamatSiapPakai $pelanggan
$pesanan = Checkout $pelanggan $produk.id 1 $alamat

$sebelum = (Get1 "$B/notifikasi/jumlah-belum-dibaca" $pelanggan.token).belumDibaca

Post1 "$B/orders/admin/$($pesanan.id)/konfirmasi-pembayaran" @{ metodeBayar = "TUNAI" } $admin | Out-Null
$sesudahBayar = (Get1 "$B/notifikasi/jumlah-belum-dibaca" $pelanggan.token).belumDibaca
Cek "pelanggan dikabari saat pembayaran dikonfirmasi" ($sesudahBayar -gt $sebelum) "$sebelum -> $sesudahBayar"

Put1 "$B/orders/admin/update/$($pesanan.id)" @{
    status = "DIKIRIM"; nomorResi = "KABAR123456"; kurir = "tiki"
} $admin | Out-Null
$kabar = Get1 "$B/notifikasi?halaman=0&ukuran=10" $pelanggan.token
$terbaru = $kabar.isi[0]
Cek "kabar pengiriman memuat nomor resi" ($terbaru.pesan -like "*KABAR123456*") $terbaru.judul
Cek "kabar menyimpan nomor pesanan" ($terbaru.referensi -eq $pesanan.orderId)

$h = Coba GET "$B/notifikasi" $null $null
Cek "kabar tidak bisa dibaca tanpa masuk" ($h.kode -eq 401)

$lain = BuatPelangganBaru
$kabarLain = Get1 "$B/notifikasi?halaman=0&ukuran=10" $lain.token
Cek "pelanggan lain tidak melihat kabar milik orang" ($kabarLain.isi.Count -eq 0)

Put1 "$B/notifikasi/baca-semua" @{} $pelanggan.token | Out-Null
Cek "tandai semua dibaca bekerja" (
    (Get1 "$B/notifikasi/jumlah-belum-dibaca" $pelanggan.token).belumDibaca -eq 0)

# Pelanggan menandai barang diterima sendiri - tidak perlu dikabari lagi.
Post1 "$B/orders/$($pesanan.id)/terima" @{} $pelanggan.token | Out-Null
Cek "tindakan sendiri tidak menghasilkan kabar" (
    (Get1 "$B/notifikasi/jumlah-belum-dibaca" $pelanggan.token).belumDibaca -eq 0)

# ---------------------------------------------------------------------------
Bagian "5. Laporan analisis"
Post1 "$B/orders/admin/offline" @{
    items = @(@{ productId = $produk.id; quantity = 2 })
    namaPelanggan = "Offline"; metodeBayar = "TUNAI"
} $admin | Out-Null

$kategori = GetArr "$B/reports/kategori" $admin
Cek "laporan per kategori berisi data" ($kategori.Count -ge 1) "$($kategori.Count) kategori"
Cek "laporan kategori menghitung laba" ($null -ne $kategori[0].laba)

$pelangganTeratas = GetArr "$B/reports/pelanggan" $admin
Cek "laporan per pelanggan berisi data" ($pelangganTeratas.Count -ge 1)
Cek "laporan pelanggan menghitung rata-rata" ($null -ne $pelangganTeratas[0].rataRata)

$rekap = Get1 "$B/reports/retur" $admin
Cek "rekap retur tersedia" ($null -ne $rekap.perJenis)

$h = Coba GET "$B/reports/kategori" $null $pelanggan.token
Cek "pelanggan tidak bisa membuka laporan" ($h.kode -eq 403)

# ---------------------------------------------------------------------------
Bagian "6. Filter periode di arus kas dan pengeluaran"
$hariIni = (Get-Date).ToString("yyyy-MM-dd")
$besok = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
$lampau = (Get-Date).AddYears(-2).ToString("yyyy-MM-dd")
$lampauAkhir = (Get-Date).AddYears(-1).ToString("yyyy-MM-dd")

Post1 "$B/expenses" @{ description = "Uji filter periode"; amount = 25000; category = "Operasional" } $admin | Out-Null

$kasHariIni = GetArr "$B/cashflow?dari=$hariIni&sampai=$besok" $admin
$kasLampau = GetArr "$B/cashflow?dari=$lampau&sampai=$lampauAkhir" $admin
Cek "arus kas tersaring per periode" ($kasHariIni.Count -gt 0 -and $kasLampau.Count -eq 0) "hari ini $($kasHariIni.Count), periode lampau $($kasLampau.Count)"

$ringkasKas = Get1 "$B/cashflow/ringkasan?dari=$lampau&sampai=$lampauAkhir" $admin
Cek "ringkasan arus kas ikut tersaring" ($ringkasKas.jumlahCatatan -eq 0)

$biayaHariIni = GetArr "$B/expenses?dari=$hariIni&sampai=$besok" $admin
$biayaLampau = GetArr "$B/expenses?dari=$lampau&sampai=$lampauAkhir" $admin
Cek "pengeluaran tersaring per periode" ($biayaHariIni.Count -gt 0 -and $biayaLampau.Count -eq 0)

$biayaKategori = GetArr "$B/expenses?kategori=Operasional" $admin
Cek "pengeluaran tersaring per kategori" ($biayaKategori.Count -ge 1)

$dashLampau = Get1 "$B/dashboard/summary?dari=$lampau&sampai=$lampauAkhir" $admin
Cek "dashboard ikut tersaring periode" ($dashLampau.omzetTotal -eq 0) "omzet periode lampau $($dashLampau.omzetTotal)"

# ---------------------------------------------------------------------------
Bagian "7. Mengubah alamat"
$alamatBaru = Get1 "$B/addresses/$($alamat.id)" $pelanggan.token
Cek "alamat bisa dibuka pemiliknya" ($alamatBaru.id -eq $alamat.id)

$diubah = Put1 "$B/addresses/$($alamat.id)" @{
    namaPenerima = "Budi Diubah"; teleponPenerima = "081299998888"
    detailAlamat = "Jl. Melati No. 99"; rt = "007"; rw = "009"
    provinsi = $alamatBaru.provinsi; kabupaten = $alamatBaru.kabupaten
    kecamatan = $alamatBaru.kecamatan; kelurahan = $alamatBaru.kelurahan
    kodePos = $alamatBaru.kodePos; destinationId = $alamatBaru.destinationId
    labelTujuan = $alamatBaru.labelTujuan
} $pelanggan.token
Cek "alamat berhasil diubah" ($diubah.namaPenerima -eq "Budi Diubah")
Cek "titik kirim tetap terjaga" ($diubah.destinationId -eq $alamatBaru.destinationId)

$h = Coba PUT "$B/addresses/$($alamat.id)" @{ namaPenerima = "Dibajak" } $lain.token
Cek "alamat orang lain tidak bisa diubah" ($h.kode -eq 403)

# ---------------------------------------------------------------------------
Bagian "8. Foto bukti disimpan sebagai berkas"
$pesananFoto = Checkout $pelanggan $produk.id 1 $alamat
Post1 "$B/orders/admin/$($pesananFoto.id)/konfirmasi-pembayaran" @{ metodeBayar = "TUNAI" } $admin | Out-Null

# Gambar PNG 1x1 piksel sebagai data URI.
$piksel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
$returFoto = Post1 "$B/retur" @{
    transactionId = $pesananFoto.id; jenisKendala = "BARANG_RUSAK"
    alasan = "Ada sobek"; fotoBukti = $piksel
} $pelanggan.token
Cek "foto disimpan sebagai alamat berkas, bukan teks panjang" (
    $returFoto.fotoBukti -like "/unggahan/*" -and $returFoto.fotoBukti.Length -lt 100) $returFoto.fotoBukti

try {
    $gambar = Invoke-WebRequest -Uri "http://localhost:8080$($returFoto.fotoBukti)" -UseBasicParsing -TimeoutSec 10
    Cek "berkas foto bisa dibuka dari peramban" ($gambar.StatusCode -eq 200 -and $gambar.RawContentLength -gt 0)
} catch { Cek "berkas foto bisa dibuka dari peramban" $false $_.Exception.Message }

# Pesanan baru, supaya yang diuji benar-benar pemeriksaan jenis berkas —
# bukan penjaga komplain ganda pada pesanan sebelumnya.
$pesananBukanGambar = Checkout $pelanggan $produk.id 1 $alamat
Post1 "$B/orders/admin/$($pesananBukanGambar.id)/konfirmasi-pembayaran" @{ metodeBayar = "TUNAI" } $admin | Out-Null
$h = Coba POST "$B/retur" @{
    transactionId = $pesananBukanGambar.id; jenisKendala = "SALAH_KIRIM"
    alasan = "uji"; fotoBukti = "data:text/html;base64,PHNjcmlwdD4="
} $pelanggan.token
Cek "berkas bukan gambar ditolak" (
    $h.kode -eq 400 -and $h.pesan -like "*gambar*") $h.pesan

$h = Coba POST "$B/retur" @{
    transactionId = $pesananBukanGambar.id; jenisKendala = "SALAH_KIRIM"
    alasan = "uji"; fotoBukti = "data:image/png;base64,bukan-base64-yang-sah!!!"
} $pelanggan.token
Cek "gambar rusak ditolak" ($h.kode -eq 400) $h.pesan

# ---------------------------------------------------------------------------
Bagian "9. Halaman baru termuat"
foreach ($h in "/Analisis", "/alamat-form/$($alamat.id)", "/Registrasi") {
    try {
        $r = Invoke-WebRequest "$F$h" -UseBasicParsing -TimeoutSec 15
        Cek "halaman $h termuat" ($r.StatusCode -eq 200)
    } catch { Cek "halaman $h termuat" $false $_.Exception.Message }
}

# ---------------------------------------------------------------------------
Bagian "10. Foto produk"

# Foto yang diunggah dari perangkat datang sebagai data URI. Kalau disimpan
# mentah, satu foto ponsel tidak muat di kolomnya dan membuat setiap baris
# produk membengkak - jadi yang tersimpan harus alamat berkasnya saja.
$pngMerah = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8BQz0AEYBxVSF+FAP2FBPtdT1BUAAAAAElFTkSuQmCC"
$pngBiru  = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9Qz0AEYBxVSF+FAP1jBPtRz9y7AAAAAElFTkSuQmCC"

$produkFoto = Post1 "$B/products" @{
    name = "Uji Foto Produk"; costPrice = 1000; sellPrice = 2000; stock = 1
    image = $pngMerah
} $admin
Cek "foto unggahan disimpan sebagai berkas" ($produkFoto.image -like "/unggahan/*") $produkFoto.image
Cek "yang tersimpan jauh lebih pendek dari data URI-nya" (
    $produkFoto.image.Length -lt $pngMerah.Length) "$($produkFoto.image.Length) vs $($pngMerah.Length) karakter"

$h = Coba GET "http://localhost:8080$($produkFoto.image)"
Cek "berkas fotonya bisa dibuka peramban" ($h.kode -eq 200) "HTTP $($h.kode)"

$fotoLama = $produkFoto.image
$diganti = Put1 "$B/products/$($produkFoto.id)" @{
    name = "Uji Foto Produk"; costPrice = 1000; sellPrice = 2000; stock = 1
    image = $pngBiru
} $admin
Cek "mengganti foto menghasilkan berkas baru" ($diganti.image -ne $fotoLama) $diganti.image

# Tanpa ini, folder unggahan menumpuk foto yang tidak dipakai selamanya.
$h = Coba GET "http://localhost:8080$fotoLama"
Cek "berkas foto lama ikut dibuang" ($h.kode -eq 404) "HTTP $($h.kode)"

$tautanLuar = Put1 "$B/products/$($produkFoto.id)" @{
    name = "Uji Foto Produk"; costPrice = 1000; sellPrice = 2000; stock = 1
    image = "https://contoh.com/kaos.jpg"
} $admin
Cek "tautan gambar dari luar tetap dipakai apa adanya" (
    $tautanLuar.image -eq "https://contoh.com/kaos.jpg") $tautanLuar.image

$h = Coba POST "$B/products" @{
    name = "Uji Tolak Foto"; costPrice = 1; sellPrice = 1; stock = 1
    image = "data:text/html;base64,PHNjcmlwdD4="
} $admin
Cek "berkas bukan gambar ditolak" ($h.kode -eq 400 -and $h.pesan -like "*gambar*") $h.pesan

$sebelumHapus = Put1 "$B/products/$($produkFoto.id)" @{
    name = "Uji Foto Produk"; costPrice = 1000; sellPrice = 2000; stock = 1
    image = $pngMerah
} $admin
Del1 "$B/products/$($produkFoto.id)" $admin | Out-Null
$h = Coba GET "http://localhost:8080$($sebelumHapus.image)"
Cek "menghapus produk ikut membuang fotonya" ($h.kode -eq 404) "HTTP $($h.kode)"

# ---------------------------------------------------------------------------
Bagian "11. Kesiapan operasi jangka panjang"

# Dipanggil layanan pemantauan dari luar, jadi harus terjawab tanpa token.
$sehat = Get1 "$B/kesehatan"
Cek "kesehatan terjawab tanpa perlu masuk" ($sehat.status -eq "sehat") $sehat.status
Cek "kesehatan melaporkan database terhubung" ($sehat.database -eq "terhubung")
Cek "zona waktu terkunci ke Asia/Jakarta" ($sehat.zonaWaktu -eq "Asia/Jakarta") $sehat.zonaWaktu

# Laporan harian memakai tanggal server. Kalau servernya UTC dan zona waktu
# tidak dikunci, penjualan sore hari jatuh ke tanggal kemarin.
$jamServer = [datetime]::Parse($sehat.waktu)
$selisih = [math]::Abs((New-TimeSpan -Start $jamServer -End (Get-Date)).TotalMinutes)
Cek "jam server sama dengan jam Indonesia" ($selisih -lt 5) "beda $([math]::Round($selisih)) menit"

Ringkasan "FITUR BARU"
if ($script:gagal -gt 0) { exit 1 }
exit 0
