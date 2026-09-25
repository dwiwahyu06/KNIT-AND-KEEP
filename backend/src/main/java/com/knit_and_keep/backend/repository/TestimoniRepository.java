package com.knit_and_keep.backend.repository;

import com.knit_and_keep.backend.model.Testimoni;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TestimoniRepository extends JpaRepository<Testimoni, Long> {

    List<Testimoni> findByDitampilkan(boolean ditampilkan, Sort sort);

    /* Ditulis eksplisit karena Testimoni punya getter turunan getTransactionId(). */
    @Query("SELECT t FROM Testimoni t WHERE t.transaction.id = :transactionId")
    Optional<Testimoni> findByPesanan(@Param("transactionId") Long transactionId);

    @Query("SELECT t FROM Testimoni t WHERE t.transaction.pelanggan.id = :pelangganId "
            + "ORDER BY t.createdAt DESC")
    List<Testimoni> findByPelanggan(@Param("pelangganId") Long pelangganId);

    /** Testimoni yang layak tampil di halaman umum, terbaru dulu. */
    @Query("SELECT t FROM Testimoni t WHERE t.ditampilkan = true ORDER BY t.createdAt DESC")
    List<Testimoni> publik(Pageable batas);

    /**
     * Ulasan untuk sebuah produk.
     *
     * Testimoni tidak menyimpan productId — yang dinilai adalah pesanannya.
     * Jadi produk ditelusuri lewat rincian pesanan: testimoni ikut tampil di
     * halaman produk bila pesanan yang dinilainya memang memuat produk itu.
     */
    @Query("SELECT t FROM Testimoni t WHERE t.ditampilkan = true AND EXISTS ("
            + "  SELECT 1 FROM TransactionItem i "
            + "  WHERE i.transaction = t.transaction AND i.productId = :productId) "
            + "ORDER BY t.createdAt DESC")
    List<Testimoni> untukProduk(@Param("productId") Long productId);

    /**
     * Jumlah testimoni per bintang, misalnya [[5, 12], [4, 3]].
     *
     * Satu kueri ini cukup untuk menghitung rata-rata sekaligus sebarannya,
     * tanpa perlu memuat seluruh baris testimoni ke memori.
     */
    @Query("SELECT t.rating, COUNT(t) FROM Testimoni t WHERE t.ditampilkan = true GROUP BY t.rating")
    List<Object[]> sebaranBintang();

    @Query("SELECT t.rating, COUNT(t) FROM Testimoni t WHERE t.ditampilkan = true AND EXISTS ("
            + "  SELECT 1 FROM TransactionItem i "
            + "  WHERE i.transaction = t.transaction AND i.productId = :productId) "
            + "GROUP BY t.rating")
    List<Object[]> sebaranBintangProduk(@Param("productId") Long productId);
}
