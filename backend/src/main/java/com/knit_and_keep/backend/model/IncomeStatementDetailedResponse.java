package com.knit_and_keep.backend.model;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IncomeStatementDetailedResponse {
    private double revenue;               // Pendapatan
    private double hpp;                   // Harga Pokok Penjualan
    private double grossProfit;           // Laba Kotor = revenue - hpp

    private double operatingExpense;      // Beban Operasional
    private double operatingProfit;       // Laba Usaha = Laba Kotor - Beban Operasional

    private double otherIncomeExpense;    // Pendapatan/Beban lain-lain (positif = pendapatan, negatif = beban)
    private double tax;                   // Pajak

    private double netProfit;             // Laba Bersih = Laba Usaha + other - tax
}
