package com.knit_and_keep.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
// Kesamaan dibandingkan lewat id saja. Bawaan Lombok ikut membandingkan
// relasi, dan itu membuat Hibernate memuat koleksi lain di tengah pemuatan
// koleksi ini - berujung ConcurrentModificationException saat checkout.
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "cash_flows")
public class CashFlow {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** IN untuk kas masuk, OUT untuk kas keluar. */
    private String type;

    private Double amount;

    private String description;

    /** PENJUALAN, PENGELUARAN, REFUND, GANTI_RUGI, atau MANUAL. */
    private String category = "MANUAL";

    /** Nomor pesanan atau id acuan lain, supaya bisa ditelusuri balik. */
    private String referensi;

    /** ONLINE, OFFLINE, atau null untuk catatan manual. */
    private String channel;

    private LocalDateTime date = LocalDateTime.now();
}
