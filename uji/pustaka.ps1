# =============================================================================
#  Pustaka bersama untuk skrip pengujian.
#  Berisi pembungkus HTTP, penghitung hasil, dan pembantu yang dipakai berulang.
# =============================================================================

$script:B = "http://localhost:8080/api"
$script:F = "http://localhost:5173"

$script:lulus = 0
$script:gagal = 0
$script:daftarGagal = @()

function J($o) { $o | ConvertTo-Json -Depth 12 }
function Hdr($token) { if ($token) { @{ Authorization = "Bearer $token" } } else { @{} } }

function PesanGalat($e) {
    if (-not $e.Exception.Response) { return $e.Exception.Message }
    try {
        $s = New-Object System.IO.StreamReader($e.Exception.Response.GetResponseStream())
        $isi = $s.ReadToEnd()
        try { return ($isi | ConvertFrom-Json).message } catch { return $isi }
    } catch { return $e.Exception.Message }
}

function KodeHttp($e) {
    if ($e.Exception.Response) { return [int]$e.Exception.Response.StatusCode.value__ }
    return 0
}

# --- permintaan yang diharapkan berhasil ---------------------------------
function Get1($u, $token = $null) {
    try { Invoke-RestMethod -Uri $u -Method GET -Headers (Hdr $token) }
    catch { throw "GET $u gagal: $(PesanGalat $_)" }
}

# Invoke-RestMethod kadang menggabungkan larik JSON menjadi satu objek berisi
# properti larik, jadi daftar dibaca mentah lalu diubah sendiri.
function GetArr($u, $token = $null) {
    try {
        $r = Invoke-WebRequest -Uri $u -Method GET -Headers (Hdr $token) -UseBasicParsing
        if (-not $r.Content) { return @() }
        $data = $r.Content | ConvertFrom-Json

        # ConvertFrom-Json mengeluarkan larik JSON sebagai satu objek larik, bukan
        # sebagai aliran elemen. Kalau langsung dibungkus @(), hasilnya daftar
        # berisi satu elemen yang isinya larik aslinya. Pemeriksaan sesudahnya
        # lalu membaca properti larik - Count, Length, Rank - dan bukan isi
        # datanya, sehingga uji bisa lulus tanpa benar-benar memeriksa apa pun.
        $keluar = @()
        foreach ($x in $data) { $keluar += $x }
        return ,$keluar
    } catch { throw "GET $u gagal: $(PesanGalat $_)" }
}

function Post1($u, $b, $token = $null) {
    try { Invoke-RestMethod -Uri $u -Method POST -ContentType "application/json" -Body (J $b) -Headers (Hdr $token) }
    catch { throw "POST $u gagal: $(PesanGalat $_)" }
}

function Put1($u, $b, $token = $null) {
    try { Invoke-RestMethod -Uri $u -Method PUT -ContentType "application/json" -Body (J $b) -Headers (Hdr $token) }
    catch { throw "PUT $u gagal: $(PesanGalat $_)" }
}

function Del1($u, $token = $null) {
    try { Invoke-RestMethod -Uri $u -Method DELETE -Headers (Hdr $token) }
    catch { throw "DELETE $u gagal: $(PesanGalat $_)" }
}

# --- permintaan yang diharapkan DITOLAK -----------------------------------
# Mengembalikan objek berisi kode HTTP dan pesannya, tanpa melempar galat.
function Coba($metode, $u, $b = $null, $token = $null) {
    try {
        $param = @{ Uri = $u; Method = $metode; Headers = (Hdr $token) }
        if ($null -ne $b) {
            $param.ContentType = "application/json"
            $param.Body = (J $b)
        }
        $hasil = Invoke-RestMethod @param
        return [pscustomobject]@{ kode = 200; pesan = ""; data = $hasil }
    } catch {
        return [pscustomobject]@{ kode = (KodeHttp $_); pesan = (PesanGalat $_); data = $null }
    }
}

# --- pencatat hasil --------------------------------------------------------
function Cek($nama, $syarat, $detail = "") {
    if ($syarat) {
        Write-Host "  OK    $nama $detail" -ForegroundColor DarkGreen
        $script:lulus++
    } else {
        Write-Host "  GAGAL $nama $detail" -ForegroundColor Red
        $script:gagal++
        $script:daftarGagal += "$nama $detail"
    }
}

$script:dilewati = 0

# Dipakai saat layanan luar sedang tidak bisa dipanggil - misalnya kuota harian
# RajaOngkir habis. Ini bukan cacat aplikasi, jadi tidak dihitung sebagai gagal,
# tetapi tetap dilaporkan supaya tidak terlihat seolah-olah sudah teruji.
function Lewati($nama, $alasan) {
    Write-Host "  LEWAT $nama - $alasan" -ForegroundColor DarkYellow
    $script:dilewati++
}

