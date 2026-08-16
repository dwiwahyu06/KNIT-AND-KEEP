# =============================================================================
#  SKENARIO NORMAL - seluruh fungsi dipakai sebagaimana mestinya.
#
#  Menelusuri perjalanan yang sebenarnya: pelanggan mendaftar, belanja, bayar,
#  dilayani admin, sampai barang diterima; ditambah penjualan di kasir dan
#  seluruh laporan. Memanggil Midtrans dan RajaOngkir sungguhan.
#
#      powershell -ExecutionPolicy Bypass -File uji/uji-normal.ps1
# =============================================================================
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\pustaka.ps1"

Write-Host "`n########## SKENARIO NORMAL ##########"

# ---------------------------------------------------------------------------
Bagian "1. Masuk sebagai pengelola dan pelanggan"
$admin = MasukAdmin
Cek "admin bisa masuk" ($admin.Length -gt 20)

$pelanggan = MasukPelanggan
Cek "pelanggan bisa masuk" ($pelanggan.token.Length -gt 20)

$baru = BuatPelangganBaru
Cek "pelanggan baru bisa mendaftar lalu masuk" ($baru.token.Length -gt 20) $baru.nama

# ---------------------------------------------------------------------------
Bagian "2. Katalog produk"
$produk = BuatProduk $admin "Sweater Rajut Uji" 10 40000 120000 "Sweater"
Cek "produk baru tersimpan" ($produk.id -gt 0) $produk.name
Cek "SKU dibuat otomatis" ($produk.sku -like "KNK-*") $produk.sku

$detail = Get1 "$B/products/$($produk.id)"
Cek "detail produk bisa dibuka tanpa masuk" ($detail.name -eq $produk.name)
Cek "keterangan dan kondisi tersimpan" ($detail.deskripsi -and $detail.kondisi)

$kategori = GetArr "$B/products/kategori"
Cek "daftar kategori berisi kategori baru" ($kategori -contains "Sweater")

$cari = GetArr "$B/products?search=Sweater"
Cek "pencarian produk menemukan barang" (@($cari | Where-Object { $_.id -eq $produk.id }).Count -eq 1)

$ubah = Put1 "$B/products/$($produk.id)" @{
    sku = $produk.sku; name = "Sweater Rajut Uji"; category = "Sweater"; size = "M"
    color = "Krem"; costPrice = 40000; sellPrice = 135000; stock = 10
    supplier = "Pemasok Uji"; weight = 450; kondisi = "Seperti baru"
} $admin
Cek "produk bisa diubah" ($ubah.sellPrice -eq 135000)

# ---------------------------------------------------------------------------
Bagian "3. Stok dan kartu stok"
$sebelumMasuk = Stok $produk.id
Post1 "$B/products/$($produk.id)/stok/tambah" @{ qty = 10; hargaBeli = 60000 } $admin | Out-Null
$sesudahMasuk = Stok $produk.id
Cek "barang masuk menambah stok" ($sesudahMasuk -eq ($sebelumMasuk + 10)) "$sebelumMasuk -> $sesudahMasuk"

$hpp = (Get1 "$B/products/$($produk.id)").costPrice
Cek "HPP jadi rata-rata tertimbang" ([math]::Abs($hpp - 50000) -lt 1) "Rp $hpp"

Post1 "$B/products/$($produk.id)/stok/kurangi" @{ qty = 2; alasan = "Barang rusak saat penataan" } $admin | Out-Null
Cek "barang keluar mengurangi stok" ((Stok $produk.id) -eq ($sesudahMasuk - 2))

$kartu = GetArr "$B/products/mutasi?productId=$($produk.id)" $admin
Cek "kartu stok mencatat dua mutasi" ($kartu.Count -ge 2) "$($kartu.Count) baris"
$masuk = @($kartu | Where-Object { $_.jenis -eq "PEMBELIAN" })[0]
Cek "mutasi mencatat stok sebelum dan sesudah" ($masuk.stokSebelum -lt $masuk.stokSesudah)
Cek "mutasi mencatat perubahan HPP" ($masuk.catatan -like "*HPP*") $masuk.catatan

$menipis = GetArr "$B/products/stok-menipis" $admin
Cek "daftar stok menipis bisa dibuka" ($null -ne $menipis)

# ---------------------------------------------------------------------------
Bagian "4. Keranjang"
Post1 "$B/cart/add" @{ productId = $produk.id; quantity = 2 } $pelanggan.token | Out-Null
$isi = GetArr "$B/cart/$($pelanggan.id)" $pelanggan.token
$baris = @($isi | Where-Object { $_.product.id -eq $produk.id })[0]
Cek "barang masuk keranjang" ($baris.quantity -eq 2)

