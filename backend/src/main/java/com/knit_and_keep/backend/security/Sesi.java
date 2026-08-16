package com.knit_and_keep.backend.security;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Identitas pemilik permintaan yang sedang diproses.
 *
 * Diisi oleh {@link PenjagaAkses} di awal setiap permintaan dan dibersihkan
 * setelah selesai, sehingga controller bisa memeriksa kepemilikan data tanpa
 * harus menerima objek permintaan ke mana-mana.
 */
public final class Sesi {

    /** Peran yang dikenal sistem. */
    public static final String ADMIN = "ADMIN";
    public static final String PELANGGAN = "PELANGGAN";

    public record Pengguna(Long id, String username, String peran) {
        public boolean admin() {
            return ADMIN.equalsIgnoreCase(peran);
        }
    }

    private static final ThreadLocal<Pengguna> SEKARANG = new ThreadLocal<>();

    private Sesi() {}

    static void pasang(Pengguna pengguna) {
        SEKARANG.set(pengguna);
    }

    static void bersihkan() {
        SEKARANG.remove();
    }

    /** Pengguna saat ini, atau null bila permintaannya tanpa identitas. */
    public static Pengguna pengguna() {
        return SEKARANG.get();
    }

    public static Pengguna wajibMasuk() {
        Pengguna p = SEKARANG.get();
        if (p == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Silakan masuk terlebih dahulu.");
        }
        return p;
    }

    public static boolean adalahAdmin() {
        Pengguna p = SEKARANG.get();
        return p != null && p.admin();
    }

    /**
     * Memastikan data yang diminta memang milik pengguna ini.
     * Admin dibebaskan, karena memang bertugas melihat data seluruh pelanggan.
     */
    public static void wajibPemilik(Long pelangganId) {
        Pengguna p = wajibMasuk();
        if (p.admin()) return;
        if (pelangganId == null || !pelangganId.equals(p.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Data ini bukan milik akun Anda.");
        }
    }

    public static void wajibAdmin() {
        if (!adalahAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Halaman ini hanya untuk pengelola toko.");
        }
    }
}
