package com.knit_and_keep.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Penerbit dan pemeriksa token masuk.
 *
 * Token berisi id, nama, dan peran pengguna, lalu ditandatangani dengan kunci
 * rahasia server. Isinya tidak bisa diubah dari sisi peramban tanpa merusak
 * tanda tangannya — itulah sebabnya peran tidak lagi cukup disimpan di
 * localStorage seperti sebelumnya.
 */
@Service
public class TokenService {

    @Value("${app.jwt.secret}")
    private String rahasia;

    @Value("${app.jwt.masa-berlaku-jam}")
    private long masaBerlakuJam;

    private SecretKey kunci;

    @PostConstruct
    void siapkan() {
        byte[] bahan = rahasia.getBytes(StandardCharsets.UTF_8);
        if (bahan.length < 32) {
            throw new IllegalStateException(
                    "app.jwt.secret terlalu pendek. Isi minimal 32 karakter agar tanda tangannya aman.");
        }
        this.kunci = Keys.hmacShaKeyFor(bahan);
    }

    public String terbitkan(Long id, String username, String peran) {
        Date sekarang = new Date();
        Date habis = new Date(sekarang.getTime() + masaBerlakuJam * 3_600_000L);

        return Jwts.builder()
                .setSubject(String.valueOf(id))
                .claim("nama", username)
                .claim("peran", peran)
                .setIssuedAt(sekarang)
                .setExpiration(habis)
                .signWith(kunci, SignatureAlgorithm.HS256)
                .compact();
    }

    /** Mengembalikan pengguna bila tokennya sah, atau null bila tidak. */
    public Sesi.Pengguna baca(String token) {
        try {
            Claims isi = Jwts.parserBuilder()
                    .setSigningKey(kunci)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return new Sesi.Pengguna(
                    Long.valueOf(isi.getSubject()),
                    isi.get("nama", String.class),
                    isi.get("peran", String.class));
        } catch (Exception e) {
            // Token kedaluwarsa, dipalsukan, atau bentuknya salah — semuanya
            // sama saja artinya: permintaan ini tidak punya identitas.
            return null;
        }
    }

    public long masaBerlakuJam() {
        return masaBerlakuJam;
    }
}
