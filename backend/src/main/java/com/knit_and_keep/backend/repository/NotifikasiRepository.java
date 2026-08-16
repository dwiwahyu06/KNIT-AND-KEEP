package com.knit_and_keep.backend.repository;

import com.knit_and_keep.backend.model.Notifikasi;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotifikasiRepository extends JpaRepository<Notifikasi, Long> {

    Page<Notifikasi> findByPelangganIdOrderByWaktuDesc(Long pelangganId, Pageable pageable);

    long countByPelangganIdAndDibacaFalse(Long pelangganId);

    @Modifying
    @Query("UPDATE Notifikasi n SET n.dibaca = true WHERE n.pelangganId = :pelangganId AND n.dibaca = false")
    int tandaiSemuaDibaca(@Param("pelangganId") Long pelangganId);

    /**
     * Membuang pemberitahuan lama yang sudah dibaca.
     *
     * <p>Penghapusannya dikerjakan langsung oleh database, bukan dengan menarik
     * seluruh tabel ke memori lebih dulu — kalau tidak, justru pembersihannya
     * yang membebani aplikasi setelah datanya menumpuk bertahun-tahun.
     */
    @Modifying
    @Query("DELETE FROM Notifikasi n WHERE n.dibaca = true AND n.waktu < :batas")
    int hapusYangSudahDibacaSebelum(@Param("batas") java.time.LocalDateTime batas);
}
