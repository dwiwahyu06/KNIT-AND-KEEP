package com.knit_and_keep.backend.repository;


import com.knit_and_keep.backend.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockRepository extends JpaRepository<Stock, Long> {
}

