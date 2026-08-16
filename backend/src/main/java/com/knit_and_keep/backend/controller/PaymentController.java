package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.service.MidtransService;
import com.knit_and_keep.backend.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:5173")
public class PaymentController {

    @Autowired private PaymentService paymentService;
    @Autowired private MidtransService midtransService;

    /** Client key dan alamat skrip Snap sesuai lingkungan yang sedang aktif. */
    @GetMapping("/config")
    public Map<String, Object> config() {
        return midtransService.konfigurasiKlien();
    }

    /** Meminta token pembayaran untuk pesanan yang sudah dibuat. */
    @PostMapping("/create-transaction")
    public ResponseEntity<?> buatTransaksi(@RequestBody Map<String, Object> payload) {
        try {
            Long transactionId = Long.parseLong(payload.get("transactionId").toString());
            return ResponseEntity.ok(paymentService.mulaiPembayaran(transactionId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Menanyakan status pembayaran langsung ke Midtrans lalu menyesuaikan
     * status pesanan.
     *
     * Menggantikan endpoint lama yang mempercayai kabar dari browser — dengan
     * cara itu siapa pun bisa menandai pesanan orang lain sebagai lunas.
     */
    @PostMapping("/{transactionId}/sinkron")
    public ResponseEntity<?> sinkron(@PathVariable Long transactionId) {
        return ResponseEntity.ok(paymentService.sinkronkan(transactionId));
    }

    /** Notifikasi resmi Midtrans. Tanda tangannya diperiksa sebelum dipercaya. */
    @PostMapping("/notification-handler")
    public ResponseEntity<String> notifikasi(@RequestBody Map<String, Object> notifikasi) {
        paymentService.tanganiNotifikasi(notifikasi);
        return ResponseEntity.ok("OK");
    }
}
