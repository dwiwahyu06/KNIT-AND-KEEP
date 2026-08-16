package com.knit_and_keep.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.util.TimeZone;

/**
 * Menetapkan zona waktu aplikasi.
 *
 * <p>Seluruh laporan memakai tanggal server: omzet hari ini, rekap bulanan,
 * dan penyaringan periode. Server sewaan hampir selalu berjalan di UTC, yang
 * tujuh jam di belakang waktu Indonesia — akibatnya "hari ini" berganti pada
 * pukul tujuh pagi, dan penjualan sore hari bisa masuk ke tanggal kemarin.
 *
 * <p>Kesalahan seperti ini sulit disadari karena angkanya tetap terlihat wajar.
 */
@Configuration
public class KonfigurasiZonaWaktu {

    @Value("${app.zona-waktu}")
    private String zona;

    @PostConstruct
    void terapkan() {
        TimeZone.setDefault(TimeZone.getTimeZone(zona));
        System.out.println(">> Zona waktu aplikasi: " + zona
                + " (sekarang " + java.time.LocalDateTime.now() + ")");
    }
}
