package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.Transaction;
import com.knit_and_keep.backend.model.UserPelanggan;
import com.knit_and_keep.backend.repository.TransactionRepository;
import com.knit_and_keep.backend.repository.UserPelangganRepository;
import okhttp3.*;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentService {

    @Value("${midtrans.server.key}")
    private String midtransServerKey;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserPelangganRepository userPelangganRepository;

    private final OkHttpClient client = new OkHttpClient();

    public String createTransaction(Long amount, Long pelangganId) throws IOException {
        String orderId = "KNIT-AND-KEEP-" + UUID.randomUUID().toString();

        UserPelanggan pelanggan = userPelangganRepository.findById(pelangganId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pelanggan tidak ditemukan"));

        Transaction transaction = new Transaction();
        transaction.setOrderId(orderId);
        transaction.setAmount(amount);
        transaction.setStatus("PENDING");
        transaction.setType("PAYMENT");
        transaction.setDescription("Pembayaran untuk pesanan " + orderId);
        transaction.setPelanggan(pelanggan); // Hubungkan ke objek Pelanggan
        
        // ✅ PERBAIKAN: Mengisi nilai untuk account_id agar tidak error
        
        transactionRepository.save(transaction);

        JSONObject transactionDetails = new JSONObject();
        transactionDetails.put("order_id", orderId);
        transactionDetails.put("gross_amount", amount);

        JSONObject customerDetails = new JSONObject();
        customerDetails.put("first_name", pelanggan.getUsername());
        customerDetails.put("email", pelanggan.getEmail());

        JSONObject requestBody = new JSONObject();
        requestBody.put("transaction_details", transactionDetails);
        requestBody.put("customer_details", customerDetails);

        RequestBody body = RequestBody.create(
            requestBody.toString(),
            MediaType.get("application/json; charset=utf-8")
        );

        String encodedKey = Base64.getEncoder().encodeToString((midtransServerKey + ":").getBytes());

        Request request = new Request.Builder()
            .url("https://app.sandbox.midtrans.com/snap/v1/transactions")
            .post(body)
            .addHeader("Accept", "application/json")
            .addHeader("Content-Type", "application/json")
            .addHeader("Authorization", "Basic " + encodedKey)
            .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "No response body";
                System.err.println("Gagal membuat transaksi Midtrans: " + errorBody);
                throw new IOException("Unexpected code " + response);
            }
            
            String responseBody = response.body().string();
            JSONObject jsonResponse = new JSONObject(responseBody);
            
            return jsonResponse.getString("token");
        }
    }

    @Transactional
    public void handleNotification(Map<String, Object> notification) {
        String orderId = (String) notification.get("order_id");
        String transactionStatus = (String) notification.get("transaction_status");
        String fraudStatus = (String) notification.get("fraud_status");

        Transaction transaction = transactionRepository.findByOrderId(orderId).orElse(null);

        if (transaction != null) {
            System.out.println("Memproses notifikasi untuk Order ID: " + orderId);
            if ("capture".equals(transactionStatus) || "settlement".equals(transactionStatus)) {
                if ("accept".equals(fraudStatus)) {
                    transaction.setStatus("SUCCESS");
                }
            } else if ("cancel".equals(transactionStatus) || "deny".equals(transactionStatus) || "expire".equals(transactionStatus)) {
                transaction.setStatus("FAILED");
            }
            transactionRepository.save(transaction);
        }
    }
}