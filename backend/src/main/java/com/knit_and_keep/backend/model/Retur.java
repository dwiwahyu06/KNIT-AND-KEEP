package com.knit_and_keep.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Pengajuan komplain / retur atas sebuah transaksi.
 *
 * Dibuat oleh pelanggan (atau oleh admin untuk kasus yang dilaporkan lewat
 * telepon), lalu ditinjau admin. Keputusan admin menentukan dampaknya ke stok
 * dan ke pembukuan.
 */
@Data
// Kesamaan dibandingkan lewat id saja. Bawaan Lombok ikut membandingkan
// relasi, dan itu membuat Hibernate memuat koleksi lain di tengah pemuatan
// koleksi ini - berujung ConcurrentModificationException saat checkout.
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "retur")
public class Retur {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transaction_id")
    @JsonIgnore
    private Transaction transaction;

    /** Salah satu dari OrderFlow.JENIS_KENDALA. */
    private String jenisKendala;

    @Column(length = 1024)
    private String alasan;

    /** Foto bukti dalam bentuk data URI atau tautan. */
    @Column(length = 2048)
    private String fotoBukti;

    /** DIAJUKAN, DISETUJUI, DITOLAK. */
    private String status = "DIAJUKAN";

    /** Nominal yang dikembalikan ke pelanggan (refund atau ganti rugi). */
    private Double nominalRefund = 0.0;

    /** REFUND atau GANTI_RUGI — dipilih admin saat menyetujui. */
    private String bentukPenyelesaian;

    @Column(length = 1024)
    private String catatanAdmin;

    /** Apakah barangnya benar-benar dikirim balik ke toko. */
    private Boolean barangKembali = false;

    /** Kalau barang kembali: masih layak dijual lagi atau tidak. */
    private Boolean layakJual = false;

    private String diajukanOleh;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @JsonProperty("transactionId")
    public Long getTransactionId() {
        return transaction != null ? transaction.getId() : null;
    }

    @JsonProperty("orderId")
    public String getOrderId() {
        return transaction != null ? transaction.getOrderId() : null;
    }

    @JsonProperty("namaPelanggan")
    public String getNamaPelanggan() {
        return transaction != null ? transaction.getNamaPelanggan() : null;
    }

    @JsonProperty("nominalTransaksi")
    public Long getNominalTransaksi() {
        return transaction != null ? transaction.getAmount() : null;
    }

    @JsonProperty("statusPesanan")
    public String getStatusPesanan() {
        return transaction != null ? transaction.getStatus() : null;
    }
}
