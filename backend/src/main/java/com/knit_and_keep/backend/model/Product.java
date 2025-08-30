package com.knit_and_keep.backend.model; // Sesuaikan dengan package Anda

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sku;
    private String name;
    private String category;
    
    @Column(name = "product_size")
    private String size;
    
    private String color;

    // ✅ UBAH DARI TIPE PRIMITIF KE WRAPPER CLASS
    private Double costPrice; // sebelumnya double
    private Double sellPrice; // sebelumnya double
    private Integer stock;    // sebelumnya int
    
    private String supplier;
    
    @Column(length = 1024)
    private String image;

    private Integer weight; 
}