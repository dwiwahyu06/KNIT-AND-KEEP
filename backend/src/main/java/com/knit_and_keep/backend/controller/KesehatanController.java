package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.repository.ProductRepository;
import com.knit_and_keep.backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Titik pemeriksaan kesehatan aplikasi.
 *
 * <p>Dipakai layanan pemantauan seperti UptimeRobot untuk tahu aplikasinya
 * masih hidup, dan untuk membangunkan server yang tertidur pada paket gratis.
 * Tanpa ini, gangguan baru ketahuan setelah ada pembeli yang mengeluh.
 *
 * <p>Sengaja tidak memaparkan rincian apa pun tentang isi toko, karena alamat
 * ini terbuka untuk umum.
 */
@RestController
@RequestMapping("/api/kesehatan")
public class KesehatanController {

    private final ProductRepository productRepository;
    private final TransactionRepository transactionRepository;

    @Value("${midtrans.is-production}") private boolean produksi;
    @Value("${app.zona-waktu}")         private String zona;

    public KesehatanController(ProductRepository productRepository,
                               TransactionRepository transactionRepository) {
        this.productRepository = productRepository;
        this.transactionRepository = transactionRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> periksa() {
        Map<String, Object> hasil = new LinkedHashMap<>();
        hasil.put("waktu", LocalDateTime.now().toString());
        hasil.put("zonaWaktu", zona);
        hasil.put("mode", produksi ? "produksi" : "pengembangan");

        try {
            // Satu kueri ringan sudah cukup membuktikan database masih terjawab.
            long produk = productRepository.count();
            long pesanan = transactionRepository.count();
            hasil.put("database", "terhubung");
            hasil.put("jumlahProduk", produk);
            hasil.put("jumlahPesanan", pesanan);
            hasil.put("status", "sehat");
            return ResponseEntity.ok(hasil);
        } catch (Exception e) {
            hasil.put("database", "tidak terhubung");
            hasil.put("status", "bermasalah");
            hasil.put("pesan", e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(hasil);
        }
    }
}
