package com.knit_and_keep.backend.service;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Menyimpan sebentar jawaban dari layanan kurir.
 *
 * <p>Kuota RajaOngkir dihitung per hari. Tanpa ini, satu pembeli yang mengetik
 * "cipadung" lalu menghapusnya dan mengetik ulang sudah menghabiskan beberapa
 * panggilan, dan setiap kali halaman checkout dibuka ulang tarifnya ditanyakan
 * lagi — padahal jawabannya sama persis.
 *
 * <p>Ada dua umur yang dibedakan:
 * <ul>
 *   <li><b>segar</b> — jawaban dipakai langsung tanpa memanggil kurir sama sekali.</li>
 *   <li><b>basi</b> — sudah lewat umur segar, tetapi masih disimpan. Kalau
 *       panggilan ke kurir gagal (kuota habis, layanan mati), jawaban basi ini
 *       dipakai. Tarif kemarin jauh lebih mendekati kebenaran daripada tarif
 *       tetap karangan toko.</li>
 * </ul>
 *
 * <p>Disimpan di memori aplikasi, bukan di database: isinya bukan data toko,
 * dan hilang saat aplikasi dimulai ulang pun tidak merugikan.
 */
@Component
public class IngatanOngkir {

    /** Selama ini, jawaban dipakai tanpa bertanya lagi ke kurir. */
    private static final Duration UMUR_SEGAR = Duration.ofHours(12);

    /** Setelah selewat ini, jawaban dibuang sama sekali. */
    private static final Duration UMUR_BUANG = Duration.ofDays(7);

    /** Batas jumlah entri, supaya memori tidak tumbuh tanpa henti. */
    private static final int BATAS_ENTRI = 500;

    private record Catatan(Object nilai, LocalDateTime waktu) {}

    /**
     * LinkedHashMap dengan urutan akses: yang paling lama tidak dipakai berada
     * di depan, jadi itu yang dibuang lebih dulu saat penuh.
     */
    private final Map<String, Catatan> isi =
            new LinkedHashMap<>(64, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, Catatan> eldest) {
                    return size() > BATAS_ENTRI;
                }
            };

    /** Jawaban yang masih segar, kalau ada. */
    public synchronized Optional<Object> segar(String kunci) {
        Catatan c = isi.get(kunci);
        if (c == null) return Optional.empty();
        if (umurLewat(c, UMUR_SEGAR)) return Optional.empty();
        return Optional.of(c.nilai());
    }

    /** Jawaban lama mana pun yang masih tersimpan — dipakai saat kurir gagal dihubungi. */
    public synchronized Optional<Object> basiPunTakApa(String kunci) {
        Catatan c = isi.get(kunci);
        if (c == null) return Optional.empty();
        if (umurLewat(c, UMUR_BUANG)) {
            isi.remove(kunci);
            return Optional.empty();
        }
        return Optional.of(c.nilai());
    }

    public synchronized void simpan(String kunci, Object nilai) {
        isi.put(kunci, new Catatan(nilai, LocalDateTime.now()));
    }

    /** Berapa banyak jawaban yang sedang disimpan — dipakai endpoint kesehatan. */
    public synchronized int jumlah() {
        return isi.size();
    }

    private boolean umurLewat(Catatan c, Duration batas) {
        return c.waktu().plus(batas).isBefore(LocalDateTime.now());
    }
}
