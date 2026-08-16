package com.knit_and_keep.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.Set;

@Data
// Kesamaan dibandingkan lewat id saja. Bawaan Lombok ikut membandingkan
// relasi, dan itu membuat Hibernate memuat koleksi lain di tengah pemuatan
// koleksi ini - berujung ConcurrentModificationException saat checkout.
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "user_pelanggan")
public class UserPelanggan {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username; 

    @Column(nullable = false, unique = true)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String password;

    /**
     * Akun yang dinonaktifkan tidak bisa masuk lagi.
     * Dipakai admin untuk menghentikan akun bermasalah tanpa menghapus
     * riwayat belanjanya, yang masih dibutuhkan pembukuan.
     */
    private Boolean aktif = true;

    @JsonIgnore
    @OneToMany(mappedBy = "pelanggan", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Address> addresses;

    @JsonIgnore
    @OneToMany(mappedBy = "pelanggan", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Transaction> transactions;
}