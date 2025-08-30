package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.CashFlow;
import com.knit_and_keep.backend.repository.CashFlowRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CashFlowService {
    private final CashFlowRepository repository;

    public CashFlowService(CashFlowRepository repository) {
        this.repository = repository;
    }

    public List<CashFlow> getAll() {
        return repository.findAll();
    }

    public CashFlow save(CashFlow cashFlow) {
        return repository.save(cashFlow);
    }
}

