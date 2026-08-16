package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.OrderFlow;
import com.knit_and_keep.backend.model.Transaction;
import com.knit_and_keep.backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Pemeriksa pembayaran di latar belakang.
 *
 * Webhook Midtrans tidak bisa menjangkau localhost, dan di server pun webhook
 * kadang gagal terkirim. Komponen ini menutup celah itu dengan menanyakan
 * sendiri status setiap pesanan yang masih menunggu pembayaran — sehingga
 * pesanan yang sudah dibayar tidak pernah tertinggal tanpa dikonfirmasi.
 */
@Component
public class PaymentPoller {

    private final TransactionRepository transactionRepository;
    private final PaymentService paymentService;
    private final OrderService orderService;

    @Value("${midtrans.polling.enabled}")
    private boolean aktif;

    public PaymentPoller(TransactionRepository transactionRepository,
                         PaymentService paymentService,
                         OrderService orderService) {
        this.transactionRepository = transactionRepository;
        this.paymentService = paymentService;
        this.orderService = orderService;
    }

    @Scheduled(fixedDelayString = "${midtrans.polling.interval-ms}", initialDelay = 20000)
    public void periksaPembayaranTertunda() {
        if (!aktif) return;

        LocalDateTime batas = LocalDateTime.now().minusDays(2);

        List<Transaction> tertunda = transactionRepository.findAll().stream()
                .filter(t -> "ONLINE".equalsIgnoreCase(t.getChannel()))
                .filter(t -> OrderFlow.MENUNGGU_PEMBAYARAN.equals(OrderFlow.normalize(t.getStatus())))
                .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().isAfter(batas))
                .toList();

        if (tertunda.isEmpty()) return;

        for (Transaction t : tertunda) {
            try {
                var hasil = paymentService.sinkronkan(t.getId());
                if (Boolean.TRUE.equals(hasil.get("berubah"))) {
                    System.out.println(">> Pembayaran " + t.getOrderId()
                            + " tersinkron otomatis menjadi " + hasil.get("status"));
                }
            } catch (Exception e) {
                // Satu pesanan bermasalah tidak boleh menghentikan pemeriksaan sisanya.
                System.err.println("Gagal memeriksa " + t.getOrderId() + ": " + e.getMessage());
            }
        }
    }

    /**
     * Membatalkan pesanan yang batas bayarnya sudah lewat.
     *
     * Karena stok disisihkan sejak pesanan dibuat, pesanan yang tidak pernah
     * dibayar harus dilepas — kalau tidak, barangnya tertahan selamanya dan
     * tidak bisa dibeli orang lain.
     */
    @Scheduled(fixedDelay = 300000, initialDelay = 60000)
    public void lepaskanPesananKedaluwarsa() {
        LocalDateTime sekarang = LocalDateTime.now();

        List<Transaction> kedaluwarsa = transactionRepository.findAll().stream()
                .filter(t -> OrderFlow.MENUNGGU_PEMBAYARAN.equals(OrderFlow.normalize(t.getStatus())))
                .filter(t -> Boolean.TRUE.equals(t.getStokDipotong()))
                .filter(t -> {
                    if (t.getKedaluwarsaPada() != null) return t.getKedaluwarsaPada().isBefore(sekarang);
                    // Belum pernah memulai pembayaran: beri tenggang dua hari.
                    return t.getCreatedAt() != null && t.getCreatedAt().isBefore(sekarang.minusDays(2));
                })
                .toList();

        for (Transaction t : kedaluwarsa) {
            try {
                orderService.ubahStatus(t.getId(), OrderFlow.DIBATALKAN, null, null,
                        "Batas waktu pembayaran habis, barang dikembalikan ke stok", "SISTEM");
                System.out.println(">> " + t.getOrderId() + " kedaluwarsa, stok dilepas kembali");
            } catch (Exception e) {
                System.err.println("Gagal melepas " + t.getOrderId() + ": " + e.getMessage());
            }
        }
    }
}
