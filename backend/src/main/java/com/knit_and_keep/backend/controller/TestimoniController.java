package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.Testimoni;
import com.knit_and_keep.backend.model.TestimoniPublik;
import com.knit_and_keep.backend.security.Sesi;
import com.knit_and_keep.backend.service.TestimoniService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/testimoni")
@CrossOrigin(origins = "http://localhost:5173")
public class TestimoniController {

    private final TestimoniService testimoniService;

    public TestimoniController(TestimoniService testimoniService) {
        this.testimoniService = testimoniService;
    }

    // ==================== TERBUKA UNTUK UMUM ====================

    /** Testimoni untuk halaman depan. */
    @GetMapping("/publik")
    public ResponseEntity<List<TestimoniPublik>> publik(@RequestParam(defaultValue = "6") int batas) {
        return ResponseEntity.ok(TestimoniPublik.dari(testimoniService.publik(batas)));
    }

    /** Rata-rata bintang seluruh toko beserta sebarannya. */
    @GetMapping("/ringkasan")
    public ResponseEntity<Map<String, Object>> ringkasan() {
        return ResponseEntity.ok(testimoniService.ringkasan());
    }

    /** Ulasan yang menyebut sebuah produk, untuk halaman detail barang. */
    @GetMapping("/produk/{productId}")
    public ResponseEntity<Map<String, Object>> produk(@PathVariable Long productId) {
        return ResponseEntity.ok(Map.of(
                "ringkasan", testimoniService.ringkasanProduk(productId),
                "daftar", TestimoniPublik.dari(testimoniService.untukProduk(productId))));
    }

    // ==================== PELANGGAN ====================

    /** Penilaian sebuah pesanan; badan kosong bila pelanggannya belum menilai. */
    @GetMapping("/pesanan/{transactionId}")
    public ResponseEntity<Testimoni> pesanan(@PathVariable Long transactionId) {
        Sesi.wajibPemilik(testimoniService.pemilikPesanan(transactionId));
        Testimoni t = testimoniService.pesanan(transactionId);
        return t == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(t);
    }

    @GetMapping("/user/{pelangganId}")
    public ResponseEntity<List<Testimoni>> milikPelanggan(@PathVariable Long pelangganId) {
        Sesi.wajibPemilik(pelangganId);
        return ResponseEntity.ok(testimoniService.milikPelanggan(pelangganId));
    }

    @PostMapping
    public ResponseEntity<Testimoni> kirim(@RequestBody Map<String, Object> payload) {
        Long transactionId = Long.parseLong(String.valueOf(payload.get("transactionId")));
        Sesi.wajibPemilik(testimoniService.pemilikPesanan(transactionId));
        return ResponseEntity.ok(testimoniService.kirim(
                transactionId, bacaRating(payload), (String) payload.get("ulasan")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Testimoni> ubah(@PathVariable Long id,
                                          @RequestBody Map<String, Object> payload) {
        Sesi.wajibPemilik(testimoniService.cari(id).getPelangganId());
        return ResponseEntity.ok(testimoniService.ubah(
                id, bacaRating(payload), (String) payload.get("ulasan")));
    }

    // ==================== ADMIN ====================

    /** Seluruh testimoni untuk dimoderasi. Saring dengan ?tampil=true / false. */
    @GetMapping
    public ResponseEntity<List<Testimoni>> semua(@RequestParam(required = false) String tampil) {
        return ResponseEntity.ok(testimoniService.semua(tampil));
    }

    @PutMapping("/{id}/tampilkan")
    public ResponseEntity<Testimoni> aturTampil(@PathVariable Long id,
                                                @RequestBody Map<String, Object> payload) {
        boolean tampil = Boolean.parseBoolean(String.valueOf(payload.getOrDefault("tampil", true)));
        return ResponseEntity.ok(testimoniService.aturTampil(id, tampil));
    }

    @PutMapping("/{id}/balas")
    public ResponseEntity<Testimoni> balas(@PathVariable Long id,
                                           @RequestBody(required = false) Map<String, Object> payload) {
        String balasan = payload == null ? null : (String) payload.get("balasanAdmin");
        return ResponseEntity.ok(testimoniService.balas(id, balasan));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> hapus(@PathVariable Long id) {
        testimoniService.hapus(id);
        return ResponseEntity.ok(Map.of("pesan", "Testimoni dihapus."));
    }

    private Integer bacaRating(Map<String, Object> payload) {
        Object nilai = payload.get("rating");
        return nilai == null ? null : Integer.parseInt(String.valueOf(nilai));
    }
}
