package com.knit_and_keep.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Rincian barang di dalam satu transaksi.
 *
 * Harga jual dan harga modal disalin saat transaksi dibuat (snapshot), bukan
 * dibaca ulang dari produk. Kalau harga produk diubah bulan depan, laporan
 * bulan ini tetap memakai angka yang benar-benar berlaku saat itu.
 */
@Data
// Kesamaan dibandingkan lewat id saja. Bawaan Lombok ikut membandingkan
// relasi, dan itu membuat Hibernate memuat koleksi lain di tengah pemuatan
// koleksi ini - berujung ConcurrentModificationException saat checkout.
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "transaction_items")
public class TransactionItem {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id")
    @JsonIgnore
    private Transaction transaction;

    private Long productId;

    private String namaProduk;

    private String sku;

    @Column(length = 1024)
    private String gambar;

    private Integer quantity = 0;

    /** Harga jual per unit saat transaksi dibuat. */
    private Double hargaJual = 0.0;

    /** Harga modal (HPP) per unit saat transaksi dibuat. */
    private Double hargaModal = 0.0;

    /** Jumlah unit yang sudah diretur dari baris ini. */
    private Integer qtyRetur = 0;

    public Double getSubtotal() {
        double harga = hargaJual == null ? 0 : hargaJual;
        int qty = quantity == null ? 0 : quantity;
        return harga * qty;
    }

    public Double getTotalModal() {
        double modal = hargaModal == null ? 0 : hargaModal;
        int qty = quantity == null ? 0 : quantity;
        return modal * qty;
    }
}
