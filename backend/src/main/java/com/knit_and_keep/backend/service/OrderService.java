package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.Transaction;
import com.knit_and_keep.backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrderService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Transactional
    public Transaction updateOrderStatus(Long transactionId, String newStatus, String nomorResi) {
        // 1. Cari transaksi berdasarkan ID-nya
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaksi tidak ditemukan"));

        // 2. Perbarui statusnya
        if (newStatus != null && !newStatus.isBlank()) {
            transaction.setStatus(newStatus);
        }

        // 3. Perbarui nomor resi jika ada
        if (nomorResi != null) {
            // Jika admin mengirim string kosong, simpan sebagai null agar bersih
            transaction.setNomorResi(nomorResi.isBlank() ? null : nomorResi);
        }

        // 4. Simpan perubahan ke database
        return transactionRepository.save(transaction);
    }
}