package com.knit_and_keep.backend.security;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Pembatas jumlah permintaan per alamat.
 *
 * Dipakai untuk endpoint yang meneruskan permintaan ke layanan berbayar
 * seperti pencarian wilayah RajaOngkir. Tanpa pembatas, satu orang yang
 * menahan tombol bisa menghabiskan kuota API toko dalam hitungan menit —
 * dan begitu kuotanya habis, ongkir tidak bisa dihitung untuk siapa pun.
 */
@Component
public class PembatasLaju {

    private record Jendela(Instant mulai, AtomicInteger hitung) {}

    private final Map<String, Jendela> catatan = new ConcurrentHashMap<>();

    /**
     * @param kunci   pembeda pemanggil, biasanya alamat IP ditambah nama endpoint
     * @param batas   jumlah permintaan yang diizinkan dalam satu jendela
     * @param detik   panjang jendela dalam detik
     */
    public void periksa(String kunci, int batas, int detik) {
        Instant sekarang = Instant.now();

        Jendela jendela = catatan.compute(kunci, (k, lama) -> {
            if (lama == null || lama.mulai().plusSeconds(detik).isBefore(sekarang)) {
                return new Jendela(sekarang, new AtomicInteger(0));
            }
            return lama;
        });

        if (jendela.hitung().incrementAndGet() > batas) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.");
        }

        // Menjaga peta tidak tumbuh tanpa batas pada pemakaian yang lama.
        if (catatan.size() > 5000) {
            catatan.entrySet().removeIf(e -> e.getValue().mulai().plusSeconds(detik).isBefore(sekarang));
        }
    }
}
