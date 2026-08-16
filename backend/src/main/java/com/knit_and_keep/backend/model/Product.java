package com.knit_and_keep.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
// Kesamaan dibandingkan lewat id saja. Bawaan Lombok ikut membandingkan
// relasi, dan itu membuat Hibernate memuat koleksi lain di tengah pemuatan
// koleksi ini - berujung ConcurrentModificationException saat checkout.
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "products")
public class Product {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sku;
    private String name;
    private String category;

    @Column(name = "product_size")
    private String size;

    private String color;

    private Double costPrice;
    private Double sellPrice;
    private Integer stock;

    private String supplier;

    @Column(length = 1024)
    private String image;

    /** Berat dalam gram, dipakai menghitung ongkos kirim. */
    private Integer weight;

    /**
     * Keterangan barang. Penting untuk barang bekas, karena pembeli tidak bisa
     * memegang barangnya sebelum membeli.
     */
    @Column(length = 2048)
    private String deskripsi;

    /** Misalnya "Seperti baru", "Bagus", atau "Ada cacat kecil". */
    private String kondisi;
}
