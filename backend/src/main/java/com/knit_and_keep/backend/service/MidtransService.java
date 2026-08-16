package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.Transaction;
import com.knit_and_keep.backend.model.TransactionItem;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Segala hal yang berhubungan langsung dengan Midtrans.
 *
 * Prinsip yang dipegang di sini: <b>status pembayaran hanya boleh berasal dari
 * Midtrans</b>, tidak pernah dari browser pelanggan. Popup Snap di frontend
 * hanya memberi tahu kapan harus bertanya — jawabannya tetap ditanyakan
 * backend langsung ke Midtrans lewat Status API.
 */
@Service
public class MidtransService {

    @Value("${midtrans.server.key}")      private String serverKey;
    @Value("${midtrans.client.key}")      private String clientKey;
    @Value("${midtrans.is-production}")   private boolean produksi;
    @Value("${midtrans.expiry-minutes}")  private int menitKedaluwarsa;

    @Autowired private OkHttpClient client;

    private static final MediaType JSON_TYPE = MediaType.get("application/json; charset=utf-8");

    private String urlSnap() {
        return produksi
                ? "https://app.midtrans.com/snap/v1/transactions"
                : "https://app.sandbox.midtrans.com/snap/v1/transactions";
    }

    private String urlApi() {
        return produksi
                ? "https://api.midtrans.com/v2"
                : "https://api.sandbox.midtrans.com/v2";
    }

    /** Dipakai frontend untuk memuat skrip Snap dari lingkungan yang benar. */
    public Map<String, Object> konfigurasiKlien() {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("clientKey", clientKey);
        config.put("produksi", produksi);
        config.put("snapUrl", produksi
                ? "https://app.midtrans.com/snap/snap.js"
                : "https://app.sandbox.midtrans.com/snap/snap.js");
        return config;
    }

    // ==================== BUAT TOKEN PEMBAYARAN ====================

