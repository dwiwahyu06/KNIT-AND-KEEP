# =============================================================================
#  Menjalankan seluruh pengujian secara berurutan.
#
#  Urutannya penting: skenario normal dijalankan lebih dulu, karena skenario
#  tidak normal diakhiri dengan menguji pembatas laju - dan pembatas itu masih
#  menutup pencarian wilayah selama satu menit sesudahnya.
#
#      powershell -ExecutionPolicy Bypass -File uji/jalankan-semua.ps1
# =============================================================================
$ErrorActionPreference = "Continue"
$akar = $PSScriptRoot

Write-Host "Memastikan backend dan frontend menyala..." -ForegroundColor DarkGray
foreach ($u in @("http://localhost:8080/api/products", "http://localhost:5173/")) {
    try {
        Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 10 | Out-Null
        Write-Host "  siap: $u" -ForegroundColor DarkGreen
    } catch {
        Write-Host "  TIDAK SIAP: $u" -ForegroundColor Red
        Write-Host "  Jalankan backend dan frontend dulu, lalu ulangi." -ForegroundColor Red
        exit 1
    }
}

& "$akar\uji-normal.ps1"
$hasilNormal = $LASTEXITCODE

& "$akar\uji-tambahan.ps1"
$hasilTambahan = $LASTEXITCODE

& "$akar\uji-tidak-normal.ps1"
$hasilTidakNormal = $LASTEXITCODE

function Nilai($kode) { if ($kode -eq 0) { "LULUS" } else { "ADA YANG GAGAL" } }

Write-Host ""
Write-Host ("#" * 60)
Write-Host " HASIL AKHIR"
Write-Host "   Skenario normal       : $(Nilai $hasilNormal)"
Write-Host "   Fitur baru            : $(Nilai $hasilTambahan)"
Write-Host "   Skenario tidak normal : $(Nilai $hasilTidakNormal)"
Write-Host ("#" * 60)

if ($hasilNormal -ne 0 -or $hasilTambahan -ne 0 -or $hasilTidakNormal -ne 0) { exit 1 }
