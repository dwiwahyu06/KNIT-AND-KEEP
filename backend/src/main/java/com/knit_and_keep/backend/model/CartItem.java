package com.knit_and_keep.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
// Kesamaan dibandingkan lewat id saja. Bawaan Lombok ikut membandingkan
// relasi, dan itu membuat Hibernate memuat koleksi lain di tengah pemuatan
// koleksi ini - berujung ConcurrentModificationException saat checkout.
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "cart_items")
public class CartItem {

    @Id
    @EqualsAndHashCode.Include
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