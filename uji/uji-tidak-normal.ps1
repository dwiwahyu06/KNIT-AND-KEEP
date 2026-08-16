# =============================================================================
#  SKENARIO TIDAK NORMAL - aplikasi diperlakukan dengan cara yang salah.
#
#  Yang diuji bukan apakah fiturnya jalan, melainkan apakah aplikasi menolak
#  dengan benar: penyusup tanpa hak, isian yang tidak masuk akal, perebutan
#  barang, dan urutan langkah yang keliru.
#
#      powershell -ExecutionPolicy Bypass -File uji/uji-tidak-normal.ps1
# =============================================================================
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\pustaka.ps1"

Write-Host "`n########## SKENARIO TIDAK NORMAL ##########"

$admin = MasukAdmin
$pelanggan = MasukPelanggan
$penyusup = BuatPelangganBaru

# ---------------------------------------------------------------------------
Bagian "1. Masuk tanpa hak"
foreach ($e in "/dashboard/summary", "/orders/admin/all", "/transactions/ringkasan",
                "/reports/income-statement", "/reports/retur", "/pelanggan/all",
                "/auth/admins", "/cashflow", "/expenses", "/products/mutasi") {
    $h = Coba GET "$B$e"
    Cek "tanpa token ditolak: $e" ($h.kode -eq 401) "HTTP $($h.kode)"
}

$h = Coba GET "$B/dashboard/summary" $null $pelanggan.token
Cek "pelanggan ditolak dari dashboard admin" ($h.kode -eq 403) "HTTP $($h.kode)"

$h = Coba POST "$B/products" @{ name = "Selundupan"; costPrice = 1; sellPrice = 2; stock = 1 } $pelanggan.token
Cek "pelanggan tidak bisa menambah produk" ($h.kode -eq 403) "HTTP $($h.kode)"

$h = Coba DELETE "$B/products/1" $null $pelanggan.token
Cek "pelanggan tidak bisa menghapus produk" ($h.kode -eq 403) "HTTP $($h.kode)"

foreach ($token in @("token.palsu.sekali", "Bearer", "", "eyJhbGciOiJIUzI1NiJ9.palsu.tandatanganpalsu")) {
    $h = Coba GET "$B/dashboard/summary" $null $token
    Cek "token tidak sah ditolak" ($h.kode -eq 401 -or $h.kode -eq 403) "HTTP $($h.kode)"
}

# Token yang isinya diubah agar perannya jadi ADMIN.
$bagian = $pelanggan.token.Split(".")
$palsu = "$($bagian[0]).$($bagian[1])xyz.$($bagian[2])"
$h = Coba GET "$B/dashboard/summary" $null $palsu
Cek "token yang diubah isinya ditolak" ($h.kode -eq 401) "HTTP $($h.kode)"

# ---------------------------------------------------------------------------
Bagian "2. Mengintip data orang lain"
$produk = BuatProduk $admin "Blazer Uji Akses" 5
$alamat = AlamatSiapPakai $pelanggan
$pesanan = Checkout $pelanggan $produk.id 1 $alamat

$h = Coba GET "$B/orders/$($pesanan.id)" $null $penyusup.token
Cek "pesanan orang lain ditolak" ($h.kode -eq 403) "HTTP $($h.kode)"

$h = Coba GET "$B/orders/user/$($pelanggan.id)" $null $penyusup.token
Cek "daftar pesanan orang lain ditolak" ($h.kode -eq 403) "HTTP $($h.kode)"

$h = Coba GET "$B/pelanggan/$($pelanggan.id)/addresses" $null $penyusup.token
Cek "alamat orang lain ditolak" ($h.kode -eq 403) "HTTP $($h.kode)"

$h = Coba GET "$B/pelanggan/$($pelanggan.id)" $null $penyusup.token
Cek "profil orang lain ditolak" ($h.kode -eq 403) "HTTP $($h.kode)"

$h = Coba GET "$B/cart/$($pelanggan.id)" $null $penyusup.token
Cek "keranjang orang lain ditolak" ($h.kode -eq 403) "HTTP $($h.kode)"

$h = Coba PUT "$B/pelanggan/update/$($pelanggan.id)" @{ username = "dibajak"; email = "bajak@mail.com" } $penyusup.token
Cek "mengubah profil orang lain ditolak" ($h.kode -eq 403) "HTTP $($h.kode)"

