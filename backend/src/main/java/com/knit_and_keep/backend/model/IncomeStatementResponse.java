package com.knit_and_keep.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class IncomeStatementResponse {
    private Double revenue;     // Pendapatan
    private Double hpp;         // Harga Pokok Penjualan
    private Double expense;     // Pengeluaran
    private Double profit;      // Laba/Rugi
}