function Bagian($judul) {
    Write-Host ""
    Write-Host "  $judul" -ForegroundColor Cyan
    Write-Host "  $('-' * $judul.Length)" -ForegroundColor DarkGray
}

function Ringkasan($namaSuite) {
    Write-Host ""
    Write-Host ("=" * 60)
    Write-Host " $namaSuite"
    Write-Host " LULUS : $script:lulus"
    if ($script:dilewati -gt 0) {
        Write-Host " LEWAT : $script:dilewati (layanan luar sedang tidak bisa dipanggil)" -ForegroundColor DarkYellow
    }
    if ($script:gagal -gt 0) {
        Write-Host " GAGAL : $script:gagal" -ForegroundColor Red
        Write-Host ""
        Write-Host " Yang gagal:" -ForegroundColor Red
        $script:daftarGagal | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    } else {
        Write-Host " GAGAL : 0"
    }
    Write-Host ("=" * 60)
}

# --- pembantu data ---------------------------------------------------------
function MasukAdmin { (Post1 "$B/auth/login" @{ username = "admin"; password = "admin123" }).token }

# Akun ini tidak lagi dibuatkan DataSeeder ketika data contoh dimatikan,
# jadi pengujian menyiapkannya sendiri kalau belum ada. Dengan begitu suite
# tetap jalan di database yang benar-benar kosong.
function MasukPelanggan {
    $h = Coba POST "$B/pelanggan/login" @{ username = "pelanggan"; password = "pelanggan123" }
    if ($h.kode -ne 200) {
        Post1 "$B/pelanggan/register" @{
            username = "pelanggan"; email = "pelanggan@mail.com"; password = "pelanggan123"
        } | Out-Null
        $h = Coba POST "$B/pelanggan/login" @{ username = "pelanggan"; password = "pelanggan123" }
    }
    if ($h.kode -ne 200) { throw "Tidak bisa masuk sebagai pelanggan: $($h.pesan)" }
    return [pscustomobject]@{ token = $h.data.token; id = [int]$h.data.user.id }
}

function BuatPelangganBaru {
    $nama = "uji$((Get-Random -Maximum 999999))"
    Post1 "$B/pelanggan/register" @{ username = $nama; email = "$nama@mail.com"; password = "rahasia123" } | Out-Null
    $r = Post1 "$B/pelanggan/login" @{ username = $nama; password = "rahasia123" }
    return [pscustomobject]@{ token = $r.token; id = [int]$r.user.id; nama = $nama }
}

function BuatProduk($token, $nama, $stok, $modal = 40000, $jual = 100000, $kategori = "Uji") {
    Post1 "$B/products" @{
        name = $nama; category = $kategori; costPrice = $modal; sellPrice = $jual
        stock = $stok; weight = 400; kondisi = "Bagus"; deskripsi = "Barang untuk pengujian otomatis."
    } $token
}

# Alamat contoh sudah disiapkan DataSeeder, jadi pengujian tidak perlu
# memanggil pencarian wilayah yang memakai kuota harian RajaOngkir.
function AlamatSiapPakai($pelanggan) {
    $ada = @(GetArr "$B/pelanggan/$($pelanggan.id)/addresses" $pelanggan.token |
             Where-Object { $_.destinationId }) | Select-Object -First 1
    if ($ada) { return $ada }

    return Post1 "$B/pelanggan/$($pelanggan.id)/addresses" @{
        namaPenerima = "Budi Santoso"; teleponPenerima = "081234512345"
        detailAlamat = "Jl. Melati No. 12"; rt = "003"; rw = "005"
        provinsi = "JAWA BARAT"; kabupaten = "BANDUNG"
        kecamatan = "CIBIRU"; kelurahan = "CIPADUNG"; kodePos = "40614"
        destinationId = "4817"; labelTujuan = "CIPADUNG, CIBIRU, BANDUNG, JAWA BARAT, 40614"
    } $pelanggan.token
}

function Checkout($pelanggan, $produkId, $qty, $alamat, $ongkir = 6000) {
    Post1 "$B/orders/checkout" @{
        pelangganId = [int]$pelanggan.id
        items = @(@{ productId = [int]$produkId; quantity = [int]$qty })
        addressId = [int]$alamat.id
        pengiriman = @{ ongkir = [int]$ongkir; kurir = "tiki"; layanan = "ECO"; estimasi = "4 hari" }
    } $pelanggan.token
}

function Stok($produkId) { [int](Get1 "$B/products/$produkId").stock }
