package com.knit_and_keep.backend.repository;

import com.knit_and_keep.backend.model.CashFlow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CashFlowRepository extends JpaRepository<CashFlow, Long> {

    /**
     * Penyaring arus kas.
     *
     * Penyaringan dilakukan di kueri, bukan dengan membaca seluruh tabel lalu
     * memilah di memori — supaya tetap ringan setelah catatannya menumpuk.
     * Parameter selalu diisi nilai penanda, karena PostgreSQL tidak bisa
     * menebak tipe data dari perbandingan {@code ? IS NULL}.
     */
    @Query("""
        SELECT c FROM CashFlow c
        WHERE (:jenis = '' OR c.type = :jenis)
          AND c.date BETWEEN :dari AND :sampai
        ORDER BY c.date DESC, c.id DESC
        """)
    List<CashFlow> cari(@Param("jenis") String jenis,
                        @Param("dari") LocalDateTime dari,
                        @Param("sampai") LocalDateTime sampai);

    List<CashFlow> findByReferensi(String referensi);

    @Modifying
    @Query("DELETE FROM CashFlow c WHERE c.referensi = :referensi")
    int hapusByReferensi(@Param("referensi") String referensi);
}
