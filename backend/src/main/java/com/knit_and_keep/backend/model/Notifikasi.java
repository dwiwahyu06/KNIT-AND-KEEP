package com.knit_and_keep.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * Kabar untuk pelanggan.
 *
 * Dibuat otomatis setiap status pesanannya berubah atau komplainnya diputuskan,
 * sehingga pelanggan tidak perlu membuka aplikasi berulang kali hanya untuk
 * mengecek apakah ada perkembangan.
 */
@Data
// Kesamaan dibandingkan lewat id saja. Bawaan Lombok ikut membandingkan
// relasi, dan itu membuat Hibernate memuat koleksi lain di tengah pemuatan
// koleksi ini - berujung ConcurrentModificationException saat checkout.
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "notifikasi", indexes = {
        @Index(name = "idx_notifikasi_pelanggan", columnList = "pelangganId,dibaca")
})
public class Notifikasi {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long pelangganId;

    private String judul;

    @Column(length = 512)
    private String pesan;

    /** PESANAN, RETUR, atau PEMBAYARAN — dipakai memilih warna dan ikon. */
    private String jenis;

    /** Nomor pesanan, agar bisa ditautkan ke halamannya. */
    private String referensi;

    private Long transactionId;

    private Boolean dibaca = false;

    private LocalDateTime waktu = LocalDateTime.now();
}
