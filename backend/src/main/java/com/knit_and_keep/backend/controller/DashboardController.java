package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.OrderFlow;
import com.knit_and_keep.backend.model.Product;
import com.knit_and_keep.backend.model.Transaction;
import com.knit_and_keep.backend.repository.ProductRepository;
import com.knit_and_keep.backend.repository.ReturRepository;
import com.knit_and_keep.backend.repository.TransactionRepository;
import com.knit_and_keep.backend.repository.UserPelangganRepository;
import com.knit_and_keep.backend.service.ProductService;
import com.knit_and_keep.backend.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

/**
 * Ringkasan satu layar untuk admin: uang, pesanan yang perlu ditindak,
 * stok yang perlu diisi, dan perbandingan penjualan online dengan offline.
 */
@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:5173")
public class DashboardController {

    @Autowired private TransactionRepository transactionRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private UserPelangganRepository userPelangganRepository;
    @Autowired private ReturRepository returRepository;
    @Autowired private ProductService productService;
    @Autowired private ReportService reportService;

    /**
     * @param dari   awal periode, kosong berarti sejak toko berdiri
     * @param sampai akhir periode, kosong berarti sampai hari ini
     */
    @GetMapping("/summary")
    public Map<String, Object> ringkasan(
            @RequestParam(required = false)
            @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
            LocalDate dari,
            @RequestParam(required = false)
            @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
            LocalDate sampai) {

        List<Transaction> semua = transactionRepository.findAll().stream()
                .filter(t -> dalamPeriode(t, dari, sampai))
                .toList();
        List<Transaction> omzetTrx = semua.stream()
                .filter(t -> OrderFlow.masukOmzet(t.getStatus())).toList();

        LocalDate hariIni = LocalDate.now();
        List<Transaction> hariIniTrx = omzetTrx.stream()
                .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().toLocalDate().equals(hariIni))
                .toList();

        // Omzet dihitung dari nilai barang, tanpa ongkir — lihat Transaction#getNilaiBarang.
        double omzetTotal = omzetTrx.stream().mapToDouble(Transaction::getNilaiBarang).sum();
        double omzetHariIni = hariIniTrx.stream().mapToDouble(Transaction::getNilaiBarang).sum();
        double modalTotal = omzetTrx.stream().mapToDouble(Transaction::getTotalModal).sum();

        List<Product> produk = productRepository.findAll();
        long totalStok = produk.stream().mapToLong(p -> p.getStock() == null ? 0 : p.getStock()).sum();
        long habis = produk.stream().filter(p -> (p.getStock() == null ? 0 : p.getStock()) == 0).count();

        // Pesanan per status, hanya yang ada isinya supaya kartu tidak penuh angka nol.
        Map<String, Long> perStatus = new LinkedHashMap<>();
        for (String s : List.of(OrderFlow.MENUNGGU_PEMBAYARAN, OrderFlow.DIPROSES, OrderFlow.DIKIRIM,
                OrderFlow.SELESAI, OrderFlow.DIBATALKAN, OrderFlow.KOMPLAIN)) {
            long jumlah = semua.stream()
                    .filter(t -> OrderFlow.normalize(t.getStatus()).equals(s)).count();
            perStatus.put(s, jumlah);
        }

        double omzetOnline = omzetTrx.stream().filter(t -> "ONLINE".equalsIgnoreCase(t.getChannel()))
                .mapToDouble(Transaction::getNilaiBarang).sum();
        double omzetOffline = omzetTrx.stream().filter(t -> "OFFLINE".equalsIgnoreCase(t.getChannel()))
                .mapToDouble(Transaction::getNilaiBarang).sum();

        Map<String, Object> hasil = new LinkedHashMap<>();
        hasil.put("omzetTotal", omzetTotal);
        hasil.put("omzetHariIni", omzetHariIni);
        hasil.put("labaKotor", omzetTotal - modalTotal);
        hasil.put("transaksiHariIni", hariIniTrx.size());
        hasil.put("totalTransaksi", semua.size());
        hasil.put("totalProduk", produk.size());
        hasil.put("totalStok", totalStok);
        hasil.put("stokHabis", habis);
        hasil.put("stokMenipis", productService.stokMenipis());
        hasil.put("totalPelanggan", userPelangganRepository.count());
        hasil.put("pesananPerStatus", perStatus);
        hasil.put("perluDitindak",
                perStatus.getOrDefault(OrderFlow.MENUNGGU_PEMBAYARAN, 0L)
                        + perStatus.getOrDefault(OrderFlow.DIPROSES, 0L)
                        + perStatus.getOrDefault(OrderFlow.KOMPLAIN, 0L));
        hasil.put("omzetOnline", omzetOnline);
        hasil.put("omzetOffline", omzetOffline);
        hasil.put("returMenunggu", returRepository.countByStatus("DIAJUKAN"));
        hasil.put("barangTerlaris", reportService.barangTerlaris(omzetTrx, 5));
        hasil.put("tren", reportService.tren6Bulan(null));
        hasil.put("pesananTerbaru", semua.stream()
                .sorted(Comparator.comparing(Transaction::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5).toList());
        hasil.put("periodeDari", dari);
        hasil.put("periodeSampai", sampai);
        return hasil;
    }

    private boolean dalamPeriode(Transaction t, LocalDate dari, LocalDate sampai) {
        if (dari == null && sampai == null) return true;
        if (t.getCreatedAt() == null) return false;
        LocalDate tanggal = t.getCreatedAt().toLocalDate();
        if (dari != null && tanggal.isBefore(dari)) return false;
        return sampai == null || !tanggal.isAfter(sampai);
    }
}
