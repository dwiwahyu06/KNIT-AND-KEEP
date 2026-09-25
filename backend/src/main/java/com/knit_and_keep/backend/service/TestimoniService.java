package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.OrderFlow;
import com.knit_and_keep.backend.model.Testimoni;
import com.knit_and_keep.backend.model.Transaction;
import com.knit_and_keep.backend.repository.TestimoniRepository;
import com.knit_and_keep.backend.repository.TransactionRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Penilaian pelanggan atas pesanan yang sudah selesai.
 *
 * Aturan pokoknya cuma satu, tetapi menentukan: penilaian hanya bisa ditulis
 * oleh orang yang benar-benar membeli, dan hanya setelah barangnya diterima.
 * Tanpa itu, kolom testimoni berubah jadi papan tulis siapa saja — dan bintang
 * di halaman depan berhenti berarti apa-apa.
 */
@Service
public class TestimoniService {

    private static final Sort TERBARU = Sort.by(Sort.Direction.DESC, "createdAt");

    private final TestimoniRepository testimoniRepository;
    private final TransactionRepository transactionRepository;

    public TestimoniService(TestimoniRepository testimoniRepository,
                            TransactionRepository transactionRepository) {
        this.testimoniRepository = testimoniRepository;
        this.transactionRepository = transactionRepository;
    }

    // ==================== MEMBACA ====================

    /** Seluruh testimoni untuk halaman moderasi admin. */
    public List<Testimoni> semua(String tampil) {
        if (tampil == null || tampil.isBlank()) {
            return testimoniRepository.findAll(TERBARU);
        }
        return testimoniRepository.findByDitampilkan(
                Boolean.parseBoolean(tampil) || "TAMPIL".equalsIgnoreCase(tampil), TERBARU);
    }

    /** Testimoni untuk halaman depan. */
    public List<Testimoni> publik(int batas) {
        int aman = Math.max(1, Math.min(batas, 50));
        return testimoniRepository.publik(PageRequest.of(0, aman));
    }

    public List<Testimoni> untukProduk(Long productId) {
        return testimoniRepository.untukProduk(productId);
    }

    public List<Testimoni> milikPelanggan(Long pelangganId) {
        return testimoniRepository.findByPelanggan(pelangganId);
    }

    /** Testimoni sebuah pesanan, atau null bila pelanggannya belum menilai. */
    public Testimoni pesanan(Long transactionId) {
        return testimoniRepository.findByPesanan(transactionId).orElse(null);
    }

    /**
     * Pemilik sebuah pesanan, dipakai controller untuk memeriksa kepemilikan.
     *
     * Bisa bernilai null, dan itu bukan kekeliruan: penjualan di kasir toko
     * memang tidak punya akun pelanggan. Pesanannya ditarik lebih dulu supaya
     * pemilik yang kosong tidak tersamar menjadi "pesanan tidak ditemukan" —
     * pesanannya ada, hanya saja tidak ada yang berhak menilainya.
     */
    public Long pemilikPesanan(Long transactionId) {
        Transaction trx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Pesanan tidak ditemukan"));
        return trx.getPelangganId();
    }

    public Testimoni cari(Long id) {
        return testimoniRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Testimoni tidak ditemukan"));
    }

    /** Rata-rata bintang dan sebarannya, dipakai ringkasan di halaman depan. */
    public Map<String, Object> ringkasan() {
        return rangkum(testimoniRepository.sebaranBintang());
    }

    public Map<String, Object> ringkasanProduk(Long productId) {
        return rangkum(testimoniRepository.sebaranBintangProduk(productId));
    }

    private Map<String, Object> rangkum(List<Object[]> sebaranMentah) {
        Map<String, Long> sebaran = new LinkedHashMap<>();
        for (int b = 5; b >= 1; b--) sebaran.put(String.valueOf(b), 0L);

        long jumlah = 0;
        long totalBintang = 0;
        for (Object[] baris : sebaranMentah) {
            int bintang = ((Number) baris[0]).intValue();
            long banyak = ((Number) baris[1]).longValue();
            sebaran.put(String.valueOf(bintang), banyak);
            jumlah += banyak;
            totalBintang += (long) bintang * banyak;
        }

        double rataRata = jumlah == 0 ? 0 : Math.round((double) totalBintang / jumlah * 10) / 10.0;

        Map<String, Object> hasil = new LinkedHashMap<>();
        hasil.put("jumlah", jumlah);
        hasil.put("rataRata", rataRata);
        hasil.put("sebaran", sebaran);
        return hasil;
    }

    // ==================== MENULIS ====================

    /**
     * Pelanggan menilai pesanannya sendiri.
     *
     * Kepemilikan pesanan sudah diperiksa controller. Yang diurus di sini
     * adalah syarat yang melekat pada pesanannya: sudah selesai, berasal dari
     * pembelian online, dan belum pernah dinilai.
     */
    @Transactional
    public Testimoni kirim(Long transactionId, Integer rating, String ulasan) {
        Transaction trx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Pesanan tidak ditemukan"));

        if (!OrderFlow.SELESAI.equals(OrderFlow.normalize(trx.getStatus()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Penilaian baru bisa dikirim setelah pesanan selesai dan barang diterima");
        }
        if (trx.getPelanggan() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Penjualan di kasir toko tidak punya akun pelanggan untuk menilai");
        }
        if (testimoniRepository.findByPesanan(transactionId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Pesanan ini sudah pernah dinilai. Ubah penilaian yang lama bila ingin menggantinya.");
        }

        Testimoni t = new Testimoni();
        t.setTransaction(trx);
        t.setRating(periksaRating(rating));
        t.setUlasan(rapikanUlasan(ulasan));
        t.setDitampilkan(true);
        return testimoniRepository.save(t);
    }

    /** Pelanggan memperbaiki penilaiannya sendiri. */
    @Transactional
    public Testimoni ubah(Long id, Integer rating, String ulasan) {
        Testimoni t = cari(id);
        t.setRating(periksaRating(rating));
        t.setUlasan(rapikanUlasan(ulasan));
        return testimoniRepository.save(t);
    }

    /** Admin menurunkan atau menaikkan testimoni dari halaman umum. */
    @Transactional
    public Testimoni aturTampil(Long id, boolean tampil) {
        Testimoni t = cari(id);
        t.setDitampilkan(tampil);
        return testimoniRepository.save(t);
    }

    /** Admin menjawab testimoni. Jawaban kosong menghapus balasan sebelumnya. */
    @Transactional
    public Testimoni balas(Long id, String balasan) {
        Testimoni t = cari(id);
        t.setBalasanAdmin(balasan == null || balasan.isBlank() ? null : balasan.trim());
        return testimoniRepository.save(t);
    }

    @Transactional
    public void hapus(Long id) {
        testimoniRepository.delete(cari(id));
    }

    // ==================== PEMBANTU ====================

    private Integer periksaRating(Integer rating) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Bintang harus diisi antara 1 sampai 5");
        }
        return rating;
    }

    private String rapikanUlasan(String ulasan) {
        if (ulasan == null) return null;
        String bersih = ulasan.trim();
        if (bersih.isEmpty()) return null;
        // Kolomnya 1024 karakter; potong di sini supaya pelanggan mendapat
        // penilaian yang tersimpan, bukan galat database.
        return bersih.length() > 1024 ? bersih.substring(0, 1024) : bersih;
    }
}
