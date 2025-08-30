package com.knit_and_keep.backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "profile_pelanggan")
public class ProfilePelanggan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String alamat;
    private String nomorHp;
    private LocalDate tanggalLahir;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", unique = true)
    private UserPelanggan user;

    // getter & setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAlamat() { return alamat; }
    public void setAlamat(String alamat) { this.alamat = alamat; }

    public String getNomorHp() { return nomorHp; }
    public void setNomorHp(String nomorHp) { this.nomorHp = nomorHp; }

    public LocalDate getTanggalLahir() { return tanggalLahir; }
    public void setTanggalLahir(LocalDate tanggalLahir) { this.tanggalLahir = tanggalLahir; }

    public UserPelanggan getUser() { return user; }
    public void setUser(UserPelanggan user) { this.user = user; }
}
