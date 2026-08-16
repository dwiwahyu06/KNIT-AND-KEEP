package com.knit_and_keep.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Penjaga terakhir sebelum toko benar-benar melayani uang sungguhan.
 *
 * <p>Nilai bawaan di {@code application.properties} sengaja dibiarkan supaya
 * aplikasi bisa langsung dijalankan di komputer sendiri tanpa menyiapkan apa
 * pun. Bahayanya, nilai yang sama bisa ikut terbawa ke server tanpa sadar —
 * dan server key Midtrans yang bocor bisa dipakai orang lain menarik dana.
 *
 * <p>Karena itu, begitu {@code MIDTRANS_PRODUCTION=true}, aplikasi menolak
 * menyala kalau masih ada rahasia yang belum diganti.
 */
@Component
public class PemeriksaKesiapanRilis {

    private static final String JWT_BAWAAN =
            "knit-and-keep-kunci-pengembangan-jangan-dipakai-di-server-2026";
    private static final String MIDTRANS_SERVER_BAWAAN = "ISI-MIDTRANS-SERVER-KEY";
    private static final String MIDTRANS_CLIENT_BAWAAN = "ISI-MIDTRANS-CLIENT-KEY";
    private static final String RAJAONGKIR_BAWAAN = "ISI-RAJAONGKIR-KEY";

    @Value("${midtrans.is-production}") private boolean produksi;
    @Value("${midtrans.server.key}")    private String midtransServer;
    @Value("${midtrans.client.key}")    private String midtransClient;
    @Value("${rajaongkir.api.key}")     private String rajaongkir;
    @Value("${app.jwt.secret}")         private String jwtSecret;
    @Value("${app.cors.allowed-origins}") private String corsOrigins;
    @Value("${spring.jpa.hibernate.ddl-auto}") private String ddlAuto;
    @Value("${spring.datasource.password}") private String passwordDatabase;

    @EventListener(ApplicationReadyEvent.class)
    public void periksa() {
        if (!produksi) {
            System.out.println(">> Mode pengembangan. Midtrans memakai sandbox, uangnya tidak nyata.");
            return;
        }

        List<String> masalah = new ArrayList<>();

        if (JWT_BAWAAN.equals(jwtSecret)) {
            masalah.add("JWT_SECRET masih memakai kunci pengembangan. "
                    + "Isi dengan teks acak minimal 32 karakter.");
        }
        if (MIDTRANS_SERVER_BAWAAN.equals(midtransServer) || MIDTRANS_CLIENT_BAWAAN.equals(midtransClient)) {
            masalah.add("Kunci Midtrans masih kunci sandbox. "
                    + "Isi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY dengan kunci produksi.");
        }
        if (RAJAONGKIR_BAWAAN.equals(rajaongkir)) {
            masalah.add("RAJAONGKIR_KEY masih kunci bawaan yang ikut tersimpan di kode. "
                    + "Terbitkan kunci baru lalu isikan lewat variabel lingkungan.");
        }
        if ("12345".equals(passwordDatabase)) {
            masalah.add("DB_PASSWORD masih '12345'. Ganti dengan kata sandi yang kuat.");
        }
        if (corsOrigins.contains("localhost")) {
            masalah.add("CORS_ORIGINS masih menunjuk localhost. Isi dengan domain toko yang sebenarnya.");
        }
        if ("update".equalsIgnoreCase(ddlAuto) || "create".equalsIgnoreCase(ddlAuto)
                || "create-drop".equalsIgnoreCase(ddlAuto)) {
            masalah.add("DDL_AUTO='" + ddlAuto + "' membiarkan skema database diubah sendiri. "
                    + "Pakai 'validate' di server.");
        }

        if (masalah.isEmpty()) {
            System.out.println(">> Pemeriksaan kesiapan rilis lolos. Midtrans dalam mode PRODUKSI.");
            return;
        }

        StringBuilder pesan = new StringBuilder(
                "\n\n=================== APLIKASI DIHENTIKAN ===================\n"
                        + "Mode produksi menyala, tetapi masih ada pengaturan yang belum diganti:\n\n");
        for (int i = 0; i < masalah.size(); i++) {
            pesan.append("  ").append(i + 1).append(". ").append(masalah.get(i)).append("\n");
        }
        pesan.append("\nPerbaiki variabel lingkungannya lalu jalankan ulang.\n")
             .append("===========================================================\n");

        throw new IllegalStateException(pesan.toString());
    }
}
