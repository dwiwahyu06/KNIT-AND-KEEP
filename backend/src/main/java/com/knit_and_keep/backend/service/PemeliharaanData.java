package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.repository.NotifikasiRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Pemeliharaan berkala agar aplikasi tetap ringan setelah bertahun-tahun.
 *
 * <p>Yang dibersihkan hanya pemberitahuan lama yang sudah dibaca — kabar
 * "pesanan dikirim" dari dua tahun lalu tidak berguna bagi siapa pun, tetapi
 * jumlahnya terus bertambah setiap pesanan.
 *
 * <p>Data yang menjadi dasar pembukuan tidak pernah dihapus: pesanan, mutasi
 * stok, arus kas, dan retur harus tetap utuh supaya laporan tahun-tahun
 * sebelumnya masih bisa dipertanggungjawabkan.
 */
@Component
public class PemeliharaanData {

    private final NotifikasiRepository notifikasiRepository;

    @Value("${app.pemeliharaan.simpan-notifikasi-hari}")
    private int simpanHari;

    public PemeliharaanData(NotifikasiRepository notifikasiRepository) {
        this.notifikasiRepository = notifikasiRepository;
    }

    /** Berjalan sekali sehari, satu jam setelah aplikasi menyala. */
    @Scheduled(fixedRate = 24 * 60 * 60 * 1000L, initialDelay = 60 * 60 * 1000L)
    @Transactional
    public void bersihkanNotifikasiLama() {
        LocalDateTime batas = LocalDateTime.now().minusDays(simpanHari);
        int dibuang = notifikasiRepository.hapusYangSudahDibacaSebelum(batas);

        if (dibuang > 0) {
            System.out.println(">> Pemeliharaan: " + dibuang
                    + " pemberitahuan lama yang sudah dibaca dibersihkan");
        }
    }
}
