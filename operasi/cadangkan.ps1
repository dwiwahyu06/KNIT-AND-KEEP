# =============================================================================
#  Mencadangkan database dan berkas unggahan.
#
#  Data penjualan dan pembukuan tidak bisa dibuat ulang kalau hilang. Jalankan
#  ini terjadwal - di Windows lewat Task Scheduler, di server lewat cron.
#
#      powershell -ExecutionPolicy Bypass -File operasi/cadangkan.ps1
#      powershell -ExecutionPolicy Bypass -File operasi/cadangkan.ps1 -Tujuan "D:\cadangan-knitandkeep"
# =============================================================================
param(
    [string]$Tujuan = "$PSScriptRoot\..\cadangan",
    [string]$Container = "knit-and-keep-db",
    [string]$Database = "knit-and-keep",
    [string]$Pengguna = "postgres",
    [int]$SimpanHari = 30
)

$ErrorActionPreference = "Stop"
$stempel = Get-Date -Format "yyyy-MM-dd_HHmm"

New-Item -ItemType Directory -Force -Path $Tujuan | Out-Null
$Tujuan = (Resolve-Path $Tujuan).Path

Write-Host "Mencadangkan ke $Tujuan"

# --- 1. Database -----------------------------------------------------------
$berkasDb = Join-Path $Tujuan "database-$stempel.sql"
Write-Host "  database..." -NoNewline
docker exec $Container pg_dump -U $Pengguna --clean --if-exists $Database |
    Out-File -FilePath $berkasDb -Encoding utf8

$ukuran = [math]::Round((Get-Item $berkasDb).Length / 1KB, 1)
if ($ukuran -lt 1) {
    Write-Host " GAGAL - hasilnya kosong" -ForegroundColor Red
    exit 1
}
Write-Host " selesai ($ukuran KB)"

# --- 2. Berkas unggahan ----------------------------------------------------
$folderUnggahan = Join-Path $PSScriptRoot "..\backend\unggahan"
if (Test-Path $folderUnggahan) {
    $berkasZip = Join-Path $Tujuan "unggahan-$stempel.zip"
    Write-Host "  berkas unggahan..." -NoNewline
    Compress-Archive -Path "$folderUnggahan\*" -DestinationPath $berkasZip -Force -ErrorAction SilentlyContinue
    if (Test-Path $berkasZip) {
        Write-Host " selesai ($([math]::Round((Get-Item $berkasZip).Length / 1KB, 1)) KB)"
    } else {
        Write-Host " dilewati (folder kosong)"
    }
} else {
    Write-Host "  berkas unggahan: dilewati (belum ada)"
}

# --- 3. Membuang cadangan yang sudah terlalu tua ---------------------------
$batas = (Get-Date).AddDays(-$SimpanHari)
$dibuang = @(Get-ChildItem $Tujuan -File |
             Where-Object { $_.LastWriteTime -lt $batas -and $_.Name -match '^(database|unggahan)-' })
if ($dibuang.Count -gt 0) {
    $dibuang | Remove-Item -Force
    Write-Host "  $($dibuang.Count) cadangan lebih tua dari $SimpanHari hari dibuang"
}

Write-Host ""
Write-Host "Selesai. Cadangan tersimpan di:"
Get-ChildItem $Tujuan -File | Sort-Object LastWriteTime -Descending |
    Select-Object -First 4 |
    ForEach-Object { Write-Host "   $($_.Name)  $([math]::Round($_.Length/1KB,1)) KB" }

Write-Host ""
Write-Host "PENTING: simpan salinannya di tempat lain juga - cadangan yang ada"
Write-Host "di komputer yang sama akan ikut hilang bila komputernya rusak."
