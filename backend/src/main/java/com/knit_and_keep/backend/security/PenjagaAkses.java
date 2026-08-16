package com.knit_and_keep.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Penjaga pintu masuk seluruh API.
 *
 * <p>Sebelum ini pemeriksaan peran hanya terjadi di peramban, sehingga siapa
 * pun yang tahu alamat backend bisa membuka data toko dan data pelanggan tanpa
 * pernah masuk. Sekarang setiap permintaan diperiksa di sini lebih dulu.
 *
 * <p>Aturannya dibaca berurutan dari atas ke bawah, dan yang pertama cocok
 * dipakai. Apa pun yang tidak disebut dianggap butuh akun pengelola — jadi
 * endpoint baru terlindungi secara bawaan, bukan sebaliknya.
 */
@Component
public class PenjagaAkses implements Filter {

    private enum Butuh { SIAPA_SAJA, SUDAH_MASUK, ADMIN }

    private record Aturan(String metode, String pola, Butuh butuh) {}

    private static final List<Aturan> ATURAN = List.of(
            // --- terbuka untuk umum ---
            new Aturan("POST", "/api/auth/login",                  Butuh.SIAPA_SAJA),
            new Aturan("GET",  "/api/auth/perlu-pengelola-pertama", Butuh.SIAPA_SAJA),
            // Dibiarkan terbuka hanya agar toko yang benar-benar masih kosong
            // bisa membuat pengelola pertamanya. Begitu sudah ada penghuninya,
            // AuthController menolak permintaan yang bukan dari admin.
            new Aturan("POST", "/api/auth/register",               Butuh.SIAPA_SAJA),
            new Aturan("POST", "/api/pelanggan/login",             Butuh.SIAPA_SAJA),
            new Aturan("POST", "/api/pelanggan/register",          Butuh.SIAPA_SAJA),
            new Aturan("GET",  "/api/products",                    Butuh.SIAPA_SAJA),
            new Aturan("GET",  "/api/products/kategori",           Butuh.SIAPA_SAJA),
            new Aturan("GET",  "/api/payments/config",             Butuh.SIAPA_SAJA),
            // Dipanggil server Midtrans, jadi tidak bisa membawa token.
            // Keasliannya dijaga oleh pemeriksaan tanda tangan di PaymentService.
            new Aturan("POST", "/api/payments/notification-handler", Butuh.SIAPA_SAJA),
            new Aturan("GET",  "/api/shipping/info",               Butuh.SIAPA_SAJA),
            new Aturan("GET",  "/api/shipping/cari-tujuan",        Butuh.SIAPA_SAJA),
            new Aturan("GET",  "/api/shipping/ongkir",             Butuh.SIAPA_SAJA),
            new Aturan("GET",  "/api/retur/jenis-kendala",         Butuh.SIAPA_SAJA),
            // Dipanggil layanan pemantauan dari luar, jadi tidak bisa membawa token.
            new Aturan("GET",  "/api/kesehatan",                   Butuh.SIAPA_SAJA),

            // --- khusus pengelola (ditulis sebelum pola umum di bawahnya) ---
            new Aturan("GET",  "/api/products/stok-menipis",       Butuh.ADMIN),
            new Aturan("GET",  "/api/products/mutasi",             Butuh.ADMIN),
            new Aturan("*",    "/api/orders/admin/**",             Butuh.ADMIN),
            new Aturan("*",    "/api/dashboard/**",                Butuh.ADMIN),
            new Aturan("*",    "/api/transactions/**",             Butuh.ADMIN),
            new Aturan("*",    "/api/reports/**",                  Butuh.ADMIN),
            new Aturan("*",    "/api/cashflow/**",                 Butuh.ADMIN),
            new Aturan("*",    "/api/expenses/**",                 Butuh.ADMIN),
            new Aturan("*",    "/api/auth/admins/**",              Butuh.ADMIN),
            new Aturan("GET",  "/api/auth/admins",                 Butuh.ADMIN),
            new Aturan("GET",  "/api/pelanggan/all",               Butuh.ADMIN),
            new Aturan("PUT",  "/api/pelanggan/*/status",          Butuh.ADMIN),
            new Aturan("GET",  "/api/shipping/lacak",              Butuh.ADMIN),
            new Aturan("PUT",  "/api/retur/**",                    Butuh.ADMIN),
            new Aturan("GET",  "/api/retur",                       Butuh.ADMIN),

            // Melihat katalog bebas, mengubahnya tidak.
            new Aturan("GET",  "/api/products/**",                 Butuh.SIAPA_SAJA),
            new Aturan("*",    "/api/products/**",                 Butuh.ADMIN),

            // --- perlu masuk, kepemilikan diperiksa di controller ---
            new Aturan("*",    "/api/cart/**",                     Butuh.SUDAH_MASUK),
            new Aturan("*",    "/api/orders/**",                   Butuh.SUDAH_MASUK),
            new Aturan("*",    "/api/retur/**",                    Butuh.SUDAH_MASUK),
            new Aturan("*",    "/api/addresses/**",                Butuh.SUDAH_MASUK),
            new Aturan("*",    "/api/pelanggan/**",                Butuh.SUDAH_MASUK),
            new Aturan("*",    "/api/payments/**",                 Butuh.SUDAH_MASUK),
            new Aturan("*",    "/api/notifikasi/**",               Butuh.SUDAH_MASUK),
            new Aturan("GET",  "/api/shipping/lacak-pesanan/**",   Butuh.SUDAH_MASUK)
    );