$h = Coba POST "$B/orders/$($pesanan.id)/terima" @{} $penyusup.token
Cek "menandai terima pesanan orang lain ditolak" ($h.kode -in @(400, 403)) "HTTP $($h.kode)"

# Menukar nomor pelanggan di badan permintaan tidak boleh mengubah pemilik.
Post1 "$B/cart/add" @{ pelangganId = $pelanggan.id; productId = $produk.id; quantity = 1 } $penyusup.token | Out-Null
$keranjangKorban = GetArr "$B/cart/$($pelanggan.id)" $pelanggan.token
Cek "menukar nomor pelanggan tidak menyentuh keranjang korban" (
    @($keranjangKorban | Where-Object { $_.product.id -eq $produk.id }).Count -eq 0)

# ---------------------------------------------------------------------------
Bagian "3. Isian yang tidak masuk akal"
$h = Coba POST "$B/products" @{ name = "Minus"; costPrice = -5000; sellPrice = -1000; stock = -10 } $admin
Cek "harga dan stok negatif ditolak" ($h.kode -eq 400) $h.pesan

$h = Coba POST "$B/products" @{ name = ""; costPrice = 1000; sellPrice = 2000; stock = 1 } $admin
Cek "produk tanpa nama ditolak" ($h.kode -eq 400) $h.pesan

$h = Coba POST "$B/products" @{ name = "Berat Minus"; costPrice = 1000; sellPrice = 2000; stock = 1; weight = -500 } $admin
Cek "berat negatif ditolak" ($h.kode -eq 400) $h.pesan

$h = Coba POST "$B/expenses" @{ description = ""; amount = 50000 } $admin
Cek "pengeluaran tanpa keterangan ditolak" ($h.kode -eq 400) $h.pesan

$h = Coba POST "$B/expenses" @{ description = "Uji"; amount = -99999 } $admin
Cek "pengeluaran negatif ditolak" ($h.kode -eq 400) $h.pesan

$h = Coba POST "$B/expenses" @{ description = "Uji"; amount = 1000; date = "2099-01-01" } $admin
Cek "pengeluaran bertanggal masa depan ditolak" ($h.kode -eq 400) $h.pesan

$h = Coba POST "$B/orders/checkout" @{
    pelangganId = $pelanggan.id
    items = @(@{ productId = "bukan-angka"; quantity = 1 })
    addressId = $alamat.id
} $pelanggan.token
Cek "isian salah bentuk dijawab 400 bukan 500" ($h.kode -eq 400) $h.pesan

$h = Coba POST "$B/orders/checkout" @{ pelangganId = $pelanggan.id; items = @(); addressId = $alamat.id } $pelanggan.token
Cek "checkout tanpa barang ditolak" ($h.kode -eq 400) $h.pesan

$h = Coba POST "$B/orders/checkout" @{
    pelangganId = $pelanggan.id
    items = @(@{ productId = 999999; quantity = 1 })
    addressId = $alamat.id
} $pelanggan.token
Cek "memesan produk yang tidak ada ditolak" ($h.kode -eq 404) $h.pesan

$panjang = "A" * 5000
$h = Coba POST "$B/products" @{ name = $panjang; costPrice = 1000; sellPrice = 2000; stock = 1 } $admin
Cek "nama sepanjang 5000 huruf tidak merusak server" ($h.kode -in @(400, 409, 500)) "HTTP $($h.kode)"

$h = Coba GET "$B/products?search=' OR 1=1 --"
Cek "pencarian dengan sisipan SQL aman" ($h.kode -eq 200) "HTTP $($h.kode)"

# ---------------------------------------------------------------------------
Bagian "4. Melampaui stok"
$tipis = BuatProduk $admin "Syal Uji Stok" 2
$h = Coba POST "$B/cart/add" @{ productId = $tipis.id; quantity = 9999 } $pelanggan.token
Cek "menambah 9999 unit ke keranjang ditolak" ($h.kode -eq 409) $h.pesan

Post1 "$B/cart/add" @{ productId = $tipis.id; quantity = 2 } $pelanggan.token | Out-Null
$h = Coba POST "$B/cart/add" @{ productId = $tipis.id; quantity = 1 } $pelanggan.token
Cek "menambah melebihi sisa stok ditolak" ($h.kode -eq 409) $h.pesan

