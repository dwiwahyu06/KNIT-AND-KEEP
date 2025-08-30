package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.Transaction;
import com.knit_and_keep.backend.repository.TransactionRepository;
import com.knit_and_keep.backend.service.OrderService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderContoller {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private OrderService orderService;

    // Endpoint untuk admin mengambil SEMUA pesanan, diurutkan dari yang terbaru
    @GetMapping("/admin/all")
    public ResponseEntity<List<Transaction>> getAllOrders() {
        // Mengambil semua transaksi dan menyortirnya berdasarkan createdAt menurun
        List<Transaction> orders = transactionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(orders);
    }
    
    // Endpoint untuk pelanggan mengambil pesanannya SENDIRI
    // @GetMapping("/user/{pelangganId}")
    // public ResponseEntity<List<Transaction>> getUserOrders(@PathVariable Long pelangganId) {
    //     List<Transaction> orders = transactionRepository.findByPelangganId(pelangganId);
    //     return ResponseEntity.ok(orders);
    // }

     @GetMapping("/user/{pelangganId}")
    public ResponseEntity<List<Transaction>> getUserOrders(@PathVariable Long pelangganId) {
        List<Transaction> orders = transactionRepository.findByPelangganId(pelangganId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<Transaction> getOrderById(@PathVariable Long transactionId) {
        return transactionRepository.findById(transactionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/admin/update/{transactionId}")
    public ResponseEntity<Transaction> updateOrder(
            @PathVariable Long transactionId,
            @RequestBody Map<String, String> payload) {
        
        String newStatus = payload.get("status");
        String nomorResi = payload.get("nomorResi");

        Transaction updatedTransaction = orderService.updateOrderStatus(transactionId, newStatus, nomorResi);
        return ResponseEntity.ok(updatedTransaction);
    }
}