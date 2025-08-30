package com.knit_and_keep.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Set;

@Data
@Entity
@Table(name = "user_pelanggan")
public class UserPelanggan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username; 

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @OneToMany(mappedBy = "pelanggan", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Address> addresses;
    
    // ✅ Tambahkan relasi ini untuk melihat semua transaksi milik pengguna
    @OneToMany(mappedBy = "pelanggan", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Transaction> transactions;
}