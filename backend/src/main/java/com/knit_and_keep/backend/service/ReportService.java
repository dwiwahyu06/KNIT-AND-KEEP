package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.*;
import com.knit_and_keep.backend.repository.ExpenseRepository;
import com.knit_and_keep.backend.repository.ReturRepository;
import com.knit_and_keep.backend.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

/**
 * Laporan keuangan.
 *
 * Dua perbaikan penting dibanding versi sebelumnya:
 * omzet dihitung dari status pesanan (bukan dari kolom {@code type} yang tidak
 * pernah cocok), dan HPP benar-benar dijumlah dari harga modal tiap barang
 * yang terjual — bukan lagi angka nol yang dipatok di kode.
 */
@Service
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final ExpenseRepository expenseRepository;
    private final ReturRepository returRepository;
    private final com.knit_and_keep.backend.repository.ProductRepository productRepository;

    public ReportService(TransactionRepository transactionRepository,
                         ExpenseRepository expenseRepository,
                         ReturRepository returRepository,
                         com.knit_and_keep.backend.repository.ProductRepository productRepository) {
        this.transactionRepository = transactionRepository;
        this.expenseRepository = expenseRepository;
        this.returRepository = returRepository;
        this.productRepository = productRepository;
    }

    // ==================== PENGAMBILAN DATA ====================

    private List<Transaction> transaksiOmzet(String channel, LocalDate dari, LocalDate sampai) {
        return transactionRepository.findAll().stream()
                .filter(t -> OrderFlow.masukOmzet(t.getStatus()))
                .filter(t -> channel == null || channel.isBlank() || channel.equalsIgnoreCase(t.getChannel()))
                .filter(t -> dalamRentang(t.getCreatedAt(), dari, sampai))
                .toList();
    }

    private List<Expense> pengeluaran(LocalDate dari, LocalDate sampai) {
        return expenseRepository.findAll().stream()
                .filter(e -> e.getDate() != null)
                .filter(e -> (dari == null || !e.getDate().isBefore(dari))
                        && (sampai == null || !e.getDate().isAfter(sampai)))
                .toList();
    }

    private boolean dalamRentang(LocalDateTime waktu, LocalDate dari, LocalDate sampai) {
        if (waktu == null) return dari == null && sampai == null;
        LocalDate tanggal = waktu.toLocalDate();
        if (dari != null && tanggal.isBefore(dari)) return false;
        return sampai == null || !tanggal.isAfter(sampai);
    }

    // ==================== PERHITUNGAN ====================

    /** Omzet memakai nilai barang, tanpa ongkir — aturannya di {@link Transaction#getNilaiBarang()}. */
    private double omzet(List<Transaction> daftar) {
        return daftar.stream().mapToDouble(Transaction::getNilaiBarang).sum();
    }

    private double hpp(List<Transaction> daftar) {
        return daftar.stream().mapToDouble(Transaction::getTotalModal).sum();
    }

    private double totalPengeluaran(List<Expense> daftar) {
        return daftar.stream().mapToDouble(e -> e.getAmount() == null ? 0 : e.getAmount()).sum();
    }

    /** Uang yang keluar karena refund, ganti rugi, dan barang hilang. */
    private double kerugian(LocalDate dari, LocalDate sampai) {
        return returRepository.findAll().stream()
                .filter(r -> "DISETUJUI".equals(r.getStatus()))
                .filter(r -> dalamRentang(r.getCreatedAt(), dari, sampai))
                .mapToDouble(r -> r.getNominalRefund() == null ? 0 : r.getNominalRefund())
                .sum();
    }

    // ==================== LAPORAN RINGKAS ====================

    public IncomeStatementResponse generateIncomeStatementSimple() {
        return generateIncomeStatementSimple(null, null, null);
    }

    public IncomeStatementResponse generateIncomeStatementSimple(String channel, LocalDate dari, LocalDate sampai) {
        List<Transaction> trx = transaksiOmzet(channel, dari, sampai);

        double revenue = omzet(trx);
        double hpp = hpp(trx);
        double beban = totalPengeluaran(pengeluaran(dari, sampai)) + kerugian(dari, sampai);
        double laba = revenue - hpp - beban;

        return new IncomeStatementResponse(revenue, hpp, beban, laba);
    }

    // ==================== LAPORAN RINCI ====================

    public IncomeStatementDetailedResponse generateIncomeStatementDetailed() {
        return generateIncomeStatementDetailed(null, null, null);
    }

    public IncomeStatementDetailedResponse generateIncomeStatementDetailed(String channel, LocalDate dari, LocalDate sampai) {
        List<Transaction> trx = transaksiOmzet(channel, dari, sampai);

        double revenue = omzet(trx);
        double hpp = hpp(trx);
        double labaKotor = revenue - hpp;

        double bebanOperasional = totalPengeluaran(pengeluaran(dari, sampai));
        double labaUsaha = labaKotor - bebanOperasional;

        // Kerugian retur dan ganti rugi masuk sebagai beban lain-lain (bernilai negatif).
        double lainLain = -kerugian(dari, sampai);
        double pajak = 0.0;
        double labaBersih = labaUsaha + lainLain - pajak;

        return new IncomeStatementDetailedResponse(
                revenue, hpp, labaKotor,
                bebanOperasional, labaUsaha,
                lainLain, pajak, labaBersih);
    }

    // ==================== LAPORAN BULANAN ====================

    /**
     * Rekap satu bulan, lengkap dengan rincian barang terjual dan pemisahan
     * penjualan online dan offline.
     */
    public Map<String, Object> laporanBulanan(String bulan, String channel) {
        YearMonth ym = (bulan == null || bulan.isBlank()) ? YearMonth.now() : YearMonth.parse(bulan);
        LocalDate dari = ym.atDay(1);
        LocalDate sampai = ym.atEndOfMonth();

        List<Transaction> trx = transaksiOmzet(channel, dari, sampai);
        List<Expense> beban = pengeluaran(dari, sampai);

        double revenue = omzet(trx);
        double modal = hpp(trx);
        double pengeluaranTotal = totalPengeluaran(beban);
        double rugi = kerugian(dari, sampai);

        double omzetOnline = trx.stream().filter(t -> "ONLINE".equalsIgnoreCase(t.getChannel()))
                .mapToDouble(Transaction::getNilaiBarang).sum();
        double omzetOffline = trx.stream().filter(t -> "OFFLINE".equalsIgnoreCase(t.getChannel()))
                .mapToDouble(Transaction::getNilaiBarang).sum();

        Map<String, Object> hasil = new LinkedHashMap<>();
        hasil.put("bulan", ym.toString());
        hasil.put("jumlahTransaksi", trx.size());
        hasil.put("totalBarangTerjual", trx.stream().mapToLong(Transaction::getTotalQty).sum());
        hasil.put("omzet", revenue);
        hasil.put("hpp", modal);
        hasil.put("labaKotor", revenue - modal);
        hasil.put("pengeluaran", pengeluaranTotal);
        hasil.put("kerugian", rugi);
        hasil.put("labaBersih", revenue - modal - pengeluaranTotal - rugi);
        hasil.put("omzetOnline", omzetOnline);
        hasil.put("omzetOffline", omzetOffline);
        hasil.put("transaksiOnline", trx.stream().filter(t -> "ONLINE".equalsIgnoreCase(t.getChannel())).count());
        hasil.put("transaksiOffline", trx.stream().filter(t -> "OFFLINE".equalsIgnoreCase(t.getChannel())).count());
        hasil.put("barangTerlaris", barangTerlaris(trx, 10));
        hasil.put("transaksi", trx);
        hasil.put("pengeluaranRinci", beban);
        return hasil;
    }

    /** Barang paling laku beserta kontribusinya ke omzet dan laba. */
    public List<Map<String, Object>> barangTerlaris(List<Transaction> daftar, int batas) {
        Map<String, long[]> qtyPerProduk = new HashMap<>();
        Map<String, double[]> nilaiPerProduk = new HashMap<>();

        for (Transaction t : daftar) {
            for (TransactionItem i : t.getItems()) {
                String nama = i.getNamaProduk() == null ? "Tanpa nama" : i.getNamaProduk();
                qtyPerProduk.computeIfAbsent(nama, k -> new long[1])[0] += i.getQuantity() == null ? 0 : i.getQuantity();
                double[] nilai = nilaiPerProduk.computeIfAbsent(nama, k -> new double[2]);
                nilai[0] += i.getSubtotal();
                nilai[1] += i.getTotalModal();
            }
        }

        return qtyPerProduk.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                .limit(batas)
                .map(e -> {
                    double[] nilai = nilaiPerProduk.get(e.getKey());
                    Map<String, Object> baris = new LinkedHashMap<>();
                    baris.put("nama", e.getKey());
                    baris.put("qty", e.getValue()[0]);
                    baris.put("omzet", nilai[0]);
                    baris.put("laba", nilai[0] - nilai[1]);
                    return baris;
                })
                .toList();
    }

    /**
     * Rekap kendala pengiriman: berapa kali terjadi dan berapa kerugiannya,
     * dikelompokkan per jenis. Dipakai untuk melihat pola — misalnya apakah
     * barang hilang lebih sering daripada barang rusak.
     */
    public Map<String, Object> rekapRetur(LocalDate dari, LocalDate sampai) {
        List<Retur> semua = returRepository.findAll().stream()
                .filter(r -> dalamRentang(r.getCreatedAt(), dari, sampai))
                .toList();

        Map<String, long[]> jumlahPerJenis = new LinkedHashMap<>();
        Map<String, double[]> nilaiPerJenis = new LinkedHashMap<>();

        for (Retur r : semua) {
            String jenis = r.getJenisKendala() == null ? "LAINNYA" : r.getJenisKendala();
            jumlahPerJenis.computeIfAbsent(jenis, k -> new long[1])[0]++;
            if ("DISETUJUI".equals(r.getStatus())) {
                nilaiPerJenis.computeIfAbsent(jenis, k -> new double[1])[0] +=
                        r.getNominalRefund() == null ? 0 : r.getNominalRefund();
            }
        }

        List<Map<String, Object>> perJenis = jumlahPerJenis.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                .map(e -> {
                    Map<String, Object> baris = new LinkedHashMap<>();
                    baris.put("jenis", e.getKey());
                    baris.put("jumlah", e.getValue()[0]);
                    baris.put("kerugian", nilaiPerJenis.getOrDefault(e.getKey(), new double[1])[0]);
                    return baris;
                })
                .toList();

        Map<String, Object> hasil = new LinkedHashMap<>();
        hasil.put("total", semua.size());
        hasil.put("menunggu", semua.stream().filter(r -> "DIAJUKAN".equals(r.getStatus())).count());
        hasil.put("disetujui", semua.stream().filter(r -> "DISETUJUI".equals(r.getStatus())).count());
        hasil.put("ditolak", semua.stream().filter(r -> "DITOLAK".equals(r.getStatus())).count());
        hasil.put("totalKerugian", semua.stream()
                .filter(r -> "DISETUJUI".equals(r.getStatus()))
                .mapToDouble(r -> r.getNominalRefund() == null ? 0 : r.getNominalRefund()).sum());
        hasil.put("perJenis", perJenis);
        hasil.put("daftar", semua);
        return hasil;
    }

    /** Penjualan dikelompokkan per kategori barang, lengkap dengan labanya. */
    public List<Map<String, Object>> perKategori(String channel, LocalDate dari, LocalDate sampai) {
        List<Transaction> trx = transaksiOmzet(channel, dari, sampai);

        // Kategori diambil dari produk saat ini; barang yang produknya sudah
        // dihapus dikelompokkan sebagai "Tanpa kategori".
        Map<Long, String> kategoriProduk = new HashMap<>();
        productRepository.findAll().forEach(p ->
                kategoriProduk.put(p.getId(),
                        p.getCategory() == null || p.getCategory().isBlank() ? "Tanpa kategori" : p.getCategory()));

        Map<String, double[]> rekap = new LinkedHashMap<>();  // [omzet, modal, qty]
        for (Transaction t : trx) {
            for (TransactionItem i : t.getItems()) {
                String kategori = kategoriProduk.getOrDefault(i.getProductId(), "Tanpa kategori");
                double[] nilai = rekap.computeIfAbsent(kategori, k -> new double[3]);
                nilai[0] += i.getSubtotal();
                nilai[1] += i.getTotalModal();
                nilai[2] += i.getQuantity() == null ? 0 : i.getQuantity();
            }
        }

        return rekap.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue()[0], a.getValue()[0]))
                .map(e -> {
                    Map<String, Object> baris = new LinkedHashMap<>();
                    baris.put("kategori", e.getKey());
                    baris.put("qty", (long) e.getValue()[2]);
                    baris.put("omzet", e.getValue()[0]);
                    baris.put("modal", e.getValue()[1]);
                    baris.put("laba", e.getValue()[0] - e.getValue()[1]);
                    return baris;
                })
                .toList();
    }

    /** Pelanggan yang paling banyak berbelanja. */
    public List<Map<String, Object>> perPelanggan(LocalDate dari, LocalDate sampai, int batas) {
        List<Transaction> trx = transaksiOmzet(null, dari, sampai);

        Map<String, double[]> rekap = new LinkedHashMap<>();  // [belanja, jumlahPesanan, barang]
        for (Transaction t : trx) {
            String nama = t.getNamaPelanggan();
            double[] nilai = rekap.computeIfAbsent(nama, k -> new double[3]);
            nilai[0] += t.getNilaiBarang();
            nilai[1] += 1;
            nilai[2] += t.getTotalQty();
        }

        return rekap.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue()[0], a.getValue()[0]))
                .limit(batas)
                .map(e -> {
                    Map<String, Object> baris = new LinkedHashMap<>();
                    baris.put("nama", e.getKey());
                    baris.put("totalBelanja", e.getValue()[0]);
                    baris.put("jumlahPesanan", (long) e.getValue()[1]);
                    baris.put("totalBarang", (long) e.getValue()[2]);
                    baris.put("rataRata", e.getValue()[1] == 0 ? 0 : e.getValue()[0] / e.getValue()[1]);
                    return baris;
                })
                .toList();
    }

    /** Tren enam bulan terakhir untuk grafik di dashboard. */
    public List<Map<String, Object>> tren6Bulan(String channel) {
        List<Map<String, Object>> hasil = new ArrayList<>();
        YearMonth sekarang = YearMonth.now();

        for (int i = 5; i >= 0; i--) {
            YearMonth ym = sekarang.minusMonths(i);
            List<Transaction> trx = transaksiOmzet(channel, ym.atDay(1), ym.atEndOfMonth());
            List<Expense> beban = pengeluaran(ym.atDay(1), ym.atEndOfMonth());

            double revenue = omzet(trx);
            double modal = hpp(trx);
            double keluar = totalPengeluaran(beban);

            Map<String, Object> baris = new LinkedHashMap<>();
            baris.put("bulan", ym.toString());
            baris.put("omzet", revenue);
            baris.put("hpp", modal);
            baris.put("pengeluaran", keluar);
            baris.put("laba", revenue - modal - keluar);
            hasil.add(baris);
        }
        return hasil;
    }
}