Put1 "$B/cart/update" @{ productId = $produk.id; quantity = 3 } $pelanggan.token | Out-Null
$isi = GetArr "$B/cart/$($pelanggan.id)" $pelanggan.token
Cek "jumlah di keranjang bisa diubah" ((@($isi | Where-Object { $_.product.id -eq $produk.id })[0]).quantity -eq 3)

# ---------------------------------------------------------------------------
Bagian "5. Alamat dan ongkos kirim nyata"
$alamat = AlamatSiapPakai $pelanggan
Cek "alamat punya titik kirim" ($null -ne $alamat.destinationId) "id $($alamat.destinationId)"

# RajaOngkir punya kuota harian. Kalau habis, bagian ini dilewati dengan
# keterangan - bukan dianggap sebagai kesalahan aplikasi.
$cariTujuan = Coba GET "$B/shipping/cari-tujuan?q=cibiru&limit=5"
if ($cariTujuan.kode -eq 200) {
    $tujuan = @($cariTujuan.data)
    Cek "pencarian wilayah menjawab" ($tujuan.Count -gt 0) "$($tujuan.Count) hasil"
    Cek "hasil pencarian punya kode wilayah kurir" ($tujuan[0].id -gt 0) $tujuan[0].label
} else {
    Lewati "pencarian wilayah" $cariTujuan.pesan
}

$ongkirHasil = Coba GET "$B/shipping/ongkir?destinationId=$($alamat.destinationId)&berat=1000"
if ($ongkirHasil.kode -eq 200) {
    $opsi = @($ongkirHasil.data)
    Cek "kurir memberi pilihan layanan" ($opsi.Count -gt 0) "$($opsi.Count) layanan"
    Cek "tarif urut dari termurah" ($opsi[0].ongkir -le $opsi[-1].ongkir)
    Cek "tarif punya estimasi hari" ($opsi[0].estimasi -ne "-") "$($opsi[0].namaKurir) $($opsi[0].layanan) Rp $($opsi[0].ongkir) ($($opsi[0].estimasi))"
    $ongkirDipakai = $opsi[0].ongkir
} else {
    Lewati "perhitungan ongkos kirim" $ongkirHasil.pesan
    $ongkirDipakai = 6000
}

# ---------------------------------------------------------------------------
Bagian "6. Checkout dan pembayaran"
$stokSebelumPesan = Stok $produk.id
$pesanan = Checkout $pelanggan $produk.id 2 $alamat $ongkirDipakai
Cek "pesanan terbuat" ($pesanan.orderId -like "KNK-*") $pesanan.orderId
Cek "rincian barang tersimpan" ($pesanan.items.Count -eq 1 -and $pesanan.items[0].quantity -eq 2)
Cek "harga modal ikut disalin" ($pesanan.totalModal -gt 0) "Rp $($pesanan.totalModal)"
Cek "total sama dengan subtotal plus ongkir" ($pesanan.amount -eq ($pesanan.subtotal + $pesanan.ongkir))
Cek "data penerima tersalin" ($pesanan.namaPenerima -and $pesanan.teleponPenerima)
Cek "berat paket dihitung" ($pesanan.beratGram -gt 0) "$($pesanan.beratGram) gram"
Cek "stok langsung disisihkan" ((Stok $produk.id) -eq ($stokSebelumPesan - 2)) "$stokSebelumPesan -> $(Stok $produk.id)"

$konfigurasi = Get1 "$B/payments/config"
Cek "konfigurasi Midtrans tersedia untuk frontend" ($konfigurasi.clientKey -like "Mid-client-*") $(if ($konfigurasi.produksi) { "PRODUKSI" } else { "SANDBOX" })

$bayar = Post1 "$B/payments/create-transaction" @{ transactionId = $pesanan.id } $pelanggan.token
Cek "Midtrans menerbitkan token pembayaran" ($bayar.token.Length -gt 10)
Cek "Midtrans memberi tautan pembayaran" ($bayar.redirectUrl -like "https://*midtrans.com/*")

$sinkron = Post1 "$B/payments/$($pesanan.id)/sinkron" @{} $pelanggan.token
Cek "backend berhasil bertanya ke Midtrans" ($sinkron.terhubung -eq $true) "kode $($sinkron.kodeMidtrans)"
Cek "pesanan belum lunas tetap menunggu" ($sinkron.status -eq "MENUNGGU_PEMBAYARAN")

# ---------------------------------------------------------------------------
Bagian "7. Pelayanan pesanan oleh admin"
$lanjut = Get1 "$B/orders/$($pesanan.id)/status-lanjutan" $admin
Cek "status lanjutan hanya yang sah" (@($lanjut.lanjutan | ForEach-Object { $_.value }) -contains "DIPROSES")