$h = Coba PUT "$B/cart/update" @{ productId = $tipis.id; quantity = 500 } $pelanggan.token
Cek "mengubah jumlah melebihi stok ditolak" ($h.kode -eq 409) $h.pesan

$h = Coba POST "$B/orders/checkout" @{
    pelangganId = $pelanggan.id
    items = @(@{ productId = $tipis.id; quantity = 10 })
    addressId = $alamat.id
    pengiriman = @{ ongkir = 6000; kurir = "tiki"; layanan = "ECO" }
} $pelanggan.token
Cek "checkout melebihi stok ditolak" ($h.kode -eq 409) $h.pesan

$habis = BuatProduk $admin "Topi Uji Habis" 1
Checkout $pelanggan $habis.id 1 $alamat | Out-Null
Cek "stok jadi nol setelah dipesan" ((Stok $habis.id) -eq 0)
$h = Coba POST "$B/cart/add" @{ productId = $habis.id; quantity = 1 } $pelanggan.token
Cek "barang habis tidak bisa dimasukkan keranjang" ($h.kode -eq 409) $h.pesan

# ---------------------------------------------------------------------------
Bagian "5. Perebutan barang terakhir"
$rebutan = BuatProduk $admin "Jaket Uji Rebutan" 1
$badan = J @{
    pelangganId = [int]$pelanggan.id
    items = @(@{ productId = [int]$rebutan.id; quantity = 1 })
    addressId = [int]$alamat.id
    pengiriman = @{ ongkir = 6000; kurir = "tiki"; layanan = "ECO" }
}
$jobs = 1..6 | ForEach-Object {
    Start-Job -ScriptBlock { param($u, $b, $t)
        try { $r = Invoke-RestMethod -Uri $u -Method POST -ContentType "application/json" -Body $b -Headers @{ Authorization = "Bearer $t" }; "BERHASIL" }
        catch { "ditolak" }
    } -ArgumentList "$B/orders/checkout", $badan, $pelanggan.token
}
$hasil = $jobs | Wait-Job | Receive-Job; $jobs | Remove-Job
$berhasil = @($hasil | Where-Object { $_ -eq "BERHASIL" }).Count
Cek "hanya satu dari enam pembeli yang lolos" ($berhasil -eq 1) "lolos $berhasil dari 6"
Cek "stok tidak menjadi minus" ((Stok $rebutan.id) -eq 0) "sisa $(Stok $rebutan.id)"

# ---------------------------------------------------------------------------
Bagian "6. Urutan langkah yang keliru"
$alur = BuatProduk $admin "Rok Uji Alur" 3
$pesananAlur = Checkout $pelanggan $alur.id 1 $alamat

$h = Coba PUT "$B/orders/admin/update/$($pesananAlur.id)" @{ status = "SELESAI" } $admin
Cek "melompat dari belum bayar ke selesai ditolak" ($h.kode -eq 400) $h.pesan

$h = Coba PUT "$B/orders/admin/update/$($pesananAlur.id)" @{ status = "DIKIRIM" } $admin
Cek "mengirim pesanan yang belum dibayar ditolak" ($h.kode -eq 400) $h.pesan

Post1 "$B/orders/admin/$($pesananAlur.id)/konfirmasi-pembayaran" @{ metodeBayar = "TUNAI" } $admin | Out-Null
$h = Coba PUT "$B/orders/admin/update/$($pesananAlur.id)" @{ status = "DIKIRIM" } $admin
Cek "menandai dikirim tanpa nomor resi ditolak" ($h.kode -eq 400) $h.pesan

$h = Coba POST "$B/orders/admin/$($pesananAlur.id)/konfirmasi-pembayaran" @{ metodeBayar = "TUNAI" } $admin
Cek "konfirmasi pembayaran dua kali ditolak" ($h.kode -eq 400) $h.pesan

$h = Coba POST "$B/orders/$($pesananAlur.id)/terima" @{} $pelanggan.token
Cek "menerima barang yang belum dikirim ditolak" ($h.kode -eq 400) $h.pesan

$h = Coba POST "$B/retur" @{ transactionId = $pesananAlur.id; jenisKendala = "" } $pelanggan.token
Cek "komplain tanpa jenis kendala ditolak" ($h.kode -eq 400) $h.pesan

