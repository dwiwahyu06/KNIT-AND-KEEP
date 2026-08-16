package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.OrderFlow;
import com.knit_and_keep.backend.model.Transaction;
import com.knit_and_keep.backend.repository.TransactionRepository;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Jembatan antara alur pesanan dan Midtrans.
 *
 * Satu-satunya jalan sebuah pesanan berubah menjadi lunas adalah lewat
 * {@link #sinkronkan}, yang selalu bertanya dulu ke Midtrans. Frontend tidak
 * pernah bisa menyatakan sebuah pesanan sudah dibayar.
 */
@Service
public class PaymentService {

    @Autowired private TransactionRepository transactionRepository;
    @Autowired private MidtransService midtrans;
    @Autowired private OrderService orderService;

    public Map<String, Object> mulaiPembayaran(Long transactionId) throws IOException {
        Transaction trx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pesanan tidak ditemukan"));

        if (OrderFlow.sudahDibayar(trx.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pesanan ini sudah dibayar");
        }
        if (!"ONLINE".equalsIgnoreCase(trx.getChannel())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Pembayaran daring hanya untuk pesanan dari web");
        }
        return midtrans.buatSnapToken(trx);
    }

    /**
     * Menanyakan status sebuah pesanan ke Midtrans lalu menyesuaikan status di
     * database bila perlu.
     *
     * Ini titik masuk tunggal untuk tiga jalur berbeda: tombol pelanggan
     * setelah menutup popup, tombol admin di halaman pesanan, dan pemeriksaan
     * berkala di latar belakang.
     */
    @Transactional
    public Map<String, Object> sinkronkan(Long transactionId) {
        Transaction trx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pesanan tidak ditemukan"));
        return sinkronkan(trx);
    }

    @Transactional
    public Map<String, Object> sinkronkan(Transaction trx) {
        Map<String, Object> hasil = new LinkedHashMap<>();
        hasil.put("orderId", trx.getOrderId());
        hasil.put("statusSebelum", trx.getStatus());

        JSONObject status;
        try {
            status = midtrans.cekStatus(trx.getOrderId());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Tidak bisa menghubungi Midtrans: " + e.getMessage());
        }

        hasil.put("terhubung", true);
        hasil.put("kodeMidtrans", status.optString("status_code", ""));

        String kode = status.optString("status_code", "");
        if ("404".equals(kode)) {
            // Token pembayaran sudah dibuat, tetapi pelanggan belum memilih cara
            // bayar apa pun — jadi Midtrans memang belum punya catatannya.
            hasil.put("status", trx.getStatus());
            hasil.put("statusMidtrans", "belum_dimulai");
            hasil.put("pesan", "Pembayaran belum pernah dimulai. Buka kembali halaman pembayaran untuk menyelesaikannya.");
            hasil.put("berubah", false);
            return hasil;
        }

        String caraBayar = status.optString("payment_type", null);
        if (caraBayar != null && !caraBayar.isBlank()) {
            trx.setMetodeMidtrans(caraBayar);
        }
        var kedaluwarsa = midtrans.waktuKedaluwarsa(status);
        if (kedaluwarsa != null) trx.setKedaluwarsaPada(kedaluwarsa);
        transactionRepository.save(trx);

        MidtransService.Hasil tafsir = midtrans.tafsirkan(status);
        boolean berubah = false;

        if (tafsir == MidtransService.Hasil.LUNAS && !OrderFlow.sudahDibayar(trx.getStatus())) {
            orderService.ubahStatus(trx.getId(), OrderFlow.DIPROSES, null, null,
                    "Pembayaran diterima Midtrans" + (caraBayar == null ? "" : " lewat " + caraBayar),
                    "MIDTRANS");
            if (trx.getPelanggan() != null) {
                orderService.kosongkanKeranjang(trx.getPelanggan().getId());
            }
            berubah = true;
        } else if (tafsir == MidtransService.Hasil.GAGAL
                && OrderFlow.MENUNGGU_PEMBAYARAN.equals(OrderFlow.normalize(trx.getStatus()))) {
            orderService.ubahStatus(trx.getId(), OrderFlow.DIBATALKAN, null, null,
                    "Pembayaran dibatalkan atau kedaluwarsa di Midtrans", "MIDTRANS");
            berubah = true;
        }

        Transaction terbaru = transactionRepository.findById(trx.getId()).orElse(trx);
        hasil.put("status", terbaru.getStatus());
        hasil.put("statusMidtrans", status.optString("transaction_status"));
        hasil.put("caraBayar", caraBayar);
        hasil.put("berubah", berubah);
        hasil.put("pesan", switch (tafsir) {
            case LUNAS -> "Pembayaran sudah diterima.";
            case MENUNGGU -> "Pembayaran belum selesai. Selesaikan sebelum batas waktu habis.";
            case GAGAL -> "Pembayaran dibatalkan atau kedaluwarsa.";
            case TIDAK_DIKENAL -> "Status pembayaran belum bisa dipastikan.";
        });
        return hasil;
    }

    /**
     * Notifikasi resmi dari Midtrans. Baru dipercaya setelah tanda tangannya
     * cocok, lalu statusnya tetap dikonfirmasi ulang lewat Status API.
     */
    @Transactional
    public void tanganiNotifikasi(Map<String, Object> notifikasi) {
        if (!midtrans.tandaTanganSah(notifikasi)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Tanda tangan notifikasi tidak sah — permintaan diabaikan");
        }
        String orderId = String.valueOf(notifikasi.get("order_id"));
        transactionRepository.findByOrderId(orderId).ifPresent(this::sinkronkan);
    }
}
