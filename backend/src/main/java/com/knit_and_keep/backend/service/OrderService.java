package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.*;
import com.knit_and_keep.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Pusat seluruh alur pesanan: pembuatan, pembayaran, pelacakan status,
 * pembatalan, dan penjualan offline.
 *
 * Online dan offline memakai jalur penyimpanan yang sama supaya stok dan
 * pembukuan tidak pernah berbeda antara penjualan web dan penjualan toko.
 */
@Service
public class OrderService {

    @Autowired private TransactionRepository transactionRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private UserPelangganRepository userPelangganRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private CartRepository cartRepository;
    @Autowired private CashFlowService cashFlowService;
    @Autowired private StokService stokService;
    @Autowired private NotifikasiService notifikasiService;

    private static final Sort TERBARU = Sort.by(Sort.Direction.DESC, "createdAt");

    // ==================== PEMBACAAN ====================

    public List<Transaction> semuaPesanan(String channel, String status) {
        List<Transaction> semua = transactionRepository.findAll(TERBARU);
        return semua.stream()
                .filter(t -> channel == null || channel.isBlank()
                        || channel.equalsIgnoreCase(t.getChannel()))
                .filter(t -> status == null || status.isBlank()
                        || OrderFlow.normalize(status).equals(OrderFlow.normalize(t.getStatus())))
                .toList();
    }

    public List<Transaction> pesananPelanggan(Long pelangganId) {
        return transactionRepository.findByPelanggan(pelangganId);
    }

    public Transaction cari(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pesanan tidak ditemukan"));
    }

    // ==================== CHECKOUT ONLINE ====================

