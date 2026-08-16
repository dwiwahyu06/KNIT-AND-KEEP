package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.OrderFlow;
import com.knit_and_keep.backend.model.Transaction;
import com.knit_and_keep.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Dipakai halaman Keuangan di sisi admin. Isinya transaksi yang sama dengan
 * /api/orders, tapi disajikan dari sudut pandang uang: tersaring ke transaksi
 * yang benar-benar dihitung sebagai omzet, dan bisa dibatasi per periode.
 */
@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:5173")
public class TransactionController {

    @Autowired
    private OrderService orderService;

    @GetMapping
    public ResponseEntity<List<Transaction>> semua(
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "false") boolean hanyaOmzet,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dari,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate sampai) {

        return ResponseEntity.ok(saring(channel, status, hanyaOmzet, dari, sampai));
    }

    @GetMapping("/ringkasan")
    public ResponseEntity<Map<String, Object>> ringkasan(
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dari,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate sampai) {

        List<Transaction> semua = saring(channel, null, false, dari, sampai);
        List<Transaction> omzet = semua.stream()
                .filter(t -> OrderFlow.masukOmzet(t.getStatus())).toList();

        // Nilai barang saja, tanpa ongkir — lihat Transaction#getNilaiBarang.
        double totalOmzet = omzet.stream().mapToDouble(Transaction::getNilaiBarang).sum();
        double totalModal = omzet.stream().mapToDouble(Transaction::getTotalModal).sum();
        long totalBarang = omzet.stream().mapToLong(Transaction::getTotalQty).sum();

        Map<String, Object> hasil = new HashMap<>();
        hasil.put("jumlahTransaksi", semua.size());
        hasil.put("jumlahTransaksiOmzet", omzet.size());
        hasil.put("totalOmzet", totalOmzet);
        hasil.put("totalModal", totalModal);
        hasil.put("labaKotor", totalOmzet - totalModal);
        hasil.put("totalBarangTerjual", totalBarang);
        return ResponseEntity.ok(hasil);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transaction> detail(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cari(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> hapus(@PathVariable Long id) {
        orderService.hapus(id);
        return ResponseEntity.noContent().build();
    }

    private List<Transaction> saring(String channel, String status, boolean hanyaOmzet,
                                     LocalDate dari, LocalDate sampai) {
        return orderService.semuaPesanan(channel, status).stream()
                .filter(t -> !hanyaOmzet || OrderFlow.masukOmzet(t.getStatus()))
                .filter(t -> {
                    if (dari == null && sampai == null) return true;
                    if (t.getCreatedAt() == null) return false;
                    LocalDate tanggal = t.getCreatedAt().toLocalDate();
                    if (dari != null && tanggal.isBefore(dari)) return false;
                    return sampai == null || !tanggal.isAfter(sampai);
                })
                .toList();
    }
}
