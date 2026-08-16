package com.knit_and_keep.backend.repository;

import com.knit_and_keep.backend.model.Retur;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReturRepository extends JpaRepository<Retur, Long> {

    List<Retur> findByStatus(String status, Sort sort);

    /* Ditulis eksplisit karena Retur punya getter turunan getTransactionId(). */
    @Query("SELECT r FROM Retur r WHERE r.transaction.id = :transactionId ORDER BY r.createdAt DESC")
    List<Retur> findByPesanan(@Param("transactionId") Long transactionId);

    @Query("SELECT r FROM Retur r WHERE r.transaction.pelanggan.id = :pelangganId ORDER BY r.createdAt DESC")
    List<Retur> findByPelanggan(@Param("pelangganId") Long pelangganId);

    long countByStatus(String status);
}
