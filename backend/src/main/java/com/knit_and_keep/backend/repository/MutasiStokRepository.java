package com.knit_and_keep.backend.repository;

import com.knit_and_keep.backend.model.MutasiStok;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MutasiStokRepository extends JpaRepository<MutasiStok, Long> {

    /**
     * Penyaring kartu stok.
     *
     * Setiap parameter selalu diisi nilai penanda, tidak pernah null:
     * PostgreSQL tidak bisa menebak tipe data dari perbandingan
     * {@code ? IS NULL} dan akan menolak kuerinya.
     */
    @Query("""
        SELECT m FROM MutasiStok m
        WHERE (:productId = -1 OR m.productId = :productId)
          AND (:jenis = '' OR m.jenis = :jenis)
          AND m.waktu BETWEEN :dari AND :sampai
        ORDER BY m.waktu DESC, m.id DESC
        """)
    List<MutasiStok> cari(@Param("productId") Long productId,
                          @Param("jenis") String jenis,
                          @Param("dari") LocalDateTime dari,
                          @Param("sampai") LocalDateTime sampai);
}
