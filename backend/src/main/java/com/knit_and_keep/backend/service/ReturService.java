package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.*;
import com.knit_and_keep.backend.repository.ReturRepository;
import com.knit_and_keep.backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Menangani kendala di lapangan: barang rusak, salah kirim, barang hilang,
 * retur, dan ganti rugi.
 *
 * Setiap keputusan admin punya dua dampak yang diurus otomatis di sini:
 * dampak ke stok (barang kembali dan masih layak jual atau tidak) dan dampak
 * ke pembukuan (uang keluar sebagai refund atau ganti rugi).
 */
@Service
public class ReturService {

    @Autowired private ReturRepository returRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private OrderService orderService;
    @Autowired private CashFlowService cashFlowService;
    @Autowired private StokService stokService;
    @Autowired private NotifikasiService notifikasiService;
    @Autowired private PenyimpananBerkas penyimpananBerkas;

    private static final Sort TERBARU = Sort.by(Sort.Direction.DESC, "createdAt");

    public List<Retur> semua(String status) {
        if (status == null || status.isBlank()) {
            return returRepository.findAll(TERBARU);
        }
        return returRepository.findByStatus(status.toUpperCase(), TERBARU);
    }

    public List<Retur> milikPelanggan(Long pelangganId) {
        return returRepository.findByPelanggan(pelangganId);
    }

    public Retur cari(Long id) {
        return returRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pengajuan tidak ditemukan"));
    }

    /**
     * Pelanggan (atau admin, untuk laporan lewat telepon) mengajukan kendala.
     * Pesanan otomatis berpindah ke status KOMPLAIN.
     */
    @Transactional
    public Retur ajukan(Long transactionId, String jenisKendala, String alasan,
                        String fotoBukti, String diajukanOleh) {

        Transaction trx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pesanan tidak ditemukan"));

        String status = OrderFlow.normalize(trx.getStatus());
        boolean bolehKomplain = status.equals(OrderFlow.DIKIRIM)
                || status.equals(OrderFlow.SELESAI)
                || status.equals(OrderFlow.DIPROSES);
        if (!bolehKomplain) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Komplain hanya bisa diajukan untuk pesanan yang sedang diproses, dikirim, atau sudah selesai");
        }
        if (jenisKendala == null || jenisKendala.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jenis kendala wajib dipilih");
        }

        Retur retur = new Retur();
        retur.setTransaction(trx);
        retur.setJenisKendala(jenisKendala.toUpperCase());
        retur.setAlasan(alasan);
        // Foto disimpan sebagai berkas; yang masuk database hanya alamatnya.
        retur.setFotoBukti(penyimpananBerkas.simpanDataUri(fotoBukti, "bukti"));
        retur.setStatus("DIAJUKAN");
        retur.setDiajukanOleh(diajukanOleh == null ? "PELANGGAN" : diajukanOleh);
        Retur tersimpan = returRepository.save(retur);