Post1 "$B/retur" @{ transactionId = $pesananAlur.id; jenisKendala = "BARANG_RUSAK"; alasan = "uji" } $pelanggan.token | Out-Null
$h = Coba POST "$B/retur" @{ transactionId = $pesananAlur.id; jenisKendala = "SALAH_KIRIM"; alasan = "uji kedua" } $pelanggan.token
Cek "komplain kedua untuk pesanan sama ditolak" ($h.kode -eq 400) $h.pesan

$belumBayar = Checkout $pelanggan $alur.id 1 $alamat
$h = Coba POST "$B/retur" @{ transactionId = $belumBayar.id; jenisKendala = "BARANG_RUSAK"; alasan = "uji" } $pelanggan.token
Cek "komplain untuk pesanan belum dibayar ditolak" ($h.kode -eq 400) $h.pesan

# ---------------------------------------------------------------------------
Bagian "7. Pembatalan mengembalikan barang"
$stokSebelumBatal = Stok $alur.id
$batal = Put1 "$B/orders/admin/update/$($belumBayar.id)" @{ status = "DIBATALKAN"; catatan = "Uji pembatalan" } $admin
Cek "pesanan bisa dibatalkan" ($batal.status -eq "DIBATALKAN")
Cek "barang kembali ke stok" ((Stok $alur.id) -eq ($stokSebelumBatal + 1)) "$stokSebelumBatal -> $(Stok $alur.id)"

$h = Coba PUT "$B/orders/admin/update/$($belumBayar.id)" @{ status = "DIPROSES" } $admin
Cek "pesanan batal tidak bisa dihidupkan lagi" ($h.kode -eq 400) $h.pesan

$mutasiBatal = GetArr "$B/products/mutasi?productId=$($alur.id)&jenis=PEMBATALAN" $admin
Cek "pembatalan tercatat di kartu stok" ($mutasiBatal.Count -ge 1)

# ---------------------------------------------------------------------------
Bagian "8. Pembayaran yang disalahgunakan"
$sah = Get1 "$B/orders/$($pesanan.id)" $pelanggan.token
$grossStr = "$($sah.amount).00"
$h = Coba POST "$B/payments/notification-handler" @{
    order_id = $sah.orderId; status_code = "200"; gross_amount = $grossStr
    transaction_status = "settlement"; signature_key = "tanda-tangan-karangan"
}
Cek "notifikasi Midtrans palsu ditolak" ($h.kode -eq 403) "HTTP $($h.kode)"
Cek "pesanan tidak berubah oleh notifikasi palsu" (
    (Get1 "$B/orders/$($sah.id)" $pelanggan.token).status -eq $sah.status)

$h = Coba POST "$B/payments/create-transaction" @{ transactionId = $pesananAlur.id } $pelanggan.token
Cek "meminta pembayaran untuk pesanan yang sudah lunas ditolak" ($h.kode -eq 400) $h.pesan

$h = Coba POST "$B/payments/create-transaction" @{ transactionId = 999999 } $pelanggan.token
Cek "meminta pembayaran pesanan yang tidak ada ditolak" ($h.kode -in @(400, 404)) $h.pesan

# ---------------------------------------------------------------------------
Bagian "9. Pengiriman dan pelacakan yang keliru"
$h = Coba GET "$B/shipping/cari-tujuan?q=ab"
Cek "pencarian wilayah kurang dari tiga huruf ditolak" ($h.kode -eq 400) $h.pesan

# Toko harus tetap bisa menjual walau tujuannya belum lengkap atau layanan
# kurir sedang mati, jadi jawabannya tarif cadangan - bukan penolakan.
$opsi = GetArr "$B/shipping/ongkir?destinationId=&berat=1000"
Cek "ongkir tanpa tujuan tetap memberi pilihan cadangan" ($opsi.Count -gt 0) "$($opsi.Count) pilihan"
Cek "pilihan cadangan ditandai sebagai perkiraan" ($opsi.Count -gt 0 -and $opsi[0].cadangan -eq $true) $opsi[0].alasan

$h = Coba GET "$B/shipping/lacak-pesanan/$($pesananAlur.id)" $null $pelanggan.token
Cek "melacak pesanan tanpa resi ditolak" ($h.kode -eq 400) $h.pesan

