package com.knit_and_keep.backend.model;

import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class DashboardSummaryDTO {
  private long totalProducts;
  private long ordersCount;
  private long totalStock;      // SUM quantity di stock
  private long outOfStock;      // count product yg qty=0
  private long totalCustomers;  // count user_pelanggan
}

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
class InventoryValuesDTO {
  private long soldUnits;   // SUM qty order_items
  private long totalUnits;  // SUM qty stock
}

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
class LinePointDTO {
  private String month;     // "2025-01"
  private double expense;
  private double profit;    // revenue - expense
}

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
class TopSaleDTO {
  private String name;      // product name
  private long sales;       // total qty terjual
}