$diproses = Post1 "$B/orders/admin/$($pesanan.id)/konfirmasi-pembayaran" @{ metodeBayar = "TRANSFER" } $admin
Cek "pembayaran dikonfirmasi manual" ($diproses.status -eq "DIPROSES")
Cek "waktu pembayaran tercatat" ($null -ne $diproses.dibayarPada)

$kas = Get1 "$B/cashflow/ringkasan" $admin
Cek "kas masuk bertambah dari penjualan" ($kas.kasMasuk -ge $pesanan.amount) "Rp $($kas.kasMasuk)"

$dikirim = Put1 "$B/orders/admin/update/$($pesanan.id)" @{
    status = "DIKIRIM"; nomorResi = "TIKI123456789"; kurir = "tiki"; catatan = "Diserahkan ke kurir"
} $admin
Cek "pesanan ditandai dikirim" ($dikirim.status -eq "DIKIRIM")
Cek "nomor resi tersimpan" ($dikirim.nomorResi -eq "TIKI123456789")

$diterima = Post1 "$B/orders/$($pesanan.id)/terima" @{} $pelanggan.token
Cek "pelanggan menandai barang diterima" ($diterima.status -eq "SELESAI")
Cek "riwayat status lengkap empat langkah" ($diterima.riwayat.Count -eq 4) "$($diterima.riwayat.Count) langkah"

# ---------------------------------------------------------------------------
Bagian "8. Komplain dan retur"
$retur = Post1 "$B/retur" @{
    transactionId = $pesanan.id; jenisKendala = "BARANG_RUSAK"
    alasan = "Ada sobek kecil di bagian lengan"
} $pelanggan.token
Cek "komplain diajukan" ($retur.status -eq "DIAJUKAN")
Cek "pesanan berpindah ke komplain" ($retur.statusPesanan -eq "KOMPLAIN")

$stokSebelumRetur = Stok $produk.id
$disetujui = Put1 "$B/retur/$($retur.id)/setujui" @{
    bentukPenyelesaian = "REFUND"; nominalRefund = 50000
    barangKembali = $true; layakJual = $true; catatanAdmin = "Refund sebagian untuk kerusakan"
} $admin
Cek "retur disetujui" ($disetujui.status -eq "DISETUJUI")
Cek "barang layak jual kembali ke stok" ((Stok $produk.id) -eq ($stokSebelumRetur + 2)) "$stokSebelumRetur -> $(Stok $produk.id)"
Cek "status pesanan jadi dana dikembalikan" ($disetujui.statusPesanan -eq "REFUND")

$mutasiRetur = GetArr "$B/products/mutasi?productId=$($produk.id)&jenis=RETUR" $admin
Cek "retur tercatat di kartu stok" ($mutasiRetur.Count -ge 1)

$tutup = Put1 "$B/retur/pesanan/$($pesanan.id)/tutup" @{ catatan = "Selesai" } $admin
Cek "pesanan ditutup selesai" ($tutup.status -eq "SELESAI")

# ---------------------------------------------------------------------------
Bagian "9. Penjualan offline di kasir"
$barangToko = BuatProduk $admin "Cardigan Uji Kasir" 6 35000 90000 "Cardigan"
$stokSebelumKasir = Stok $barangToko.id
$offline = Post1 "$B/orders/admin/offline" @{
    items = @(@{ productId = $barangToko.id; quantity = 2 })
    namaPelanggan = "Offline"; metodeBayar = "TUNAI"
} $admin
Cek "penjualan offline langsung selesai" ($offline.status -eq "SELESAI")
Cek "ditandai kanal offline" ($offline.channel -eq "OFFLINE")
Cek "nama pelanggan tertulis Offline" ($offline.namaPelanggan -eq "Offline")
Cek "stok toko langsung berkurang" ((Stok $barangToko.id) -eq ($stokSebelumKasir - 2))
Cek "punya rincian barang seperti pesanan online" ($offline.items.Count -eq 1)

# ---------------------------------------------------------------------------
Bagian "10. Pembukuan"
$pengeluaran = Post1 "$B/expenses" @{
    description = "Sewa toko bulan ini"; amount = 1500000; category = "Sewa"
} $admin
Cek "pengeluaran tercatat" ($pengeluaran.id -gt 0)

$arusKas = GetArr "$B/cashflow" $admin
Cek "pengeluaran otomatis jadi kas keluar" (@($arusKas | Where-Object { $_.referensi -eq "EXP-$($pengeluaran.id)" }).Count -eq 1)