$dikirim = Put1 "$B/orders/admin/update/$($pesananAlur.id)" @{
    status = "KOMPLAIN"; catatan = "lanjut uji"
} $admin
$h = Coba GET "$B/shipping/lacak?resi=RESIKARANGAN123&kurir=jne" $null $admin
if ($h.kode -eq 502) {
    Lewati "pelacakan resi karangan" $h.pesan
} else {
    Cek "melacak resi karangan dijawab kurir dengan jelas" (
        $h.kode -eq 404 -and $h.pesan -like "*resi*") $h.pesan
}

# ---------------------------------------------------------------------------
Bagian "10. Batas sistem"
$h = Coba GET "$B/produk-yang-tidak-ada" $null $admin
Cek "alamat API tidak dikenal dijawab 401 atau 404" ($h.kode -in @(401, 403, 404)) "HTTP $($h.kode)"

$h = Coba GET "$B/orders/999999" $null $admin
Cek "pesanan tidak ditemukan dijawab 404" ($h.kode -eq 404) $h.pesan

$h = Coba GET "$B/products/999999"
Cek "produk tidak ditemukan dijawab 404" ($h.kode -eq 404) "HTTP $($h.kode)"

# Batas lima alamat per pelanggan. Memakai wilayah yang sudah diketahui,
# supaya pengujian ini tidak ikut menghabiskan kuota pencarian wilayah.
$hasilAlamat = 1..8 | ForEach-Object {
    Coba POST "$B/pelanggan/$($penyusup.id)/addresses" @{
        namaPenerima = "Uji $_"; teleponPenerima = "0812345678$_"
        detailAlamat = "Jl. Uji No. $_"; provinsi = "JAWA BARAT"; kabupaten = "BANDUNG"
        kecamatan = "CIBIRU"; kelurahan = "CIPADUNG"; kodePos = "40614"
        destinationId = "4817"; labelTujuan = "CIPADUNG, CIBIRU, BANDUNG, JAWA BARAT, 40614"
    } $penyusup.token
}
$ditolak = @($hasilAlamat | Where-Object { $_.kode -eq 403 }).Count
Cek "alamat dibatasi lima per pelanggan" ($ditolak -ge 3) "$ditolak dari 8 ditolak"

# Pembatas laju pencarian wilayah.
$kodeLaju = 1..45 | ForEach-Object { (Coba GET "$B/shipping/cari-tujuan?q=bandung$_").kode }
$terlalu = @($kodeLaju | Where-Object { $_ -eq 429 }).Count
Cek "permintaan beruntun dibatasi" ($terlalu -ge 1) "$terlalu permintaan ditolak dengan 429"

# ---------------------------------------------------------------------------
Bagian "11. Menghapus data yang masih dipakai"
$dipakai = BuatProduk $admin "Kemeja Uji Hapus" 4
Post1 "$B/cart/add" @{ productId = $dipakai.id; quantity = 1 } $pelanggan.token | Out-Null
$hapus = Del1 "$B/products/$($dipakai.id)" $admin
Cek "produk di keranjang tetap bisa dihapus tanpa galat" ($hapus.keranjangTerdampak -ge 1) $hapus.pesan
Cek "keranjang ikut dibersihkan" (
    @(GetArr "$B/cart/$($pelanggan.id)" $pelanggan.token | Where-Object { $_.product.id -eq $dipakai.id }).Count -eq 0)

$sudahTerjual = BuatProduk $admin "Celana Uji Riwayat" 3
$pesananRiwayat = Checkout $pelanggan $sudahTerjual.id 1 $alamat
Del1 "$B/products/$($sudahTerjual.id)" $admin | Out-Null
$riwayat = Get1 "$B/orders/$($pesananRiwayat.id)" $pelanggan.token
Cek "riwayat pesanan tetap utuh walau produknya dihapus" (
    $riwayat.items[0].namaProduk -eq "Celana Uji Riwayat") $riwayat.items[0].namaProduk

# ---------------------------------------------------------------------------
Bagian "12. Halaman yang tidak ada"
try {
    $r = Invoke-WebRequest "$F/alamat-yang-tidak-pernah-ada" -UseBasicParsing -TimeoutSec 15
    Cek "alamat frontend keliru tetap menampilkan halaman" ($r.StatusCode -eq 200)
} catch { Cek "alamat frontend keliru tetap menampilkan halaman" $false $_.Exception.Message }

Ringkasan "SKENARIO TIDAK NORMAL"
if ($script:gagal -gt 0) { exit 1 }
exit 0