    public Map<String, Object> buatSnapToken(Transaction trx) throws IOException {
        JSONObject rincianTransaksi = new JSONObject();
        rincianTransaksi.put("order_id", trx.getOrderId());
        rincianTransaksi.put("gross_amount", trx.getAmount());

        JSONObject pelanggan = new JSONObject();
        if (trx.getPelanggan() != null) {
            pelanggan.put("first_name", trx.getPelanggan().getUsername());
            pelanggan.put("email", trx.getPelanggan().getEmail());
        }
        if (trx.getTeleponPenerima() != null && !trx.getTeleponPenerima().isBlank()) {
            pelanggan.put("phone", trx.getTeleponPenerima());
        }
        if (trx.getAlamatPengiriman() != null && !trx.getAlamatPengiriman().isBlank()) {
            JSONObject alamat = new JSONObject();
            alamat.put("first_name", trx.getNamaPenerima() == null ? trx.getNamaPelanggan() : trx.getNamaPenerima());
            alamat.put("phone", trx.getTeleponPenerima());
            alamat.put("address", potong(trx.getAlamatPengiriman(), 200));
            alamat.put("country_code", "IDN");
            pelanggan.put("shipping_address", alamat);
        }

        // Rincian barang harus berjumlah persis sama dengan gross_amount,
        // kalau tidak Midtrans menolak permintaannya.
        JSONArray rincianItem = new JSONArray();
        for (TransactionItem item : trx.getItems()) {
            JSONObject baris = new JSONObject();
            baris.put("id", String.valueOf(item.getProductId()));
            baris.put("name", potong(item.getNamaProduk(), 50));
            baris.put("price", Math.round(item.getHargaJual()));
            baris.put("quantity", item.getQuantity());
            rincianItem.put(baris);
        }
        if (trx.getOngkir() != null && trx.getOngkir() > 0) {
            JSONObject ongkir = new JSONObject();
            ongkir.put("id", "ONGKIR");
            ongkir.put("name", potong("Ongkir " + nonNull(trx.getKurir()) + " " + nonNull(trx.getLayananKurir()), 50));
            ongkir.put("price", Math.round(trx.getOngkir()));
            ongkir.put("quantity", 1);
            rincianItem.put(ongkir);
        }

        JSONObject kedaluwarsa = new JSONObject();
        kedaluwarsa.put("unit", "minute");
        kedaluwarsa.put("duration", menitKedaluwarsa);
        kedaluwarsa.put("start_time", DateTimeFormatter
                .ofPattern("yyyy-MM-dd HH:mm:ss Z")
                .withZone(ZoneId.of("Asia/Jakarta"))
                .format(java.time.Instant.now()));

        JSONObject badan = new JSONObject();
        badan.put("transaction_details", rincianTransaksi);
        badan.put("customer_details", pelanggan);
        badan.put("item_details", rincianItem);
        badan.put("expiry", kedaluwarsa);

        Request request = new Request.Builder()
                .url(urlSnap())
                .post(RequestBody.create(badan.toString(), JSON_TYPE))
                .addHeader("Accept", "application/json")
                .addHeader("Authorization", "Basic " + otorisasi())
                .build();

        try (Response response = client.newCall(request).execute()) {
            String isi = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Midtrans menolak permintaan pembayaran: " + ringkasGalat(isi));
            }
            JSONObject json = new JSONObject(isi);
            Map<String, Object> hasil = new LinkedHashMap<>();
            hasil.put("token", json.getString("token"));
            hasil.put("redirectUrl", json.optString("redirect_url"));
            hasil.put("orderId", trx.getOrderId());
            return hasil;
        }
    }

    // ==================== TANYA STATUS KE MIDTRANS ====================

    /**
     * Menanyakan status sebuah pesanan langsung ke Midtrans.
     *
     * Cara ini berjalan sempurna dari localhost, karena backend yang menelepon
     * ke luar — bukan Midtrans yang harus menelepon masuk seperti pada webhook.
     */
    public JSONObject cekStatus(String orderId) throws IOException {
        Request request = new Request.Builder()
                .url(urlApi() + "/" + orderId + "/status")
                .get()
                .addHeader("Accept", "application/json")
                .addHeader("Authorization", "Basic " + otorisasi())
                .build();

        try (Response response = client.newCall(request).execute()) {
            String isi = response.body() != null ? response.body().string() : "";
            if (isi.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Midtrans tidak memberi jawaban");
            }
            JSONObject json = new JSONObject(isi);
            if (response.code() == 401) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Server key Midtrans ditolak. Periksa midtrans.server.key.");
            }
            return json;
        }
    }

    /** Membatalkan pesanan yang belum dibayar di sisi Midtrans. */
    public void batalkan(String orderId) throws IOException {
        Request request = new Request.Builder()
                .url(urlApi() + "/" + orderId + "/cancel")
                .post(RequestBody.create("", JSON_TYPE))
                .addHeader("Accept", "application/json")
                .addHeader("Authorization", "Basic " + otorisasi())
                .build();
        try (Response response = client.newCall(request).execute()) {
            if (response.body() != null) response.body().close();
        }
    }

    // ==================== KEAMANAN WEBHOOK ====================

    /**
     * Memastikan notifikasi memang datang dari Midtrans.
     *
     * Tanda tangannya adalah SHA-512 dari order_id + status_code + gross_amount
     * + server key. Tanpa pemeriksaan ini, siapa pun yang tahu alamat webhook
     * bisa menandai pesanan sebagai lunas.
     */
    public boolean tandaTanganSah(Map<String, Object> notifikasi) {
        try {
            String orderId = String.valueOf(notifikasi.get("order_id"));
            String statusCode = String.valueOf(notifikasi.get("status_code"));
            String grossAmount = String.valueOf(notifikasi.get("gross_amount"));
            String diterima = String.valueOf(notifikasi.get("signature_key"));

            String bahan = orderId + statusCode + grossAmount + serverKey;
            MessageDigest md = MessageDigest.getInstance("SHA-512");
            byte[] sidik = md.digest(bahan.getBytes(StandardCharsets.UTF_8));

            StringBuilder heks = new StringBuilder();
            for (byte b : sidik) heks.append(String.format("%02x", b));

            return heks.toString().equalsIgnoreCase(diterima);
        } catch (Exception e) {
            return false;
        }
    }

    // ==================== PENAFSIRAN STATUS ====================

    public enum Hasil { LUNAS, MENUNGGU, GAGAL, TIDAK_DIKENAL }

    /**
     * Menerjemahkan jawaban Midtrans menjadi tiga kemungkinan yang berarti
     * bagi toko: sudah lunas, masih menunggu, atau batal.
     */
    public Hasil tafsirkan(JSONObject status) {
        String transaksi = status.optString("transaction_status", "");
        String fraud = status.optString("fraud_status", "accept");

        return switch (transaksi) {
            case "capture" -> "accept".equalsIgnoreCase(fraud) ? Hasil.LUNAS : Hasil.MENUNGGU;
            case "settlement" -> Hasil.LUNAS;
            case "pending" -> Hasil.MENUNGGU;
            case "deny", "cancel", "expire", "failure" -> Hasil.GAGAL;
            default -> Hasil.TIDAK_DIKENAL;
        };
    }

    public LocalDateTime waktuKedaluwarsa(JSONObject status) {
        String teks = status.optString("expiry_time", null);
        if (teks == null || teks.isBlank()) return null;
        try {
            return LocalDateTime.parse(teks.replace(" ", "T"));
        } catch (Exception e) {
            return null;
        }
    }

    // ==================== PEMBANTU ====================

    private String otorisasi() {
        return Base64.getEncoder().encodeToString((serverKey + ":").getBytes(StandardCharsets.UTF_8));
    }

    private String ringkasGalat(String isi) {
        try {
            JSONObject json = new JSONObject(isi);
            if (json.has("error_messages")) return json.getJSONArray("error_messages").join(", ");
            if (json.has("status_message")) return json.getString("status_message");
        } catch (Exception diabaikan) {
            // Bukan JSON — kembalikan apa adanya.
        }
        return isi.length() > 300 ? isi.substring(0, 300) : isi;
    }

    private String potong(String teks, int panjang) {
        if (teks == null) return "";
        return teks.length() > panjang ? teks.substring(0, panjang) : teks;
    }

    private String nonNull(String teks) {
        return teks == null ? "" : teks;
    }
}