    /**
     * Membuat pesanan dari keranjang pelanggan dalam satu transaksi database.
     *
     * Stok langsung dipotong di sini, bukan menunggu pembayaran. Barang jadi
     * terpesan untuk pembeli itu sejak awal, sehingga dua orang tidak bisa
     * membayar barang yang sama. Bila pembayarannya batal atau kedaluwarsa,
     * stoknya dikembalikan otomatis.
     */
    @Transactional
    public Transaction checkout(Long pelangganId, List<Map<String, Object>> itemPayload,
                                Long addressId, Map<String, Object> pengiriman, String catatan) {

        UserPelanggan pelanggan = userPelangganRepository.findById(pelangganId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pelanggan tidak ditemukan"));

        if (itemPayload == null || itemPayload.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tidak ada barang yang dipesan");
        }

        Transaction trx = new Transaction();
        trx.setOrderId("KNK-" + UUID.randomUUID().toString().substring(0, 13).toUpperCase());
        trx.setPelanggan(pelanggan);
        trx.setChannel("ONLINE");
        trx.setStatus(OrderFlow.MENUNGGU_PEMBAYARAN);
        trx.setType("PENJUALAN");
        trx.setMetodeBayar("MIDTRANS");
        trx.setCatatan(catatan);
        trx.setDescription("Pesanan online " + pelanggan.getUsername());

        int beratTotal = isiItem(trx, itemPayload);
        trx.setBeratGram(beratTotal);

        // Alamat disalin apa adanya ke pesanan, supaya riwayat tetap benar
        // walau pelanggan mengubah atau menghapus alamatnya nanti.
        if (addressId != null) {
            addressRepository.findById(addressId).ifPresent(a -> {
                trx.setAlamatPengiriman(a.ringkas());
                trx.setNamaPenerima(a.getNamaPenerima() != null && !a.getNamaPenerima().isBlank()
                        ? a.getNamaPenerima() : pelanggan.getUsername());
                trx.setTeleponPenerima(a.getTeleponPenerima());
            });
        }

        if (pengiriman != null) {
            trx.setOngkir(pengiriman.get("ongkir") == null ? 0.0
                    : Double.parseDouble(pengiriman.get("ongkir").toString()));
            trx.setKurir(teks(pengiriman.get("kurir")));
            trx.setLayananKurir(teks(pengiriman.get("layanan")));
            trx.setEstimasiKirim(teks(pengiriman.get("estimasi")));
        } else {
            trx.setOngkir(0.0);
        }

        trx.hitungUlangTotal();
        trx.catatRiwayat(OrderFlow.MENUNGGU_PEMBAYARAN,
                "Pesanan dibuat, barang disisihkan, menunggu pembayaran", "PELANGGAN");

        Transaction tersimpan = transactionRepository.save(trx);
        potongStok(tersimpan, "PELANGGAN");
        return tersimpan;
    }

    // ==================== PENJUALAN OFFLINE ====================

    /**
     * Penjualan di toko. Alurnya sama dengan online, hanya tanpa Midtrans,
     * alamat, dan ongkir — dan pelanggannya ditulis sebagai keterangan teks.
     * Langsung dianggap selesai: stok dipotong dan kas masuk dicatat seketika.
     */
    @Transactional
    public Transaction penjualanOffline(List<Map<String, Object>> itemPayload,
                                        String namaPelanggan, String metodeBayar, String catatan) {

        if (itemPayload == null || itemPayload.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tidak ada barang yang dijual");
        }

        Transaction trx = new Transaction();
        trx.setOrderId("OFF-" + UUID.randomUUID().toString().substring(0, 13).toUpperCase());
        trx.setPelanggan(null);
        trx.setNamaPelangganOffline(
                namaPelanggan == null || namaPelanggan.isBlank() ? "Offline" : namaPelanggan.trim());
        trx.setChannel("OFFLINE");
        trx.setType("PENJUALAN");
        trx.setMetodeBayar(metodeBayar == null || metodeBayar.isBlank() ? "TUNAI" : metodeBayar);
        trx.setOngkir(0.0);
        trx.setCatatan(catatan);
        trx.setDescription("Penjualan offline di toko");

        trx.setBeratGram(isiItem(trx, itemPayload));
        trx.hitungUlangTotal();
        trx.setStatus(OrderFlow.SELESAI);
        trx.setDibayarPada(LocalDateTime.now());
        trx.setSelesaiPada(LocalDateTime.now());
        trx.catatRiwayat(OrderFlow.SELESAI,
                "Penjualan langsung di toko (" + trx.getMetodeBayar() + ")", "ADMIN");

        Transaction tersimpan = transactionRepository.save(trx);

        potongStok(tersimpan, "ADMIN");
        cashFlowService.catat("IN", tersimpan.getAmount(),
                "Penjualan offline " + tersimpan.getOrderId(),
                "PENJUALAN", tersimpan.getOrderId(), "OFFLINE");

        return tersimpan;
    }

    // ==================== ALUR STATUS ====================

    /**
     * Memajukan status pesanan dengan validasi perpindahan, sekaligus menangani
     * efek sampingnya: kembalikan stok bila batal, dan catat arus kas saat lunas.
     */
    @Transactional
    public Transaction ubahStatus(Long transactionId, String statusBaru, String nomorResi,
                                  String kurir, String catatan, String oleh) {

        Transaction trx = cari(transactionId);
        String sekarang = OrderFlow.normalize(trx.getStatus());
        String tujuan = OrderFlow.normalize(statusBaru);

        if (sekarang.equals(tujuan)) {
            // Bukan perpindahan status, cuma memperbarui resi atau kurir.
            terapkanResi(trx, nomorResi, kurir);
            return transactionRepository.save(trx);
        }

        if (!OrderFlow.bolehPindah(sekarang, tujuan)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Status tidak bisa langsung berpindah dari " + OrderFlow.label(sekarang)
                            + " ke " + OrderFlow.label(tujuan));
        }

        if (OrderFlow.DIKIRIM.equals(tujuan)
                && (nomorResi == null || nomorResi.isBlank())
                && (trx.getNomorResi() == null || trx.getNomorResi().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Nomor resi wajib diisi sebelum pesanan ditandai dikirim");
        }

        terapkanResi(trx, nomorResi, kurir);

        // --- efek samping per status ---
        if (OrderFlow.DIPROSES.equals(tujuan) && !OrderFlow.sudahDibayar(sekarang)) {
            trx.setDibayarPada(LocalDateTime.now());
            cashFlowService.catat("IN", trx.getAmount(),
                    "Pembayaran pesanan " + trx.getOrderId(),
                    "PENJUALAN", trx.getOrderId(), trx.getChannel());
        }

        if (OrderFlow.DIBATALKAN.equals(tujuan)) {
            kembalikanStok(trx, MutasiStok.PEMBATALAN,
                    "Pesanan dibatalkan", oleh);
            cashFlowService.hapusByReferensi(trx.getOrderId());
        }

        if (OrderFlow.DIKIRIM.equals(tujuan)) {
            trx.setDikirimPada(LocalDateTime.now());
        }

        if (OrderFlow.SELESAI.equals(tujuan)) {
            trx.setSelesaiPada(LocalDateTime.now());
        }

        trx.setStatus(tujuan);
        trx.catatRiwayat(tujuan,
                catatan == null || catatan.isBlank() ? "Status diperbarui" : catatan,
                oleh == null ? "ADMIN" : oleh);

        Transaction tersimpan = transactionRepository.save(trx);

        // Pelanggan dikabari setiap perpindahan status, kecuali yang dia
        // lakukan sendiri — tidak perlu diberi tahu soal tindakannya sendiri.
        if (!"PELANGGAN".equals(oleh)) {
            notifikasiService.kabarkanStatus(tersimpan, tujuan, catatan);
        }
        return tersimpan;
    }

    /**
     * Konfirmasi pembayaran manual oleh admin.
     * Menggantikan webhook Midtrans, yang tidak bisa menjangkau localhost.
     */
    @Transactional
    public Transaction konfirmasiPembayaran(Long transactionId, String metodeBayar, String catatan) {
        Transaction trx = cari(transactionId);
        if (OrderFlow.sudahDibayar(trx.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pesanan ini sudah dibayar");
        }
        if (metodeBayar != null && !metodeBayar.isBlank()) {
            trx.setMetodeBayar(metodeBayar);
        }
        transactionRepository.save(trx);
        return ubahStatus(transactionId, OrderFlow.DIPROSES, null, null,
                catatan == null || catatan.isBlank() ? "Pembayaran dikonfirmasi admin" : catatan, "ADMIN");
    }

    /** Pelanggan menekan tombol "Barang Diterima". */
    @Transactional
    public Transaction terimaBarang(Long transactionId, Long pelangganId) {
        Transaction trx = cari(transactionId);
        if (trx.getPelanggan() == null || !trx.getPelanggan().getId().equals(pelangganId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Pesanan ini bukan milik Anda");
        }
        if (!OrderFlow.DIKIRIM.equals(OrderFlow.normalize(trx.getStatus()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Pesanan belum dikirim, belum bisa ditandai diterima");
        }
        return ubahStatus(transactionId, OrderFlow.SELESAI, null, null,
                "Barang dikonfirmasi diterima pelanggan", "PELANGGAN");
    }

    @Transactional
    public void hapus(Long transactionId) {
        Transaction trx = cari(transactionId);
        kembalikanStok(trx, MutasiStok.PEMBATALAN, "Pesanan dihapus admin", "ADMIN");
        cashFlowService.hapusByReferensi(trx.getOrderId());
        transactionRepository.delete(trx);
    }

    // ==================== KERANJANG ====================

    @Transactional
    public void kosongkanKeranjang(Long pelangganId) {
        List<CartItem> isi = cartRepository.findByPelangganId(pelangganId);
        if (!isi.isEmpty()) {
            cartRepository.deleteAll(isi);
        }
    }

    // ==================== STOK ====================

    @Transactional
    public void potongStok(Transaction trx, String oleh) {
        if (Boolean.TRUE.equals(trx.getStokDipotong())) return;

        for (TransactionItem item : trx.getItems()) {
            stokService.kurangi(item.getProductId(), item.getQuantity(),
                    MutasiStok.PENJUALAN, trx.getOrderId(),
                    "Terjual lewat " + trx.getChannel().toLowerCase(), oleh);
        }
        trx.setStokDipotong(true);
        transactionRepository.save(trx);
    }

    @Transactional
    public void kembalikanStok(Transaction trx, String jenis, String catatan, String oleh) {
        if (!Boolean.TRUE.equals(trx.getStokDipotong())) return;

        for (TransactionItem item : trx.getItems()) {
            stokService.tambah(item.getProductId(), item.getQuantity(), null,
                    jenis, trx.getOrderId(), catatan, oleh);
        }
        trx.setStokDipotong(false);
        transactionRepository.save(trx);
    }

    // ==================== PEMBANTU ====================

    /** Mengisi rincian barang dan langsung memvalidasi ketersediaannya. */
    private int isiItem(Transaction trx, List<Map<String, Object>> itemPayload) {
        int beratTotal = 0;

        for (Map<String, Object> baris : itemPayload) {
            Long productId = angkaPanjang(baris.get("productId"));
            int qty = angkaBulat(baris.get("quantity"));
            if (qty <= 0) continue;

            Product produk = productRepository.findById(productId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Produk id " + productId + " tidak ditemukan"));

            trx.tambahItem(buatItem(produk, qty));
            beratTotal += (produk.getWeight() == null ? 0 : produk.getWeight()) * qty;
        }

        if (trx.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tidak ada barang yang valid");
        }
        return beratTotal;
    }

    private TransactionItem buatItem(Product produk, int qty) {
        TransactionItem item = new TransactionItem();
        item.setProductId(produk.getId());
        item.setNamaProduk(produk.getName());
        item.setSku(produk.getSku());
        item.setGambar(produk.getImage());
        item.setQuantity(qty);
        item.setHargaJual(produk.getSellPrice() == null ? 0.0 : produk.getSellPrice());
        item.setHargaModal(produk.getCostPrice() == null ? 0.0 : produk.getCostPrice());
        return item;
    }

    private void terapkanResi(Transaction trx, String nomorResi, String kurir) {
        if (nomorResi != null) {
            trx.setNomorResi(nomorResi.isBlank() ? null : nomorResi.trim());
        }
        if (kurir != null) {
            trx.setKurir(kurir.isBlank() ? null : kurir.trim());
        }
    }

    private String teks(Object v) {
        if (v == null) return null;
        String s = v.toString().trim();
        return s.isBlank() ? null : s;
    }

    private Long angkaPanjang(Object v) {
        if (v == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "productId wajib diisi");
        try {
            return Long.parseLong(v.toString().trim());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "productId harus berupa angka");
        }
    }

    private int angkaBulat(Object v) {
        if (v == null) return 0;
        try {
            return (int) Double.parseDouble(v.toString().trim());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jumlah barang harus berupa angka");
        }
    }
}
