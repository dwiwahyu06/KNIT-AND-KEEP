package com.knit_and_keep.backend.config;

import okhttp3.OkHttpClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.net.ssl.*;
import java.security.KeyStore;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Klien HTTP untuk memanggil layanan luar: Midtrans dan RajaOngkir.
 *
 * <p>Masalah yang diselesaikan di sini: pada jaringan yang memakai proxy
 * pemeriksa TLS, sertifikat penerbitnya dipasang di penyimpanan sertifikat
 * Windows tetapi tidak ada di daftar bawaan JDK. Akibatnya Java menolak
 * sambungan dengan galat "PKIX path building failed", padahal peramban dan
 * PowerShell di mesin yang sama bisa terhubung.
 *
 * <p>Penyelesaiannya menggabungkan dua daftar penerbit tepercaya: bawaan JDK
 * dan milik sistem operasi. Sambungan diterima bila salah satu memercayainya.
 * Pemeriksaan sertifikat tetap berjalan penuh — tidak ada verifikasi yang
 * dimatikan.
 */
@Configuration
public class HttpClientConfig {

    @Bean
    public OkHttpClient okHttpClient() {
        OkHttpClient.Builder builder = new OkHttpClient.Builder()
                .connectTimeout(Duration.ofSeconds(20))
                .readTimeout(Duration.ofSeconds(45))
                .writeTimeout(Duration.ofSeconds(30))
                .retryOnConnectionFailure(true);

        try {
            List<X509TrustManager> daftar = new ArrayList<>();

            X509TrustManager bawaan = trustManagerDari(null);
            if (bawaan != null) daftar.add(bawaan);

            X509TrustManager sistem = trustManagerSistem();
            if (sistem != null) daftar.add(sistem);

            if (daftar.size() > 1) {
                X509TrustManager gabungan = new TrustManagerGabungan(daftar);
                SSLContext konteks = SSLContext.getInstance("TLS");
                konteks.init(null, new TrustManager[]{gabungan}, null);
                builder.sslSocketFactory(konteks.getSocketFactory(), gabungan);
                System.out.println(">> Sertifikat sistem operasi ikut dipercaya untuk panggilan API luar");
            }
        } catch (Exception e) {
            // Kalau gagal disiapkan, biarkan OkHttp memakai bawaan JDK.
            System.err.println("Tidak bisa menggabungkan daftar sertifikat: " + e.getMessage());
        }

        return builder.build();
    }

    /** Daftar penerbit tepercaya milik sistem operasi, bila tersedia. */
    private X509TrustManager trustManagerSistem() {
        String os = System.getProperty("os.name", "").toLowerCase();
        String tipe = os.contains("win") ? "Windows-ROOT" : os.contains("mac") ? "KeychainStore" : null;
        if (tipe == null) return null;

        try {
            KeyStore ks = KeyStore.getInstance(tipe);
            ks.load(null, null);
            return trustManagerDari(ks);
        } catch (Exception e) {
            return null;
        }
    }

    private X509TrustManager trustManagerDari(KeyStore ks) throws Exception {
        TrustManagerFactory pabrik =
                TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
        pabrik.init(ks);
        for (TrustManager tm : pabrik.getTrustManagers()) {
            if (tm instanceof X509TrustManager x509) return x509;
        }
        return null;
    }

    /** Menerima sertifikat bila salah satu daftar penerbit memercayainya. */
    private static class TrustManagerGabungan implements X509TrustManager {

        private final List<X509TrustManager> anggota;

        TrustManagerGabungan(List<X509TrustManager> anggota) {
            this.anggota = anggota;
        }

        @Override
        public void checkServerTrusted(X509Certificate[] rantai, String tipe) throws CertificateException {
            CertificateException terakhir = null;
            for (X509TrustManager tm : anggota) {
                try {
                    tm.checkServerTrusted(rantai, tipe);
                    return;
                } catch (CertificateException e) {
                    terakhir = e;
                }
            }
            throw terakhir != null ? terakhir : new CertificateException("Sertifikat server tidak dipercaya");
        }

        @Override
        public void checkClientTrusted(X509Certificate[] rantai, String tipe) throws CertificateException {
            CertificateException terakhir = null;
            for (X509TrustManager tm : anggota) {
                try {
                    tm.checkClientTrusted(rantai, tipe);
                    return;
                } catch (CertificateException e) {
                    terakhir = e;
                }
            }
            throw terakhir != null ? terakhir : new CertificateException("Sertifikat klien tidak dipercaya");
        }

        @Override
        public X509Certificate[] getAcceptedIssuers() {
            List<X509Certificate> semua = new ArrayList<>();
            for (X509TrustManager tm : anggota) {
                X509Certificate[] penerbit = tm.getAcceptedIssuers();
                if (penerbit != null) semua.addAll(List.of(penerbit));
            }
            return semua.toArray(new X509Certificate[0]);
        }
    }
}
