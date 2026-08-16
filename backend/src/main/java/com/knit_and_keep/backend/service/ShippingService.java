package com.knit_and_keep.backend.service;

import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.*;

/**
 * Pengiriman nyata lewat RajaOngkir (Komerce): cari alamat tujuan, hitung
 * ongkos kirim, dan lacak nomor resi ke kurir.
 *
 * Catatan format: endpoint domestic-cost versi ini mengembalikan daftar layanan
 * yang datar — satu objek per layanan berisi name, code, service, cost, etd.
 * Bukan struktur bersarang costs[] seperti RajaOngkir versi lama.
 */
@Service
public class ShippingService {

    @Value("${rajaongkir.api.key}")
    private String apiKey;

    @Value("${rajaongkir.api.baseurl}")
    private String baseUrl;

    @Value("${toko.origin.id}")
    private String originId;

    @Value("${toko.origin.label}")
    private String originLabel;

    @Value("${toko.kurir}")
    private String kurirDitawarkan;

    @Value("${toko.berat-minimum}")
    private int beratMinimum;

    @Value("${toko.ongkir-cadangan}")
    private String ongkirCadangan;

    private final OkHttpClient client;
    private final IngatanOngkir ingatan;

    @Autowired
    public ShippingService(OkHttpClient client, IngatanOngkir ingatan) {
        this.client = client;
        this.ingatan = ingatan;
    }

    // ==================== INFORMASI TOKO ====================

