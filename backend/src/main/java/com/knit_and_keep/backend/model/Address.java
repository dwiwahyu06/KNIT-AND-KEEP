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
@Table(name = "addresses")
public class Address {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    private UserPelanggan pelanggan;

    /** Nama penerima paket, belum tentu sama dengan pemilik akun. */
    private String namaPenerima;

    /** Nomor telepon penerima. Lima digit terakhirnya dipakai kurir saat melacak resi. */
    private String teleponPenerima;

    private String provinsi;
    private String kabupaten;
    private String kecamatan;
    private String kelurahan;
    private String kodePos;

    @Column(length = 512)
    private String detailAlamat;

    private String rt;
    private String rw;
    private Double latitude;
    private Double longitude;

    /**
     * ID kelurahan dari RajaOngkir. Tanpa ini ongkos kirim tidak bisa dihitung,
     * karena kurir memerlukan titik tujuan yang mereka kenali — bukan teks bebas.
     */
    @Column(name = "destination_id")
    private String destinationId;

    /** Label lengkap dari RajaOngkir, disimpan apa adanya untuk ditampilkan ulang. */
    @Column(length = 512)
    private String labelTujuan;

    private Boolean utama = false;

    public String ringkas() {
        StringBuilder sb = new StringBuilder();
        if (detailAlamat != null && !detailAlamat.isBlank()) sb.append(detailAlamat);
        if (rt != null && !rt.isBlank()) sb.append(", RT ").append(rt);
        if (rw != null && !rw.isBlank()) sb.append("/RW ").append(rw);
        if (kelurahan != null && !kelurahan.isBlank()) sb.append(", ").append(kelurahan);
        if (kecamatan != null && !kecamatan.isBlank()) sb.append(", ").append(kecamatan);
        if (kabupaten != null && !kabupaten.isBlank()) sb.append(", ").append(kabupaten);
        if (provinsi != null && !provinsi.isBlank()) sb.append(", ").append(provinsi);
        if (kodePos != null && !kodePos.isBlank()) sb.append(" ").append(kodePos);
        return sb.toString();
    }
}
