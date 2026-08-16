package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.OrderFlow;
import com.knit_and_keep.backend.model.Transaction;
import com.knit_and_keep.backend.security.Sesi;
import com.knit_and_keep.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    @Autowired
    private OrderService orderService;

    // ==================== ADMIN ====================

    /** Semua pesanan, bisa disaring per channel dan per status. */
    @GetMapping("/admin/all")
    public ResponseEntity<List<Transaction>> semuaPesanan(
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(orderService.semuaPesanan(channel, status));
    }

    @PutMapping("/admin/update/{transactionId}")
    public ResponseEntity<Transaction> ubahStatus(
            @PathVariable Long transactionId,
            @RequestBody Map<String, String> payload) {

        return ResponseEntity.ok(orderService.ubahStatus(
                transactionId,
                payload.get("status"),
                payload.get("nomorResi"),
                payload.get("kurir"),
                payload.get("catatan"),
                "ADMIN"));
    }

    /** Pengganti webhook Midtrans, yang tidak bisa menjangkau localhost. */
    @PostMapping("/admin/{transactionId}/konfirmasi-pembayaran")
    public ResponseEntity<Transaction> konfirmasiPembayaran(
            @PathVariable Long transactionId,
            @RequestBody(required = false) Map<String, String> payload) {

        String metode = payload == null ? null : payload.get("metodeBayar");
        String catatan = payload == null ? null : payload.get("catatan");
        return ResponseEntity.ok(orderService.konfirmasiPembayaran(transactionId, metode, catatan));
    }

    /** Penjualan langsung di toko. Alurnya sama, hanya tanpa Midtrans dan alamat. */
    @SuppressWarnings("unchecked")
    @PostMapping("/admin/offline")
    public ResponseEntity<Transaction> penjualanOffline(@RequestBody Map<String, Object> payload) {
        List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
        String nama = (String) payload.getOrDefault("namaPelanggan", "Offline");
        String metode = (String) payload.getOrDefault("metodeBayar", "TUNAI");
        String catatan = (String) payload.get("catatan");
        return ResponseEntity.ok(orderService.penjualanOffline(items, nama, metode, catatan));
    }

    @DeleteMapping("/admin/{transactionId}")
    public ResponseEntity<Void> hapus(@PathVariable Long transactionId) {
        orderService.hapus(transactionId);
        return ResponseEntity.noContent().build();
    }

    // ==================== PELANGGAN ====================

    /** Membuat pesanan dari keranjang, sebelum pembayaran dimulai. */
    @SuppressWarnings("unchecked")
    @PostMapping("/checkout")
    public ResponseEntity<Transaction> checkout(@RequestBody Map<String, Object> payload) {
        Long pelangganId = Long.parseLong(payload.get("pelangganId").toString());
        Sesi.wajibPemilik(pelangganId);
        List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
        Long addressId = payload.get("addressId") == null
                ? null : Long.parseLong(payload.get("addressId").toString());
        Map<String, Object> pengiriman = (Map<String, Object>) payload.get("pengiriman");
        String catatan = (String) payload.get("catatan");

        return ResponseEntity.ok(
                orderService.checkout(pelangganId, items, addressId, pengiriman, catatan));
    }

    @GetMapping("/user/{pelangganId}")
    public ResponseEntity<List<Transaction>> pesananSaya(@PathVariable Long pelangganId) {
        Sesi.wajibPemilik(pelangganId);
        return ResponseEntity.ok(orderService.pesananPelanggan(pelangganId));
    }

    @PostMapping("/{transactionId}/terima")
    public ResponseEntity<Transaction> terimaBarang(
            @PathVariable Long transactionId,
            @RequestBody(required = false) Map<String, Object> payload) {
        Long pelangganId = Sesi.wajibMasuk().id();
        return ResponseEntity.ok(orderService.terimaBarang(transactionId, pelangganId));
    }

    // ==================== UMUM ====================

    @GetMapping("/{transactionId}")
    public ResponseEntity<Transaction> detail(@PathVariable Long transactionId) {
        Transaction trx = orderService.cari(transactionId);
        pastikanBoleh(trx);
        return ResponseEntity.ok(trx);
    }

    /** Daftar status yang bisa dipilih berikutnya, dipakai frontend untuk mengisi dropdown. */
    @GetMapping("/{transactionId}/status-lanjutan")
    public ResponseEntity<Map<String, Object>> statusLanjutan(@PathVariable Long transactionId) {
        Sesi.wajibAdmin();
        Transaction trx = orderService.cari(transactionId);
        String sekarang = OrderFlow.normalize(trx.getStatus());
        List<Map<String, String>> pilihan = OrderFlow.lanjutanDari(sekarang).stream()
                .map(s -> Map.of("value", s, "label", OrderFlow.label(s)))
                .toList();
        return ResponseEntity.ok(Map.of(
                "status", sekarang,
                "statusLabel", OrderFlow.label(sekarang),
                "lanjutan", pilihan));
    }

    /**
     * Pelanggan hanya boleh melihat pesanannya sendiri.
     *
     * Tanpa pemeriksaan ini, nomor pesanan bisa ditebak berurutan untuk
     * mengumpulkan nama, alamat, dan nomor telepon seluruh pembeli.
     */
    private void pastikanBoleh(Transaction trx) {
        if (Sesi.adalahAdmin()) return;
        Long pemilik = trx.getPelanggan() == null ? null : trx.getPelanggan().getId();
        Sesi.wajibPemilik(pemilik);
    }
}