    private final TokenService tokenService;
    private final AntPathMatcher pencocok = new AntPathMatcher();
    private final ObjectMapper json = new ObjectMapper();

    public PenjagaAkses(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest permintaan = (HttpServletRequest) req;
        HttpServletResponse jawaban = (HttpServletResponse) res;

        String jalur = permintaan.getRequestURI();
        String metode = permintaan.getMethod();

        // Bukan API, atau permintaan pendahuluan CORS — lewatkan.
        if (!jalur.startsWith("/api/") || "OPTIONS".equalsIgnoreCase(metode)) {
            chain.doFilter(req, res);
            return;
        }

        Sesi.Pengguna pengguna = bacaToken(permintaan);
        Butuh butuh = tentukan(metode, jalur);

        try {
            if (butuh == Butuh.SUDAH_MASUK && pengguna == null) {
                tolak(jawaban, HttpStatus.UNAUTHORIZED,
                        "Sesi Anda sudah berakhir. Silakan masuk kembali.");
                return;
            }
            if (butuh == Butuh.ADMIN && (pengguna == null || !pengguna.admin())) {
                tolak(jawaban,
                        pengguna == null ? HttpStatus.UNAUTHORIZED : HttpStatus.FORBIDDEN,
                        pengguna == null
                                ? "Sesi Anda sudah berakhir. Silakan masuk kembali."
                                : "Halaman ini hanya untuk pengelola toko.");
                return;
            }

            if (pengguna != null) Sesi.pasang(pengguna);
            chain.doFilter(req, res);
        } finally {
            Sesi.bersihkan();
        }
    }

    private Butuh tentukan(String metode, String jalur) {
        for (Aturan a : ATURAN) {
            boolean metodeCocok = "*".equals(a.metode()) || a.metode().equalsIgnoreCase(metode);
            if (metodeCocok && pencocok.match(a.pola(), jalur)) {
                return a.butuh();
            }
        }
        // Tidak ada aturan yang cocok: perlakukan sebagai milik pengelola.
        return Butuh.ADMIN;
    }

    private Sesi.Pengguna bacaToken(HttpServletRequest permintaan) {
        String header = permintaan.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        return tokenService.baca(header.substring(7).trim());
    }

    private void tolak(HttpServletResponse jawaban, HttpStatus status, String pesan) throws IOException {
        jawaban.setStatus(status.value());
        jawaban.setContentType("application/json;charset=UTF-8");

        Map<String, Object> badan = new LinkedHashMap<>();
        badan.put("timestamp", LocalDateTime.now().toString());
        badan.put("status", status.value());
        badan.put("message", pesan);
        jawaban.getWriter().write(json.writeValueAsString(badan));
    }
}
