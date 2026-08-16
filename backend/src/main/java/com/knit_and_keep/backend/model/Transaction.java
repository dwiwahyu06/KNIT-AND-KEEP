package com.knit_and_keep.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Satu pesanan, baik dari web maupun dari kasir toko.
 *
 * Transaksi offline memakai struktur yang sama persis: bedanya hanya
 * {@code channel = "OFFLINE"}, pelanggan boleh kosong dan diganti
 * {@code namaPelangganOffline}, serta tidak melewati Midtrans, alamat, dan ongkir.
 * Karena strukturnya sama, stok dan laporan keuangan otomatis ikut sinkron.
 */
@Data
// Kesamaan dibandingkan lewat id saja. Bawaan Lombok ikut membandingkan
// relasi, dan itu membuat Hibernate memuat koleksi lain di tengah pemuatan
// koleksi ini - berujung ConcurrentModificationException saat checkout.
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Kosong untuk penjualan offline. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pelanggan_id")
    @JsonIgnore
    private UserPelanggan pelanggan;

    @Column(unique = true, nullable = false)
    private String orderId;

    /** Total yang dibayar pelanggan = subtotal + ongkir. */
    private Long amount = 0L;

    private Double subtotal = 0.0;

    private Double ongkir = 0.0;

    /** Lihat OrderFlow untuk daftar status yang berlaku. */
    private String status = OrderFlow.MENUNGGU_PEMBAYARAN;

    /** ONLINE atau OFFLINE. */
    @Column(nullable = false)
    private String channel = "ONLINE";

    /** Diisi hanya untuk penjualan offline, misalnya "Offline" atau "Offline - Bu Sari". */
    private String namaPelangganOffline;

    @Column(nullable = false)
    private String type = "PENJUALAN";

    private String description;

    private String nomorResi;

    /** Kode kurir seperti jne, jnt, sicepat. */
    private String kurir;

    /** Kode layanan kurir seperti REG, YES, atau BEST. */
    private String layananKurir;

    /** Estimasi lama pengiriman menurut kurir saat checkout. */
    private String estimasiKirim;

    /** Berat total paket dalam gram, dipakai saat menghitung ongkir. */
    private Integer beratGram;

    /** TUNAI, TRANSFER, QRIS, atau MIDTRANS. */
    private String metodeBayar;

    /** Cara pembayaran yang benar-benar dipakai pelanggan di Midtrans. */
    private String metodeMidtrans;

    /** Batas waktu pembayaran menurut Midtrans. */
    private LocalDateTime kedaluwarsaPada;

    private String namaPenerima;

    /** Nomor telepon penerima; lima digit terakhirnya diminta kurir saat melacak resi. */
    private String teleponPenerima;

    @Column(length = 1024)
    private String alamatPengiriman;

    @Column(length = 512)
    private String catatan;

    private LocalDateTime dibayarPada;
    private LocalDateTime dikirimPada;
    private LocalDateTime selesaiPada;

    /**
     * Menandai stok untuk pesanan ini sudah diambil dari gudang.
     *
     * Stok dipotong sejak pesanan dibuat — barang langsung dipesankan untuk
     * pembeli itu — dan dikembalikan bila pesanannya batal atau kedaluwarsa.
     * Penanda ini mencegah stok terpotong atau terkembalikan dua kali.
     */
    private Boolean stokDipotong = false;

    // BatchSize membuat rincian seluruh pesanan diambil beberapa puluh sekaligus,
    // bukan satu kueri per pesanan. Tanpa ini, satu halaman daftar pesanan bisa
    // memicu ratusan kueri terpisah.
    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @org.hibernate.annotations.BatchSize(size = 50)
    private List<TransactionItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @org.hibernate.annotations.BatchSize(size = 50)
    @OrderBy("waktu ASC")
    private List<StatusHistory> riwayat = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ---------- turunan untuk frontend ----------

    @JsonProperty("pelangganId")
    public Long getPelangganId() {
        return pelanggan != null ? pelanggan.getId() : null;
    }

    @JsonProperty("namaPelanggan")
    public String getNamaPelanggan() {
        if (pelanggan != null) return pelanggan.getUsername();
        if (namaPelangganOffline != null && !namaPelangganOffline.isBlank()) return namaPelangganOffline;
        return "Offline";
    }

    @JsonProperty("statusLabel")
    public String getStatusLabel() {
        return OrderFlow.label(status);
    }

    @JsonProperty("totalModal")
    public Double getTotalModal() {
        if (items == null) return 0.0;
        return items.stream().mapToDouble(TransactionItem::getTotalModal).sum();
    }

    @JsonProperty("totalQty")
    public Integer getTotalQty() {
        if (items == null) return 0;
        return items.stream().mapToInt(i -> i.getQuantity() == null ? 0 : i.getQuantity()).sum();
    }

    /**
     * Nilai barangnya saja, tanpa ongkos kirim — inilah omzet toko.
     *
     * <p>Ongkir yang dibayar pembeli cuma numpang lewat: uangnya diteruskan ke
     * kurir, bukan pendapatan toko. Kalau ikut dihitung sebagai omzet padahal
     * pembayaran ke kurir tidak pernah dicatat sebagai biaya, laba tampak
     * lebih besar daripada kenyataannya, dan selisihnya menumpuk tiap pesanan.
     *
     * <p>Arus kas tetap memakai {@code amount}, karena di sana yang dilacak
     * adalah uang yang benar-benar berpindah, bukan pendapatan.
     */
    @JsonProperty("nilaiBarang")
    public Double getNilaiBarang() {
        if (subtotal != null) return subtotal;

        // Pesanan lama dari versi yang belum menyimpan subtotal terpisah.
        double dibayar = amount == null ? 0 : amount;
        double kirim = ongkir == null ? 0 : ongkir;
        return dibayar - kirim;
    }

    // ---------- pembantu ----------

    public void tambahItem(TransactionItem item) {
        item.setTransaction(this);
        this.items.add(item);
    }

    public void catatRiwayat(String status, String catatan, String oleh) {
        StatusHistory h = new StatusHistory();
        h.setTransaction(this);
        h.setStatus(status);
        h.setCatatan(catatan);
        h.setDiubahOleh(oleh);
        h.setWaktu(LocalDateTime.now());
        this.riwayat.add(h);
    }

    public void hitungUlangTotal() {
        double sub = items == null ? 0
                : items.stream().mapToDouble(TransactionItem::getSubtotal).sum();
        this.subtotal = sub;
        double kirim = ongkir == null ? 0 : ongkir;
        this.amount = Math.round(sub + kirim);
    }
}
