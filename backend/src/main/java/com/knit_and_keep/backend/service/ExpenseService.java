package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.Expense;
import com.knit_and_keep.backend.repository.ExpenseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CashFlowService cashFlowService;

    public ExpenseService(ExpenseRepository expenseRepository, CashFlowService cashFlowService) {
        this.expenseRepository = expenseRepository;
        this.cashFlowService = cashFlowService;
    }

    public List<Expense> getAll() {
        return cari(null, null, null);
    }

    /** Penyaringan dikerjakan di kueri, bukan dengan membaca seluruh tabel. */
    public List<Expense> cari(String kategori, java.time.LocalDate dari, java.time.LocalDate sampai) {
        return expenseRepository.cari(
                kategori == null || kategori.isBlank() ? "" : kategori,
                dari == null ? java.time.LocalDate.of(2000, 1, 1) : dari,
                sampai == null ? java.time.LocalDate.now().plusYears(50) : sampai);
    }

    /** Setiap pengeluaran otomatis ikut tercatat sebagai kas keluar. */
    @Transactional
    public Expense save(Expense expense) {
        periksa(expense);
        Expense tersimpan = expenseRepository.save(expense);
        cashFlowService.catat("OUT",
                tersimpan.getAmount() == null ? 0 : tersimpan.getAmount(),
                tersimpan.getDescription(),
                "PENGELUARAN",
                "EXP-" + tersimpan.getId(),
                null);
        return tersimpan;
    }

    @Transactional
    public Expense update(Long id, Expense detail) {
        periksa(detail);
        Expense existing = expenseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pengeluaran tidak ditemukan"));

        existing.setDescription(detail.getDescription());
        existing.setAmount(detail.getAmount());
        existing.setCategory(detail.getCategory());
        if (detail.getDate() != null) existing.setDate(detail.getDate());

        Expense tersimpan = expenseRepository.save(existing);

        // Catatan kas lama diganti dengan nilai terbaru supaya tidak dihitung dua kali.
        cashFlowService.hapusByReferensi("EXP-" + id);
        cashFlowService.catat("OUT",
                tersimpan.getAmount() == null ? 0 : tersimpan.getAmount(),
                tersimpan.getDescription(),
                "PENGELUARAN",
                "EXP-" + tersimpan.getId(),
                null);
        return tersimpan;
    }

    @Transactional
    public void delete(Long id) {
        cashFlowService.hapusByReferensi("EXP-" + id);
        expenseRepository.deleteById(id);
    }

    private void periksa(Expense e) {
        if (e.getDescription() == null || e.getDescription().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Keterangan pengeluaran wajib diisi");
        }
        if (e.getAmount() == null || e.getAmount() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Nominal pengeluaran harus lebih dari nol");
        }
        if (e.getDate() != null && e.getDate().isAfter(java.time.LocalDate.now().plusDays(1))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tanggal pengeluaran tidak boleh di masa depan");
        }
    }
}
