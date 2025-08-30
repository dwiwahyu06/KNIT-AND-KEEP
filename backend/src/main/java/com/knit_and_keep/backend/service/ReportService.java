// package com.knit_and_keep.backend.service;

// import com.knit_and_keep.backend.model.*;
// import com.knit_and_keep.backend.repository.TransactionRepository;
// import org.springframework.stereotype.Service;

// import java.util.List;

// @Service
// public class ReportService {

//     private final TransactionRepository transactionRepository;
//     private final ExpenseRepository expenseRepository; // dipakai untuk backward-compat simple endpoint

//     public ReportService(TransactionRepository transactionRepository,
//                          ExpenseRepository expenseRepository) {
//         this.transactionRepository = transactionRepository;
//         this.expenseRepository = expenseRepository;
//     }

//     // =============== V1: SIMPLE (compat dengan frontend lama) ===============
//     public IncomeStatementResponse generateIncomeStatementSimple() {
//         List<Transaction> transactions = transactionRepository.findAll();

//         double revenue = transactions.stream()
//                 .filter(t -> t.getType() == TransactionType.IN)
//                 .filter(t -> t.getAmount() != null)
//                 .mapToDouble(Transaction::getAmount)
//                 .sum();

//         double hpp = 0.0; // di v1 belum ada, nanti tercover di v2 detil

//         double transactionExpenses = transactions.stream()
//                 .filter(t -> t.getType() == TransactionType.OUT)
//                 .filter(t -> t.getAmount() != null)
//                 .mapToDouble(Transaction::getAmount)
//                 .sum();

//         double otherExpenses = expenseRepository.findAll().stream()
//                 .filter(e -> e.getAmount() != null)
//                 .mapToDouble(Expense::getAmount)
//                 .sum();

//         double totalExpense = transactionExpenses + otherExpenses;
//         double profit = revenue - hpp - totalExpense;

//         return new IncomeStatementResponse(revenue, hpp, totalExpense, profit);
//     }

//     // =============== V2: DETAILED (sesuai akuntansi) ===============
//     public IncomeStatementDetailedResponse generateIncomeStatementDetailed() {
//         double revenue = safeSumByType(AccountType.REVENUE);
//         double hpp = safeSumByType(AccountType.HPP);
//         double grossProfit = revenue - hpp;

//         double operatingExpense = safeSumByType(AccountType.EXPENSE);
//         double operatingProfit = grossProfit - operatingExpense;

//         double other = safeSumByType(AccountType.OTHER); // bisa positif (pendapatan) atau negatif (beban)
//         double tax = safeSumByType(AccountType.TAX);     // asumsi selalu sebagai beban (positif)

//         double netProfit = operatingProfit + other - tax;

//         return new IncomeStatementDetailedResponse(
//                 revenue, hpp, grossProfit,
//                 operatingExpense, operatingProfit,
//                 other, tax, netProfit
//         );
//     }

//     private double safeSumByType(AccountType type) {
//         try {
//             return transactionRepository.sumByAccountType(type);
//         } catch (Exception e) {
//             return 0.0;
//         }
//     }
// }