    public Map<String, Object> infoAsal() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("originId", originId);
        info.put("originLabel", originLabel);
        info.put("kurir", List.of(kurirDitawarkan.split(":")));
        info.put("beratMinimum", beratMinimum);
        return info;
    }

    // ==================== CARI TUJUAN ====================

    /**
     * Mencari kelurahan tujuan. Hasilnya dipakai sebagai daftar saran saat
     * pelanggan mengisi alamat, dan id-nya disimpan untuk menghitung ongkir.
     */
    public List<Map<String, Object>> cariTujuan(String kata, int batas) throws IOException {
        if (kata == null || kata.trim().length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ketik minimal 3 huruf nama kelurahan, kecamatan, atau kota");
        }

        // Nama wilayah praktis tidak pernah berubah, jadi pertanyaan yang sama
        // tidak perlu menghabiskan kuota dua kali.
        String kunci = "tujuan:" + kata.trim().toLowerCase(Locale.ROOT) + ":" + batas;
        Optional<Object> tersimpan = ingatan.segar(kunci);
        if (tersimpan.isPresent()) {
            return (List<Map<String, Object>>) tersimpan.get();
        }

        HttpUrl url = HttpUrl.parse(baseUrl + "/destination/domestic-destination")
                .newBuilder()
                .addQueryParameter("search", kata.trim())
                .addQueryParameter("limit", String.valueOf(batas))
                .build();

        Request request = new Request.Builder()
                .url(url).get()
                .addHeader("key", apiKey)
                .build();

        String isi;
        try {
            isi = jalankan(request, "mencari alamat tujuan");
        } catch (Exception e) {
            // Kuota habis atau layanan mati. Jawaban lama, walau sudah basi,
            // masih jauh lebih berguna daripada tidak ada sama sekali.
            Optional<Object> lama = ingatan.basiPunTakApa(kunci);
            if (lama.isPresent()) {
                System.err.println("Pencarian wilayah gagal, memakai jawaban tersimpan: " + e.getMessage());
                return (List<Map<String, Object>>) lama.get();
            }
            throw e;
        }

        JSONObject json = new JSONObject(isi);
        JSONArray data = json.optJSONArray("data");
        if (data == null) return List.of();

        List<Map<String, Object>> hasil = new ArrayList<>();
        for (int i = 0; i < data.length(); i++) {
            JSONObject d = data.getJSONObject(i);
            Map<String, Object> baris = new LinkedHashMap<>();
            baris.put("id", d.optInt("id"));
            baris.put("label", d.optString("label"));
            baris.put("provinsi", d.optString("province_name"));
            baris.put("kabupaten", d.optString("city_name"));
            baris.put("kecamatan", d.optString("district_name"));
            baris.put("kelurahan", d.optString("subdistrict_name"));
            baris.put("kodePos", d.optString("zip_code"));
            hasil.add(baris);
        }
        ingatan.simpan(kunci, hasil);
        return hasil;
    }

    // ==================== HITUNG ONGKIR ====================

    /**
     * Menghitung ongkos kirim nyata dari alamat toko ke alamat tujuan.
     *
     * @param destinationId id kelurahan tujuan hasil pencarian
     * @param beratGram     total berat paket; dinaikkan ke berat minimum bila kurang
     * @param kurir         daftar kurir dipisah titik dua, kosong berarti pakai bawaan toko
     */
    public List<Map<String, Object>> hitungOngkir(String destinationId, int beratGram, String kurir) {
        int berat = Math.max(beratGram, beratMinimum);

        // Alamat lama yang belum punya titik kirim tetap dilayani dengan tarif
        // cadangan, supaya pembelinya tidak terjebak tanpa bisa checkout.
        if (destinationId == null || destinationId.isBlank()) {
            return tarifCadangan(berat, "Alamat ini belum punya titik kirim kurir");
        }

        String daftarKurir = (kurir == null || kurir.isBlank()) ? kurirDitawarkan : kurir;

        // Berat dibulatkan ke atas per setengah kilo. Tarif kurir memang
        // dihitung per kilogram, jadi 620 gram dan 850 gram menghasilkan angka
        // yang sama — tidak perlu dua panggilan terpisah untuk keduanya.
        int beratKunci = ((berat + 499) / 500) * 500;
        String kunci = "ongkir:" + destinationId + ":" + beratKunci + ":" + daftarKurir.toLowerCase();

        Optional<Object> tersimpan = ingatan.segar(kunci);
        if (tersimpan.isPresent()) {
            return (List<Map<String, Object>>) tersimpan.get();
        }

        try {
            RequestBody body = new FormBody.Builder()
                    .add("origin", originId)
                    .add("destination", destinationId)
                    .add("weight", String.valueOf(berat))
                    .add("courier", daftarKurir.toLowerCase())
                    .build();

            Request request = new Request.Builder()
                    .url(baseUrl + "/calculate/domestic-cost")
                    .post(body)
                    .addHeader("key", apiKey)
                    .build();

            String isi = jalankan(request, "menghitung ongkos kirim");
            JSONObject json = new JSONObject(isi);
            JSONArray data = json.optJSONArray("data");

            List<Map<String, Object>> opsi = new ArrayList<>();
            if (data != null) {
                for (int i = 0; i < data.length(); i++) {
                    JSONObject d = data.getJSONObject(i);
                    int ongkir = d.optInt("cost", 0);
                    if (ongkir <= 0) continue;

                    Map<String, Object> baris = new LinkedHashMap<>();
                    baris.put("kurir", d.optString("code"));
                    baris.put("namaKurir", d.optString("name"));
                    baris.put("layanan", d.optString("service"));
                    baris.put("keterangan", d.optString("description"));
                    baris.put("ongkir", ongkir);
                    baris.put("estimasi", rapikanEstimasi(d.optString("etd")));
                    baris.put("berat", berat);
                    baris.put("cadangan", false);
                    opsi.add(baris);
                }
            }

            if (opsi.isEmpty()) {
                return tarifCadangan(berat, "Kurir tidak melayani wilayah ini");
            }

            // Termurah lebih dulu — itu yang paling sering dipilih pembeli.
            opsi.sort(Comparator.comparingInt(o -> (int) o.get("ongkir")));
            ingatan.simpan(kunci, opsi);
            return opsi;

        } catch (Exception e) {
            // Kuota habis, layanan sedang mati, atau jaringan terputus.

            // Tarif sungguhan dari kemarin jauh lebih mendekati kebenaran
            // daripada tarif tetap karangan toko, jadi itu yang dicoba dulu.
            Optional<Object> lama = ingatan.basiPunTakApa(kunci);
            if (lama.isPresent()) {
                System.err.println("Ongkir dari kurir gagal, memakai tarif tersimpan: " + e.getMessage());
                return (List<Map<String, Object>>) lama.get();
            }

            // Belum pernah ada jawaban untuk tujuan ini. Toko tetap harus bisa
            // menerima pesanan — selisih ongkir jauh lebih murah daripada
            // kehilangan seluruh penjualan hari itu.
            System.err.println("Ongkir dari kurir gagal, memakai tarif cadangan: " + e.getMessage());
            return tarifCadangan(berat, "Tarif kurir sedang tidak bisa diambil");
        }
    }

    /**
     * Tarif tetap yang dipakai saat tarif kurir tidak bisa diambil.
     * Ditandai {@code cadangan = true} supaya frontend bisa memberi tahu
     * pembeli bahwa angkanya perkiraan, bukan tarif resmi kurir.
     */
    private List<Map<String, Object>> tarifCadangan(int berat, String alasan) {
        List<Map<String, Object>> opsi = new ArrayList<>();

        for (String baris : ongkirCadangan.split(",")) {
            String[] bagian = baris.split(":");
            if (bagian.length < 4) continue;
            try {
                Map<String, Object> o = new LinkedHashMap<>();
                o.put("kurir", "toko");
                o.put("namaKurir", bagian[1].trim());
                o.put("layanan", bagian[0].trim());
                o.put("keterangan", "Tarif perkiraan toko");
                o.put("ongkir", Integer.parseInt(bagian[2].trim()));
                o.put("estimasi", bagian[3].trim());
                o.put("berat", berat);
                o.put("cadangan", true);
                o.put("alasan", alasan);
                opsi.add(o);
            } catch (NumberFormatException diabaikan) {
                // Satu baris tarif yang salah tulis tidak boleh menjatuhkan sisanya.
            }
        }

        opsi.sort(Comparator.comparingInt(o -> (int) o.get("ongkir")));
        return opsi;
    }

    // ==================== LACAK RESI ====================

    /**
     * Menanyakan posisi paket langsung ke kurir lewat RajaOngkir.
     *
     * @param teleponAkhir lima digit terakhir nomor penerima; diminta beberapa
     *                     kurir (JNE salah satunya) sebagai validasi tambahan
     */
    public Map<String, Object> lacakResi(String resi, String kurir, String teleponAkhir) throws IOException {
        if (resi == null || resi.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nomor resi belum diisi");
        }
        if (kurir == null || kurir.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kurir belum dipilih");
        }

        HttpUrl.Builder url = HttpUrl.parse(baseUrl + "/track/waybill").newBuilder()
                .addQueryParameter("awb", resi.trim())
                .addQueryParameter("courier", kodeKurir(kurir));
        if (teleponAkhir != null && !teleponAkhir.isBlank()) {
            url.addQueryParameter("last_phone_number", teleponAkhir.trim());
        }

        Request request = new Request.Builder()
                .url(url.build())
                .post(RequestBody.create(new byte[0], null))
                .addHeader("key", apiKey)
                .build();

        try (Response response = client.newCall(request).execute()) {
            String isi = response.body() != null ? response.body().string() : "";

            if (response.code() == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Resi belum terbaca di sistem kurir. Biasanya butuh beberapa jam "
                                + "sejak paket diserahkan, atau nomor resinya keliru.");
            }
            if (response.code() == 422) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Kurir ini butuh 5 digit terakhir nomor telepon penerima untuk melacak resi.");
            }
            if (!response.isSuccessful()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Layanan pelacakan sedang tidak bisa dihubungi (kode " + response.code() + ")");
            }
            return petakanPelacakan(new JSONObject(isi));
        }
    }

    private Map<String, Object> petakanPelacakan(JSONObject json) {
        JSONObject data = json.optJSONObject("data");
        if (data == null) data = json;

        JSONObject ringkas = data.optJSONObject("summary");
        JSONObject rinci = data.optJSONObject("details");
        JSONObject status = data.optJSONObject("delivery_status");
        JSONArray manifes = data.optJSONArray("manifest");

        Map<String, Object> hasil = new LinkedHashMap<>();
        hasil.put("resi", ringkas == null ? null : ringkas.optString("waybill_number"));
        hasil.put("kurir", ringkas == null ? null : ringkas.optString("courier_name"));
        hasil.put("layanan", ringkas == null ? null : ringkas.optString("service_code"));
        hasil.put("status", ringkas == null ? "-" : ringkas.optString("status"));
        hasil.put("tanggalKirim", ringkas == null ? null : ringkas.optString("waybill_date"));
        hasil.put("pengirim", ringkas == null ? null : ringkas.optString("shipper_name"));
        hasil.put("penerima", ringkas == null ? null : ringkas.optString("receiver_name"));
        hasil.put("asal", ringkas == null ? null : ringkas.optString("origin"));
        hasil.put("tujuan", ringkas == null ? null : ringkas.optString("destination"));

        if (rinci != null) {
            hasil.put("alamatPengirim", rinci.optString("shipper_address1"));
            hasil.put("alamatPenerima", rinci.optString("receiver_address1"));
            hasil.put("berat", rinci.optString("weight"));
        }
        if (status != null) {
            hasil.put("terkirim", status.optBoolean("status", false)
                    || "DELIVERED".equalsIgnoreCase(status.optString("status")));
            hasil.put("diterimaOleh", status.optString("pod_receiver"));
            hasil.put("waktuDiterima", gabungWaktu(status.optString("pod_date"), status.optString("pod_time")));
        }

        List<Map<String, Object>> langkah = new ArrayList<>();
        if (manifes != null) {
            for (int i = 0; i < manifes.length(); i++) {
                JSONObject m = manifes.getJSONObject(i);
                Map<String, Object> baris = new LinkedHashMap<>();
                baris.put("waktu", gabungWaktu(m.optString("manifest_date"), m.optString("manifest_time")));
                baris.put("keterangan", m.optString("manifest_description"));
                baris.put("lokasi", m.optString("city_name"));
                langkah.add(baris);
            }
            // Kejadian terbaru ditaruh paling atas agar mudah dibaca.
            Collections.reverse(langkah);
        }
        hasil.put("riwayat", langkah);
        return hasil;
    }

    // ==================== PEMBANTU ====================

    private String jalankan(Request request, String konteks) throws IOException {
        try (Response response = client.newCall(request).execute()) {
            String isi = response.body() != null ? response.body().string() : "";

            if (response.code() == 401 || response.code() == 403) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Kunci API RajaOngkir ditolak. Periksa rajaongkir.api.key di application.properties.");
            }
            if (!response.isSuccessful()) {
                String pesan = "Layanan pengiriman gagal saat " + konteks;
                try {
                    JSONObject meta = new JSONObject(isi).optJSONObject("meta");
                    if (meta != null && meta.has("message")) pesan += ": " + meta.getString("message");
                } catch (Exception diabaikan) {
                    // Badan respons bukan JSON — pesan bawaan sudah cukup jelas.
                }
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, pesan);
            }
            return isi;
        }
    }

    /** "1 day" dan "2-3 day" jadi "1 hari" dan "2-3 hari". */
    private String rapikanEstimasi(String etd) {
        if (etd == null || etd.isBlank()) return "-";
        String bersih = etd.toLowerCase()
                .replace("days", "hari")
                .replace("day", "hari")
                .replace("hour", "jam")
                .trim();
        return bersih.isBlank() ? "-" : bersih;
    }

    private String gabungWaktu(String tanggal, String jam) {
        if (tanggal == null || tanggal.isBlank()) return null;
        return jam == null || jam.isBlank() ? tanggal : tanggal + " " + jam;
    }

    /** Nama kurir yang tersimpan di pesanan bisa berupa label; ambil kodenya. */
    private String kodeKurir(String kurir) {
        String k = kurir.trim().toLowerCase();
        if (k.contains("jne")) return "jne";
        if (k.contains("j&t") || k.contains("jnt")) return "jnt";
        if (k.contains("sicepat")) return "sicepat";
        if (k.contains("anteraja")) return "anteraja";
        if (k.contains("tiki")) return "tiki";
        if (k.contains("pos")) return "pos";
        if (k.contains("ninja")) return "ninja";
        if (k.contains("wahana")) return "wahana";
        if (k.contains("lion")) return "lion";
        return k.split("[ -]")[0];
    }
}
