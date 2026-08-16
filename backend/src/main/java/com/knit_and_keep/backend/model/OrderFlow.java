package com.knit_and_keep.backend.model;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Satu tempat yang memegang seluruh aturan alur status pesanan.
 *
 * Alur utama (semi-otomatis, dimajukan oleh admin):
 *   MENUNGGU_PEMBAYARAN -> DIPROSES -> DIKIRIM -> SELESAI
 *
 * Cabang kondisi khusus dipakai saat ada kendala di lapangan:
 *   DIKIRIM/SELESAI -> KOMPLAIN -> RETUR_DIPROSES -> RETUR_DISETUJUI/RETUR_DITOLAK
 *   RETUR_DISETUJUI -> REFUND atau GANTI_RUGI -> SELESAI
 */
public final class OrderFlow {

    private OrderFlow() {}

    // --- Alur utama ---
    public static final String MENUNGGU_PEMBAYARAN = "MENUNGGU_PEMBAYARAN";
    public static final String DIPROSES            = "DIPROSES";
    public static final String DIKIRIM             = "DIKIRIM";
    public static final String SELESAI             = "SELESAI";
    public static final String DIBATALKAN          = "DIBATALKAN";

    // --- Kondisi khusus / kendala ---
    public static final String KOMPLAIN         = "KOMPLAIN";
    public static final String RETUR_DIPROSES   = "RETUR_DIPROSES";
    public static final String RETUR_DISETUJUI  = "RETUR_DISETUJUI";
    public static final String RETUR_DITOLAK    = "RETUR_DITOLAK";
    public static final String REFUND           = "REFUND";
    public static final String GANTI_RUGI       = "GANTI_RUGI";

    /** Jenis kendala yang bisa dipilih pelanggan atau admin. */
    public static final List<String> JENIS_KENDALA = List.of(
            "BARANG_RUSAK",
            "SALAH_KIRIM",
            "BARANG_HILANG",
            "TIDAK_SESUAI_DESKRIPSI",
            "KURANG_JUMLAH",
            "LAINNYA"
    );

    /** Label yang enak dibaca manusia, dipakai frontend maupun laporan. */
    private static final Map<String, String> LABEL = Map.ofEntries(
            Map.entry(MENUNGGU_PEMBAYARAN, "Menunggu Pembayaran"),
            Map.entry(DIPROSES,            "Diproses"),
            Map.entry(DIKIRIM,             "Dikirim"),
            Map.entry(SELESAI,             "Selesai"),
            Map.entry(DIBATALKAN,          "Dibatalkan"),
            Map.entry(KOMPLAIN,            "Komplain"),
            Map.entry(RETUR_DIPROSES,      "Retur Diproses"),
            Map.entry(RETUR_DISETUJUI,     "Retur Disetujui"),
            Map.entry(RETUR_DITOLAK,       "Retur Ditolak"),
            Map.entry(REFUND,              "Dana Dikembalikan"),
            Map.entry(GANTI_RUGI,          "Ganti Rugi")
    );

    /** Perpindahan status yang diizinkan. Selain ini ditolak. */
    private static final Map<String, Set<String>> TRANSISI = Map.ofEntries(
            Map.entry(MENUNGGU_PEMBAYARAN, Set.of(DIPROSES, DIBATALKAN)),
            Map.entry(DIPROSES,            Set.of(DIKIRIM, DIBATALKAN, KOMPLAIN)),
            Map.entry(DIKIRIM,             Set.of(SELESAI, KOMPLAIN)),
            Map.entry(SELESAI,             Set.of(KOMPLAIN)),
            Map.entry(KOMPLAIN,            Set.of(RETUR_DIPROSES, RETUR_DITOLAK, GANTI_RUGI, SELESAI)),
            Map.entry(RETUR_DIPROSES,      Set.of(RETUR_DISETUJUI, RETUR_DITOLAK)),
            Map.entry(RETUR_DISETUJUI,     Set.of(REFUND, GANTI_RUGI)),
            Map.entry(RETUR_DITOLAK,       Set.of(SELESAI)),
            Map.entry(REFUND,              Set.of(SELESAI)),
            Map.entry(GANTI_RUGI,          Set.of(SELESAI)),
            Map.entry(DIBATALKAN,          Set.of())
    );

    /** Status lama dari versi sebelumnya, dipetakan ke istilah baru. */
    public static String normalize(String status) {
        if (status == null || status.isBlank()) return MENUNGGU_PEMBAYARAN;
        return switch (status.trim().toUpperCase()) {
            case "PENDING"   -> MENUNGGU_PEMBAYARAN;
            case "SUCCESS", "PAID", "LUNAS" -> DIPROSES;
            case "SHIPPED"   -> DIKIRIM;
            case "DELIVERED" -> SELESAI;
            case "FAILED", "CANCEL", "CANCELLED", "EXPIRE" -> DIBATALKAN;
            default -> status.trim().toUpperCase();
        };
    }

    public static String label(String status) {
        return LABEL.getOrDefault(normalize(status), normalize(status));
    }

    public static boolean bolehPindah(String dari, String ke) {
        return TRANSISI.getOrDefault(normalize(dari), Set.of()).contains(normalize(ke));
    }

    public static Set<String> lanjutanDari(String status) {
        return TRANSISI.getOrDefault(normalize(status), Set.of());
    }

    /** Pesanan sudah dibayar dan stoknya sudah dipotong. */
    public static boolean sudahDibayar(String status) {
        String s = normalize(status);
        return !s.equals(MENUNGGU_PEMBAYARAN) && !s.equals(DIBATALKAN);
    }

    /**
     * Transaksi ini dihitung sebagai omzet.
     *
     * Pesanan yang direfund tetap masuk: penjualannya benar-benar terjadi.
     * Uang yang dikembalikan dicatat terpisah sebagai kerugian, supaya tidak
     * terpotong dua kali dari laba. Yang dikecualikan hanya pesanan yang belum
     * dibayar dan yang dibatalkan.
     */
    public static boolean masukOmzet(String status) {
        return sudahDibayar(status);
    }

    /** Status yang menandakan pesanan sedang bermasalah. */
    public static boolean bermasalah(String status) {
        String s = normalize(status);
        return switch (s) {
            case KOMPLAIN, RETUR_DIPROSES, RETUR_DISETUJUI,
                 RETUR_DITOLAK, REFUND, GANTI_RUGI -> true;
            default -> false;
        };
    }
}
