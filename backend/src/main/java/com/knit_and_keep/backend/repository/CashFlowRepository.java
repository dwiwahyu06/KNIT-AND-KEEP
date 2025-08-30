package com.knit_and_keep.backend.repository;

import com.knit_and_keep.backend.model.CashFlow;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CashFlowRepository extends JpaRepository<CashFlow, Long> {
}
