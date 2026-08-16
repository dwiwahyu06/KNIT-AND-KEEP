# =============================================================================
#  Mengosongkan seluruh data toko, menyisakan akun pengelola.
#
#  Dipakai saat berpindah dari data percobaan ke data sungguhan: katalog,
#  pesanan, pembukuan, dan akun pelanggan dikosongkan supaya laporan mulai dari
#  nol dan tidak bercampur angka hasil pengujian.
#
#  Nomor urut ikut disetel ulang, jadi produk pertama yang Anda masukkan
#  bernomor 1 lagi.
#
#      powershell -ExecutionPolicy Bypass -File operasi/kosongkan-data.ps1
#      powershell -ExecutionPolicy Bypass -File operasi/kosongkan-data.ps1 -Paksa      # tanpa bertanya
#
#  Akun pengelola sengaja tidak ikut dihapus. Kalau ikut terhapus, tidak ada
#  lagi yang bisa masuk ke aplikasinya.
# =============================================================================
param(
    [string]$Container = "knit-and-keep-db",
    [string]$Database = "knit-and-keep",
    [string]$Pengguna = "postgres",
    [string]$FolderUnggahan = "$PSScriptRoot\..\backend\unggahan",
    [switch]$Paksa
)

$ErrorActionPreference = "Stop"

# Semua tabel data toko. 'userr' (akun pengelola) sengaja tidak ada di sini.
$tabel = @(
    "cart_items", "transaction_items", "status_history", "retur",
    "transactions", "addresses", "user_pelanggan", "notifikasi",
    "mutasi_stok", "cash_flows", "expense", "products"
)

function Hitung {
    $sql = ($tabel | ForEach-Object { "SELECT '$_' t, count(*) n FROM $_" }) -join " UNION ALL "
    docker exec $Container psql -U $Pengguna -d $Database -t -A -F "|" -c "$sql ORDER BY t"
}

Write-Host ""
Write-Host "Isi database sekarang:"
$sebelum = Hitung
$total = 0
foreach ($baris in $sebelum) {
    if (-not $baris) { continue }
    $bagian = $baris -split "\|"
    $total += [int]$bagian[1]
    if ([int]$bagian[1] -gt 0) {
        Write-Host ("   {0,-20} {1,5}" -f $bagian[0], $bagian[1])
    }
}

if ($total -eq 0) { Write-Host "   (sudah kosong)" }

# Berkas dihitung terpisah dari baris database. Percobaan sebelumnya bisa
# meninggalkan berkas terkunci yang gagal dihapus, dan kalau skrip berhenti
# hanya karena tabelnya sudah kosong, berkas itu tidak pernah terbersihkan.
$jumlahBerkas = 0
if (Test-Path $FolderUnggahan) {
    $jumlahBerkas = @(Get-ChildItem $FolderUnggahan -File).Count
    if ($jumlahBerkas -gt 0) {
        Write-Host ("   {0,-20} {1,5}" -f "berkas unggahan", $jumlahBerkas)
    }
}

if ($total -eq 0 -and $jumlahBerkas -eq 0) {
    Write-Host ""
    Write-Host "Tidak ada yang perlu dihapus."
    exit 0
}

Write-Host ""
Write-Host "PERINGATAN" -ForegroundColor Yellow
Write-Host "  $total baris dan $jumlahBerkas berkas akan dihapus permanen, termasuk"
Write-Host "  seluruh riwayat pesanan dan pembukuan. Akun pengelola dipertahankan."
Write-Host "  Buat cadangan dulu: powershell -ExecutionPolicy Bypass -File operasi/cadangkan.ps1"
Write-Host ""

if (-not $Paksa) {
    $jawab = Read-Host "Ketik KOSONGKAN untuk melanjutkan"
    if ($jawab -ne "KOSONGKAN") {
        Write-Host "Dibatalkan."
        exit 0
    }
}

if ($total -gt 0) {
    # TRUNCATE ... CASCADE mengurus urutan antar tabel sendiri, jadi tidak perlu
    # menebak mana yang harus dihapus lebih dulu.
    $daftar = $tabel -join ", "
    docker exec $Container psql -U $Pengguna -d $Database `
        -c "TRUNCATE TABLE $daftar RESTART IDENTITY CASCADE;" | Out-Null
    Write-Host "Data toko dikosongkan."
}

# Foto produk dan foto bukti komplain sudah tidak ditunjuk siapa pun lagi.
#
# Di Windows, berkas yang sedang disajikan backend terkunci dan tidak bisa
# dihapus. Itu tidak menggagalkan pengosongan data - berkas yatim hanya
# memakan tempat - jadi yang tersisa cukup dilaporkan.
if (Test-Path $FolderUnggahan) {
    $dibuang = 0
    $gagal = 0
    foreach ($f in @(Get-ChildItem $FolderUnggahan -File)) {
        try { Remove-Item -LiteralPath $f.FullName -Force -ErrorAction Stop; $dibuang++ }
        catch {
            $gagal++
            Write-Host "      $($f.Name): $($_.Exception.Message)" -ForegroundColor DarkGray
        }
    }
    if ($dibuang -gt 0) { Write-Host "$dibuang berkas unggahan yang sudah yatim ikut dibuang." }
    if ($gagal -gt 0) {
        Write-Host "$gagal berkas tidak bisa dihapus." -ForegroundColor Yellow
        Write-Host "  Biasanya karena backend masih berjalan dan memegang berkasnya." -ForegroundColor Yellow
        Write-Host "  Hentikan backend lalu jalankan skrip ini sekali lagi." -ForegroundColor Yellow
        Write-Host "  Berkas yatim tidak mengganggu jalannya aplikasi, hanya memakan tempat." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Sisa isi database:"
foreach ($baris in Hitung) {
    if (-not $baris) { continue }
    $bagian = $baris -split "\|"
    if ([int]$bagian[1] -gt 0) { Write-Host ("   {0,-20} {1,5}" -f $bagian[0], $bagian[1]) }
}
$admin = docker exec $Container psql -U $Pengguna -d $Database -t -A -c "SELECT count(*) FROM userr"
Write-Host "   akun pengelola tersisa: $admin"

Write-Host ""
Write-Host "Selesai. Pastikan DATA_CONTOH=false supaya produk contoh tidak"
Write-Host "terisi ulang saat backend dijalankan lagi."
