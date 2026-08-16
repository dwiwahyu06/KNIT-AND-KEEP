package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.Notifikasi;
import com.knit_and_keep.backend.model.OrderFlow;
import com.knit_and_keep.backend.model.Transaction;
import com.knit_and_keep.backend.repository.NotifikasiRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Kabar untuk pelanggan.
 *
 * Sengaja disimpan di dalam aplikasi, bukan dikirim lewat surel: mengirim surel
 * butuh kredensial server surat yang belum dimiliki toko, sedangkan kabar di
 * dalam aplikasi sudah cukup memberi tahu tanpa bergantung layanan luar.
 */
@Service
public class NotifikasiService {

    private final NotifikasiRepository repository;

    public NotifikasiService(NotifikasiRepository repository) {
        this.repository = repository;
    }

    public Page<Notifikasi> milik(Long pelangganId, int halaman, int ukuran) {
        return repository.findByPelangganIdOrderByWaktuDesc(
                pelangganId, PageRequest.of(halaman, ukuran));
    }

    public long belumDibaca(Long pelangganId) {
        return repository.countByPelangganIdAndDibacaFalse(pelangganId);
    }

    @Transactional
    public void tandaiDibaca(Long id, Long pelangganId) {
        repository.findById(id)
                .filter(n -> n.getPelangganId().equals(pelangganId))
                .ifPresent(n -> {
                    n.setDibaca(true);
                    repository.save(n);
                });
    }

    @Transactional
    public int tandaiSemuaDibaca(Long pelangganId) {
        return repository.tandaiSemuaDibaca(pelangganId);
    }

    // ==================== PEMBUATAN OTOMATIS ====================

    /** Dipanggil setiap status pesanan berpindah. */
    @Transactional
    public void kabarkanStatus(Transaction trx, String statusBaru, String catatan) {
        if (trx.getPelanggan() == null) return;   // penjualan offline tidak punya penerima kabar

        String judul = switch (OrderFlow.normalize(statusBaru)) {
            case OrderFlow.DIPROSES   -> "Pembayaran diterima";
            case OrderFlow.DIKIRIM    -> "Pesanan dikirim";
            case OrderFlow.SELESAI    -> "Pesanan selesai";
            case OrderFlow.DIBATALKAN -> "Pesanan dibatalkan";
            case OrderFlow.KOMPLAIN   -> "Komplain diterima";
            case OrderFlow.REFUND     -> "Dana dikembalikan";
            case OrderFlow.GANTI_RUGI -> "Ganti rugi diberikan";
            default -> "Perkembangan pesanan";
        };

        String pesan = switch (OrderFlow.normalize(statusBaru)) {
            case OrderFlow.DIPROSES ->
                    "Pesanan " + trx.getOrderId() + " sudah dibayar dan sedang kami siapkan.";
            case OrderFlow.DIKIRIM ->
                    "Pesanan " + trx.getOrderId() + " sudah diserahkan ke "
                            + (trx.getKurir() == null ? "kurir" : trx.getKurir().toUpperCase())
                            + (trx.getNomorResi() == null ? "." : ", nomor resi " + trx.getNomorResi() + ".");
            case OrderFlow.SELESAI ->
                    "Terima kasih, pesanan " + trx.getOrderId() + " sudah selesai.";
            case OrderFlow.DIBATALKAN ->
                    "Pesanan " + trx.getOrderId() + " dibatalkan."
                            + (catatan == null || catatan.isBlank() ? "" : " " + catatan);
            default -> (catatan == null || catatan.isBlank()
                    ? "Ada perkembangan pada pesanan " + trx.getOrderId() + "."
                    : catatan);
        };

        simpan(trx, judul, pesan, "PESANAN");
    }

    /** Dipanggil saat komplain diputuskan admin. */
    @Transactional
    public void kabarkanRetur(Transaction trx, String judul, String pesan) {
        if (trx.getPelanggan() == null) return;
        simpan(trx, judul, pesan, "RETUR");
    }

    private void simpan(Transaction trx, String judul, String pesan, String jenis) {
        Notifikasi n = new Notifikasi();
        n.setPelangganId(trx.getPelanggan().getId());
        n.setJudul(judul);
        n.setPesan(pesan);
        n.setJenis(jenis);
        n.setReferensi(trx.getOrderId());
        n.setTransactionId(trx.getId());
        repository.save(n);
    }
}
