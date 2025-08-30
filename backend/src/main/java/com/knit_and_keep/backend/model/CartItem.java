package com.knit_and_keep.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "cart_items")
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER) // Eager fetch untuk langsung dapat data produk
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pelanggan_id", nullable = false)
    @JsonIgnore // Mencegah data pelanggan ikut terkirim ke frontend
    private UserPelanggan pelanggan;

    @Column(nullable = false)
    private int quantity;
}