Put1 "$B/expenses/$($pengeluaran.id)" @{
    description = "Sewa toko bulan ini"; amount = 2000000; category = "Sewa"
} $admin | Out-Null
$arusKas = GetArr "$B/cashflow" $admin
$barisKas = @($arusKas | Where-Object { $_.referensi -eq "EXP-$($pengeluaran.id)" })
Cek "perubahan pengeluaran tidak menggandakan kas" ($barisKas.Count -eq 1)
Cek "nilai kas ikut diperbarui" ($barisKas[0].amount -eq 2000000)

# ---------------------------------------------------------------------------
Bagian "11. Laporan"
$labaRugi = Get1 "$B/reports/income-statement" $admin
$ringkasTrx = Get1 "$B/transactions/ringkasan" $admin
Cek "omzet laporan sama dengan omzet transaksi" ([math]::Abs($labaRugi.revenue - $ringkasTrx.totalOmzet) -lt 0.01) "Rp $($labaRugi.revenue)"
Cek "HPP laporan sama dengan modal transaksi" ([math]::Abs($labaRugi.hpp - $ringkasTrx.totalModal) -lt 0.01)
Cek "laba sama dengan omzet dikurangi HPP dan beban" ([math]::Abs($labaRugi.profit - ($labaRugi.revenue - $labaRugi.hpp - $labaRugi.expense)) -lt 0.01)

$rinci = Get1 "$B/reports/income-statement/detailed" $admin
Cek "laba kotor rinci konsisten" ([math]::Abs($rinci.grossProfit - ($labaRugi.revenue - $labaRugi.hpp)) -lt 0.01)
Cek "kerugian retur masuk beban lain-lain" ($rinci.otherIncomeExpense -lt 0) "Rp $($rinci.otherIncomeExpense)"

$bulanan = Get1 "$B/reports/monthly" $admin
Cek "laporan bulanan tersedia" ($bulanan.jumlahTransaksi -ge 1)
Cek "online ditambah offline sama dengan omzet bulanan" ([math]::Abs(($bulanan.omzetOnline + $bulanan.omzetOffline) - $bulanan.omzet) -lt 0.01)
Cek "barang terlaris menampilkan laba" ($bulanan.barangTerlaris.Count -ge 1)

$perKategori = GetArr "$B/reports/kategori" $admin
Cek "laporan per kategori berisi data" ($perKategori.Count -ge 1) "$($perKategori.Count) kategori"

$perPelanggan = GetArr "$B/reports/pelanggan" $admin
Cek "laporan per pelanggan berisi data" ($perPelanggan.Count -ge 1) "$($perPelanggan.Count) pelanggan"

$rekapRetur = Get1 "$B/reports/retur" $admin
Cek "rekap retur menghitung kerugian" ($rekapRetur.totalKerugian -ge 50000) "Rp $($rekapRetur.totalKerugian)"
Cek "rekap retur dikelompokkan per jenis" ($rekapRetur.perJenis.Count -ge 1)

$hariIni = (Get-Date).ToString("yyyy-MM-dd")
Cek "filter tanggal di laba rugi bekerja" ($null -ne (Get1 "$B/reports/income-statement?dari=$hariIni&sampai=$hariIni" $admin))
Cek "filter tanggal di dashboard bekerja" ($null -ne (Get1 "$B/dashboard/summary?dari=$hariIni&sampai=$hariIni" $admin))
Cek "filter kanal di laporan bekerja" ($null -ne (Get1 "$B/reports/income-statement?channel=OFFLINE" $admin))

$dashboard = Get1 "$B/dashboard/summary" $admin
Cek "dashboard menampilkan omzet yang sama" ([math]::Abs($dashboard.omzetTotal - $labaRugi.revenue) -lt 0.01)
Cek "dashboard menghitung tren enam bulan" ($dashboard.tren.Count -eq 6)

# ---------------------------------------------------------------------------
Bagian "12. Halaman frontend"
foreach ($h in "/", "/products", "/produk/$($produk.id)", "/SelectRole", "/login", "/LoginPelanggan",
               "/Dashboard", "/AdminOrdersPage", "/Kasir", "/AdminRetur", "/Barang", "/Stock",
               "/KartuStok", "/Keuangan", "/Expenses", "/CashFlow", "/IncomeStatement",
               "/IncomeStatementDetailed", "/MonthlyReport", "/User", "/CartPage", "/CheckoutPage",
               "/Transaksi", "/AddressListPage", "/AddressForm", "/Profile") {
    try {
        $r = Invoke-WebRequest "$F$h" -UseBasicParsing -TimeoutSec 15
        Cek "halaman $h termuat" ($r.StatusCode -eq 200)
    } catch { Cek "halaman $h termuat" $false $_.Exception.Message }
}

Ringkasan "SKENARIO NORMAL"
if ($script:gagal -gt 0) { exit 1 }
exit 0
