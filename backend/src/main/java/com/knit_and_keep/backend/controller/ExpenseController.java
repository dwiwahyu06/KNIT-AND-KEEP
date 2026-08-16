package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.Expense;
import com.knit_and_keep.backend.service.ExpenseService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "http://localhost:5173")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public List<Expense> semua(
            @RequestParam(required = false) String kategori,
            @RequestParam(required = false)
            @org.springframework.format.annotation.DateTimeFormat(
                    iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
            java.time.LocalDate dari,
            @RequestParam(required = false)
            @org.springframework.format.annotation.DateTimeFormat(
                    iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
            java.time.LocalDate sampai) {
        return expenseService.cari(kategori, dari, sampai);
    }

    @PostMapping
    public Expense create(@RequestBody Expense expense) {
        return expenseService.save(expense);
    }

    @PutMapping("/{id}")
    public Expense update(@PathVariable Long id, @RequestBody Expense expense) {
        return expenseService.update(id, expense);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        expenseService.delete(id);
    }
}
