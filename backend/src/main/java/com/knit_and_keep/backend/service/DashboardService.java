// package com.knit_and_keep.backend.service;

// import com.knit_and_keep.backend.repository.*;
// import lombok.RequiredArgsConstructor;
// import org.springframework.stereotype.Service;

// import java.util.*;

// @Service
// @RequiredArgsConstructor
// public class DashboardService {

//   private final ProductRepository productRepo;
//   private final OrderRepository orderRepo;
//   private final OrderItemRepository orderItemRepo;
//   private final ExpenseRepository expenseRepo;
//   private final UserPelangganRepository userRepo;

//   public Map<String, Object> getSummary() {
//     Map<String, Object> map = new HashMap<>();
//     map.put("totalProducts", productRepo.countAllProducts());
//     map.put("ordersCount", orderRepo.countOrders());
//     map.put("totalStock", productRepo.sumTotalStock());
//     map.put("outOfStock", productRepo.countOutOfStock());
//     map.put("totalCustomers", userRepo.countCustomers());
//     return map;
//   }

//   public Map<String, Long> getInventoryValues() {
//     long sold = orderItemRepo.sumSoldUnits();
//     long total = productRepo.sumTotalStock();
//     Map<String, Long> map = new HashMap<>();
//     map.put("sold", sold);
//     map.put("total", total);
//     return map;
//   }

//   public List<Map<String, Object>> getExpenseVsProfit6M() {
//     List<Map<String, Object>> out = new ArrayList<>();

//     Map<String, Double> revenue = new LinkedHashMap<>();
//     Map<String, Double> expense = new LinkedHashMap<>();

//     orderRepo.revenueLast6Months().forEach(r -> revenue.put((String) r[0], ((Number) r[1]).doubleValue()));
//     expenseRepo.expenseLast6Months().forEach(r -> expense.put((String) r[0], ((Number) r[1]).doubleValue()));

//     Set<String> months = new TreeSet<>(revenue.keySet());
//     months.addAll(expense.keySet());

//     for (String m : months) {
//       double rev = revenue.getOrDefault(m, 0.0);
//       double exp = expense.getOrDefault(m, 0.0);
//       Map<String, Object> row = new HashMap<>();
//       row.put("month", m);
//       row.put("expense", exp);
//       row.put("profit", rev - exp);
//       out.add(row);
//     }
//     return out;
//   }

//   public List<Map<String, Object>> getTopSales() {
//     List<Map<String, Object>> out = new ArrayList<>();
//     orderItemRepo.top10ProductByQty().forEach(r -> {
//       Map<String, Object> row = new HashMap<>();
//       row.put("name", r[0]);
//       row.put("quantity", ((Number) r[1]).longValue());
//       out.add(row);
//     });
//     return out;
//   }
// }
