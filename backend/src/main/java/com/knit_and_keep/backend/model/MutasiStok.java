package com.knit_and_keep.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * Satu baris kartu stok.
 *
 * Setiap perubahan jumlah barang meninggalkan jejak di sini, lengkap dengan
 * stok sebelum dan sesudahnya. Tanpa catatan ini, selisih antara stok fisik
 * dan stok sistem tidak bisa ditelusuri penyebabnya.
 */
@Data
// Kesamaan dibandingkan lewat id saja. Bawaan Lombok ikut membandingkan
// relasi, dan itu membuat Hibernate memuat koleksi lain di tengah pemuatan
// koleksi ini - berujung ConcurrentModificationException saat checkout.
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "mutasi_stok", indexes = {
        @Index(name = "idx_mutasi_produk", columnList = "productId"),
        @Index(name = "idx_mutasi_waktu", columnList = "waktu")
})
public class MutasiStok {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;
    private String namaProduk;
    private String sku;

    /** Lihat konstanta di bawah. */
    private String jenis;

    /** Positif berarti stok bertambah, negatif berarti berkurang. */
    private Integer perubahan;

    private Integer stokSebelum;
    private Integer stokSesudah;

    /** Nomor pesanan, id pengajuan retur, atau acuan lain agar bisa ditelusuri. */
    private String referensi;

    @Column(length = 512)
    private String catatan;

    /** ADMIN, PELANGGAN, atau SISTEM. */
    private String oleh;

    private LocalDateTime waktu = LocalDateTime.now();

    // --- jenis mutasi ---
    public static final String PEMBELIAN   = "PEMBELIAN";    // barang masuk dari pemasok
    public static final String PENJUALAN   = "PENJUALAN";    // keluar karena pesanan
    public static final String PEMBATALAN  = "PEMBATALAN";   // kembali karena pesanan batal
    public static final String RETUR       = "RETUR";        // kembali karena retur disetujui
    public static final String PENYESUAIAN = "PENYESUAIAN";  // koreksi manual, barang rusak atau hilang
}
