package com.knit_and_keep.backend.repository;

import com.knit_and_keep.backend.model.Transaction;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
     Optional<Transaction> findByOrderId(String orderId);
      List<Transaction> findByPelangganId(Long pelangganId);
}