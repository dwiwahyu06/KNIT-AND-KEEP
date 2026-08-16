# =============================================================================
#  Memulihkan database dari sebuah berkas cadangan.
#
#  Cadangan yang tidak pernah diuji pemulihannya belum tentu bisa dipakai.
#  Cobalah sekali sebulan pada database uji, bukan menunggu sampai benar-benar
#  dibutuhkan.
#
#      powershell -ExecutionPolicy Bypass -File operasi/pulihkan.ps1 -Berkas "cadangan\database-2026-08-16_1500.sql"
# =============================================================================
param(
    [Parameter(Mandatory = $true)][string]$Berkas,
    [string]$Container = "knit-and-keep-db",
    [string]$Database = "knit-and-keep",
    [string]$Pengguna = "postgres"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $Berkas)) {
    Write-Host "Berkas cadangan tidak ditemukan: $Berkas" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "PERINGATAN" -ForegroundColor Yellow
Write-Host "  Seluruh isi database '$Database' akan ditimpa oleh cadangan ini."
Write-Host "  Berkas   : $Berkas"
Write-Host "  Dibuat   : $((Get-Item $Berkas).LastWriteTime)"
Write-Host ""
$jawab = Read-Host "Ketik PULIHKAN untuk melanjutkan"

if ($jawab -ne "PULIHKAN") {
    Write-Host "Dibatalkan."
    exit 0
}

Write-Host "Memulihkan..."
Get-Content $Berkas -Raw | docker exec -i $Container psql -U $Pengguna -d $Database | Out-Null

Write-Host "Selesai. Jalankan ulang backend, lalu periksa:"
Write-Host "  - jumlah pesanan dan produk di dashboard"
Write-Host "  - saldo arus kas"
Write-Host "  - satu pesanan lama dibuka sampai rincian barangnya"
