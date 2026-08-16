package com.knit_and_keep.backend.repository;

import com.knit_and_keep.backend.model.Transaction;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByOrderId(String orderId);

    /*
     * Ditulis eksplisit, bukan derived query. Transaction punya getter turunan
     * getPelangganId() untuk kebutuhan JSON, dan Spring Data akan salah
     * mengiranya sebagai kolom kalau nama metodenya dibiarkan diterjemahkan.
     */
    @Query("SELECT t FROM Transaction t WHERE t.pelanggan.id = :pelangganId ORDER BY t.createdAt DESC")
    List<Transaction> findByPelanggan(@Param("pelangganId") Long pelangganId);

    List<Transaction> findByChannel(String channel, Sort sort);

    @Query("SELECT t FROM Transaction t WHERE t.createdAt BETWEEN :dari AND :sampai")
    List<Transaction> findDalamRentang(@Param("dari") LocalDateTime dari,
                                       @Param("sampai") LocalDateTime sampai);

    long countByStatus(String status);

    long countByChannel(String channel);
}
