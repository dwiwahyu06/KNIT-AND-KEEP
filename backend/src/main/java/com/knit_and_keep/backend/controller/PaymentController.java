package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/create-transaction")
    public ResponseEntity<Map<String, String>> createTransaction(@RequestBody Map<String, Object> requestBody) {
        try {
            Long amount = Long.parseLong(requestBody.get("amount").toString());
            // ✅ Ambil pelangganId dari request body yang dikirim frontend
            Long pelangganId = Long.parseLong(requestBody.get("pelangganId").toString());
            
            String token = paymentService.createTransaction(amount, pelangganId);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/notification-handler")
    public ResponseEntity<String> handleMidtransNotification(@RequestBody Map<String, Object> notification) {
        System.out.println("Menerima notifikasi dari Midtrans: " + notification);
        paymentService.handleNotification(notification);
        return ResponseEntity.ok("Notifikasi diterima");
    }
}