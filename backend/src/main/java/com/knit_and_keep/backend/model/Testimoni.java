package com.knit_and_keep.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * Penilaian pelanggan atas satu pesanan yang sudah selesai.
 *
 * Testimoni menempel ke pesanan, bukan ke produk. Barang thrifting biasanya
 * hanya ada satu: begitu terjual, produknya hilang dari katalog dan ulasan
 * yang menempel padanya ikut kehilangan tempat tampil. Yang dinilai pembeli
 * sebenarnya juga bukan cuma barangnya, melainkan seluruh pengalaman belanja
 * — kondisi barang, kecepatan kirim, dan pelayanan toko.
 *
 * <p>Ulasan untuk sebuah produk tetap bisa ditarik: dicari lewat pesanan yang
 * memuat produk itu. Lihat {@code TestimoniRepository.untukProduk}.
 *
 * <p>Ini pasangan dari {@link Retur}. Retur menangani pengalaman yang buruk,
 * testimoni merekam yang baik — keduanya berangkat dari pesanan yang sama.
 */
@Data
// Kesamaan dibandingkan lewat id saja. Bawaan Lombok ikut membandingkan
// relasi, dan itu membuat Hibernate memuat koleksi lain di tengah pemuatan
// koleksi ini - berujung ConcurrentModificationException saat checkout.
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "testimoni")
public class Testimoni {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Satu pesanan hanya boleh punya satu testimoni. */
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transaction_id", unique = true)
    @JsonIgnore
    private Transaction transaction;

    /** Bintang 1 sampai 5. */
    @Column(nullable = false)
    private Integer rating = 5;

    @Column(length = 1024)
    private String ulasan;

    /**
     * Admin bisa menurunkan testimoni yang tidak pantas tanpa menghapusnya.
     * Menghapus akan menghilangkan jejak penilaian dari pelanggan yang
     * sebenarnya sah mengirimnya.
     */
    @Column(nullable = false)
    private Boolean ditampilkan = true;

    /** Jawaban toko, ikut tampil di bawah testimoninya. */
    @Column(length = 1024)
    private String balasanAdmin;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // ---------- turunan untuk frontend ----------

    @JsonProperty("transactionId")
    public Long getTransactionId() {
        return transaction != null ? transaction.getId() : null;
    }

    @JsonProperty("orderId")
    public String getOrderId() {
        return transaction != null ? transaction.getOrderId() : null;
    }

    @JsonProperty("pelangganId")
    public Long getPelangganId() {
        return transaction != null ? transaction.getPelangganId() : null;
    }

    /**
     * Nama penulis dalam bentuk tersamar, misalnya "dw•••".
     *
     * Testimoni tampil di halaman depan yang bisa dibuka siapa saja, dan nama
     * itu juga nama untuk masuk. Menampilkannya utuh berarti membocorkan
     * separuh pasangan kunci akun setiap kali pelanggan memuji toko.
     */
    @JsonProperty("namaPelanggan")
    public String getNamaPelangganTersamar() {
        String nama = transaction == null ? null : transaction.getNamaPelanggan();
        if (nama == null || nama.isBlank()) return "Pelanggan";
        String bersih = nama.trim();
        int tampak = Math.min(2, bersih.length());
        return bersih.substring(0, tampak) + "•••";
    }

    /** Barang yang dinilai, dipakai sebagai keterangan di bawah testimoni. */
    @JsonProperty("barang")
    public List<String> getBarang() {
        if (transaction == null || transaction.getItems() == null) return List.of();
        return transaction.getItems().stream()
                .map(TransactionItem::getNamaProduk)
                .filter(Objects::nonNull)
                .toList();
    }

    /** Foto barang pertama, untuk menghidupkan kartu testimoni. */
    @JsonProperty("gambar")
    public String getGambar() {
        if (transaction == null || transaction.getItems() == null) return null;
        return transaction.getItems().stream()
                .map(TransactionItem::getGambar)
                .filter(g -> g != null && !g.isBlank())
                .findFirst()
                .orElse(null);
    }
}