        if (!OrderFlow.KOMPLAIN.equals(status)) {
            orderService.ubahStatus(trx.getId(), OrderFlow.KOMPLAIN, null, null,
                    "Komplain diajukan: " + OrderFlow.label(jenisKendala),
                    retur.getDiajukanOleh());
        }
        return tersimpan;
    }

    /**
     * Admin menyetujui pengajuan.
     *
     * @param bentuk        REFUND (uang dikembalikan) atau GANTI_RUGI (barang diganti / kompensasi)
     * @param barangKembali apakah barangnya dikirim balik ke toko
     * @param layakJual     kalau kembali, apakah masih bisa dijual lagi
     */
    @Transactional
    public Retur setujui(Long returId, String bentuk, Double nominalRefund,
                         Boolean barangKembali, Boolean layakJual, String catatanAdmin) {

        Retur retur = cari(returId);
        if (!"DIAJUKAN".equals(retur.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pengajuan ini sudah diproses");
        }

        Transaction trx = retur.getTransaction();
        String bentukPenyelesaian = (bentuk == null || bentuk.isBlank())
                ? OrderFlow.REFUND : bentuk.toUpperCase();
        double nominal = nominalRefund == null ? 0.0 : nominalRefund;

        retur.setStatus("DISETUJUI");
        retur.setBentukPenyelesaian(bentukPenyelesaian);
        retur.setNominalRefund(nominal);
        retur.setBarangKembali(Boolean.TRUE.equals(barangKembali));
        retur.setLayakJual(Boolean.TRUE.equals(layakJual));
        retur.setCatatanAdmin(catatanAdmin);
        returRepository.save(retur);

        // --- dampak ke stok ---
        if (Boolean.TRUE.equals(barangKembali) && Boolean.TRUE.equals(layakJual)) {
            for (TransactionItem item : trx.getItems()) {
                stokService.tambah(item.getProductId(), item.getQuantity(), null,
                        MutasiStok.RETUR, trx.getOrderId(),
                        "Retur diterima kembali, masih layak jual", "ADMIN");
                item.setQtyRetur(item.getQuantity());
            }
        }

        // --- dampak ke pembukuan ---
        if (nominal > 0) {
            String keterangan = OrderFlow.REFUND.equals(bentukPenyelesaian)
                    ? "Refund pesanan " + trx.getOrderId()
                    : "Ganti rugi pesanan " + trx.getOrderId();
            cashFlowService.catat("OUT", nominal, keterangan,
                    bentukPenyelesaian, trx.getOrderId(), trx.getChannel());
        }

        // --- alur status pesanan ---
        orderService.ubahStatus(trx.getId(), OrderFlow.RETUR_DIPROSES, null, null,
                "Pengajuan retur ditinjau admin", "ADMIN");
        orderService.ubahStatus(trx.getId(), OrderFlow.RETUR_DISETUJUI, null, null,
                catatanAdmin == null || catatanAdmin.isBlank()
                        ? "Retur disetujui" : catatanAdmin, "ADMIN");
        orderService.ubahStatus(trx.getId(), bentukPenyelesaian, null, null,
                OrderFlow.REFUND.equals(bentukPenyelesaian)
                        ? "Dana dikembalikan sebesar " + rupiah(nominal)
                        : "Ganti rugi diberikan sebesar " + rupiah(nominal), "ADMIN");

        notifikasiService.kabarkanRetur(trx, "Komplain disetujui",
                "Komplain untuk pesanan " + trx.getOrderId() + " disetujui. "
                        + (OrderFlow.REFUND.equals(bentukPenyelesaian)
                            ? "Dana " + rupiah(nominal) + " akan dikembalikan."
                            : "Ganti rugi " + rupiah(nominal) + " diberikan.")
                        + (catatanAdmin == null || catatanAdmin.isBlank() ? "" : " " + catatanAdmin));

        return cari(returId);
    }

    @Transactional
    public Retur tolak(Long returId, String catatanAdmin) {
        Retur retur = cari(returId);
        if (!"DIAJUKAN".equals(retur.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pengajuan ini sudah diproses");
        }
        retur.setStatus("DITOLAK");
        retur.setCatatanAdmin(catatanAdmin);
        returRepository.save(retur);

        orderService.ubahStatus(retur.getTransaction().getId(), OrderFlow.RETUR_DITOLAK, null, null,
                catatanAdmin == null || catatanAdmin.isBlank()
                        ? "Pengajuan retur ditolak" : catatanAdmin, "ADMIN");

        notifikasiService.kabarkanRetur(retur.getTransaction(), "Komplain ditolak",
                "Komplain untuk pesanan " + retur.getTransaction().getOrderId() + " tidak dapat disetujui."
                        + (catatanAdmin == null || catatanAdmin.isBlank() ? "" : " " + catatanAdmin));

        return cari(returId);
    }

    /** Menutup pesanan setelah kendalanya tuntas. */
    @Transactional
    public Transaction tutupKendala(Long transactionId, String catatan) {
        return orderService.ubahStatus(transactionId, OrderFlow.SELESAI, null, null,
                catatan == null || catatan.isBlank() ? "Kendala telah diselesaikan" : catatan, "ADMIN");
    }

    private String rupiah(double nilai) {
        return "Rp " + String.format("%,.0f", nilai).replace(',', '.');
    }
}
