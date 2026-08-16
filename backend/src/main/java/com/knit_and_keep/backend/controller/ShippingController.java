package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.Transaction;
import com.knit_and_keep.backend.security.PembatasLaju;
import com.knit_and_keep.backend.security.Sesi;
import com.knit_and_keep.backend.service.OrderService;
import com.knit_and_keep.backend.service.ShippingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shipping")
@CrossOrigin(origins = "http://localhost:5173")
public class ShippingController {

    @Autowired private ShippingService shippingService;
    @Autowired private OrderService orderService;
    @Autowired private PembatasLaju pembatasLaju;

    /** Alamat asal toko dan daftar kurir yang dilayani. */
    @GetMapping("/info")
    public Map<String, Object> info() {
        return shippingService.infoAsal();
    }

    /**
     * Saran alamat tujuan saat pelanggan mengisi formulir alamat.
     * Dibatasi karena setiap panggilan diteruskan ke layanan berbayar RajaOngkir.
     */
    @GetMapping("/cari-tujuan")
    public List<Map<String, Object>> cariTujuan(
            HttpServletRequest permintaan,
            @RequestParam String q,
            @RequestParam(defaultValue = "15") int limit) throws Exception {
        pembatasLaju.periksa("cari-tujuan:" + alamat(permintaan), 30, 60);
        return shippingService.cariTujuan(q, limit);
    }

    /**
     * Ongkos kirim untuk satu alamat dan berat tertentu.
     *
     * Selalu mengembalikan pilihan, bahkan saat layanan kurir sedang tidak bisa
     * dihubungi — pilihan cadangan ditandai supaya pembeli tahu itu perkiraan.
     */
    @GetMapping("/ongkir")
    public List<Map<String, Object>> ongkir(
            HttpServletRequest permintaan,
            @RequestParam(required = false) String destinationId,
            @RequestParam int berat,
            @RequestParam(required = false) String kurir) {
        pembatasLaju.periksa("ongkir:" + alamat(permintaan), 40, 60);
        return shippingService.hitungOngkir(destinationId, berat, kurir);
    }

    private String alamat(HttpServletRequest permintaan) {
        String diteruskan = permintaan.getHeader("X-Forwarded-For");
        if (diteruskan != null && !diteruskan.isBlank()) {
            return diteruskan.split(",")[0].trim();
        }
        return permintaan.getRemoteAddr();
    }

    /** Melacak nomor resi apa pun secara langsung. */
    @GetMapping("/lacak")
    public Map<String, Object> lacak(
            @RequestParam String resi,
            @RequestParam String kurir,
            @RequestParam(required = false) String telepon) throws Exception {
        return shippingService.lacakResi(resi, kurir, telepon);
    }

    /**
     * Melacak pesanan berdasarkan nomornya.
     * Resi, kurir, dan nomor telepon penerima diambil dari data pesanan, jadi
     * pelanggan tidak perlu mengetik ulang apa pun.
     */
    @GetMapping("/lacak-pesanan/{transactionId}")
    public Map<String, Object> lacakPesanan(@PathVariable Long transactionId) throws Exception {
        Transaction trx = orderService.cari(transactionId);

        if (!Sesi.adalahAdmin()) {
            Sesi.wajibPemilik(trx.getPelanggan() == null ? null : trx.getPelanggan().getId());
        }

        if (trx.getNomorResi() == null || trx.getNomorResi().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Pesanan ini belum punya nomor resi.");
        }
        String telepon = trx.getTeleponPenerima();
        String limaDigit = (telepon != null && telepon.length() >= 5)
                ? telepon.substring(telepon.length() - 5)
                : null;

        Map<String, Object> hasil = shippingService.lacakResi(
                trx.getNomorResi(), trx.getKurir(), limaDigit);
        hasil.put("orderId", trx.getOrderId());
        return hasil;
    }
}
