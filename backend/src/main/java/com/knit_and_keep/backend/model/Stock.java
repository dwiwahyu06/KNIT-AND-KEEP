package com.knit_and_keep.backend.model;


import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Stock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;       // Nama barang
    private Integer quantity;  // Jumlah stok
    private Double purchasePrice; // Harga beli terakhir
    private Double averagePrice;  // Harga rata-rata (HPP)
}
