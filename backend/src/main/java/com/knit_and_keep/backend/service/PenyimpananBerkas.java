package com.knit_and_keep.backend.service;

import jakarta.annotation.PostConstruct;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.*;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;

/**
 * Menyimpan gambar yang diunggah sebagai berkas di disk.
 *
 * <p>Sebelumnya foto bukti komplain disimpan utuh sebagai teks data URI di
 * dalam kolom database. Satu foto ponsel bisa menambah ratusan kilobyte ke
 * setiap baris, membuat tabelnya membengkak dan pencadangan jadi berat —
 * padahal isinya tidak pernah dicari maupun disaring.
 *
 * <p>Sekarang yang tersimpan di database hanya alamat berkasnya.
 *
 * <p>Tempat simpannya ada dua. Bila SUPABASE_URL dan SUPABASE_SERVICE_KEY diisi,
 * gambar dikirim ke Supabase Storage — dipakai di hosting gratis yang disknya
 * hilang setiap kali aplikasi dimulai ulang. Bila tidak diisi, gambar disimpan
 * di folder lokal seperti biasa.
 */
@Service
public class PenyimpananBerkas {

    /** Batas ukuran satu gambar. Lebih dari ini biasanya foto mentah tanpa dikecilkan. */
    private static final int BATAS_BYTE = 3 * 1024 * 1024;

    @Value("${app.unggahan.folder}")
    private String folder;

    @Value("${app.unggahan.url-publik}")
    private String urlPublik;

    @Value("${app.supabase.url:}")
    private String supabaseUrl;

    @Value("${app.supabase.service-key:}")
    private String supabaseKunci;

    @Value("${app.supabase.bucket:unggahan}")
    private String supabaseBucket;

    private final OkHttpClient http;

    private Path akar;

    public PenyimpananBerkas(OkHttpClient http) {
        this.http = http;
    }

    private boolean pakaiSupabase() {
        return !supabaseUrl.isBlank() && !supabaseKunci.isBlank();
    }

    /** Alamat objek di Supabase, dipakai untuk mengunggah dan menghapus. */
    private String alamatObjek(String nama) {
        return supabaseUrl + "/storage/v1/object/" + supabaseBucket + "/" + nama;
    }

    /** Awalan alamat publik yang bisa dibuka peramban tanpa kunci. */
    private String awalanPublikSupabase() {
        return supabaseUrl + "/storage/v1/object/public/" + supabaseBucket + "/";
    }

    @PostConstruct
    void siapkan() {
        supabaseUrl = supabaseUrl.strip().replaceAll("/+$", "");
        if (pakaiSupabase()) {
            System.out.println(">> Gambar disimpan di Supabase Storage, bucket: " + supabaseBucket);
            return;
        }
        try {
            akar = Paths.get(folder).toAbsolutePath().normalize();
            Files.createDirectories(akar);
            System.out.println(">> Folder unggahan: " + akar);
        } catch (IOException e) {
            throw new IllegalStateException("Tidak bisa menyiapkan folder unggahan: " + e.getMessage(), e);
        }
    }

    /**
     * Menerima gambar dalam bentuk data URI dari peramban lalu menyimpannya
     * sebagai berkas. Nilai yang bukan data URI dikembalikan apa adanya,
     * sehingga tautan gambar dari luar tetap bisa dipakai.
     *
     * @return alamat yang bisa dibuka peramban, misalnya /unggahan/abc.jpg
     */
    public String simpanDataUri(String dataUri, String awalan) {
        if (dataUri == null || dataUri.isBlank()) return null;
        if (!dataUri.startsWith("data:")) return dataUri;

        int pemisah = dataUri.indexOf(",");
        if (pemisah < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Format gambar tidak dikenali.");
        }

        String kepala = dataUri.substring(5, pemisah).toLowerCase(Locale.ROOT);
        if (!kepala.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Berkas yang diunggah harus berupa gambar.");
        }

        byte[] isi;
        try {
            isi = Base64.getDecoder().decode(dataUri.substring(pemisah + 1));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gambar tidak bisa dibaca.");
        }
        if (isi.length > BATAS_BYTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ukuran gambar melebihi 3 MB. Kecilkan dulu sebelum diunggah.");
        }

        String ekstensi = switch (kepala.split(";")[0]) {
            case "image/png"  -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif"  -> ".gif";
            default           -> ".jpg";
        };

        String nama = awalan + "-" + UUID.randomUUID().toString().substring(0, 12) + ekstensi;
        if (pakaiSupabase()) {
            unggahKeSupabase(nama, isi, kepala.split(";")[0]);
            return awalanPublikSupabase() + nama;
        }
        try {
            Files.write(akar.resolve(nama), isi, StandardOpenOption.CREATE_NEW);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Gambar gagal disimpan di server.");
        }
        return urlPublik + "/" + nama;
    }

    /**
     * Membuang berkas lama setelah digantikan yang baru.
     *
     * <p>Tanpa ini, setiap kali foto produk diganti berkas lamanya tetap
     * tertinggal di disk selamanya — dan folder unggahan tumbuh tanpa ada yang
     * memakainya.
     *
     * <p>Tautan gambar dari luar diabaikan, dan nama berkas yang mengandung
     * pemisah folder ditolak supaya permintaan tidak bisa menghapus berkas di
     * luar folder unggahan.
     */
    public void hapusJikaMilikSendiri(String url) {
        if (url != null && pakaiSupabase() && url.startsWith(awalanPublikSupabase())) {
            hapusDariSupabase(url.substring(awalanPublikSupabase().length()));
            return;
        }
        if (url == null || url.isBlank() || !url.startsWith(urlPublik + "/")) return;

        String nama = url.substring(urlPublik.length() + 1);
        if (nama.isBlank() || nama.contains("/") || nama.contains("\\") || nama.contains("..")) return;

        try {
            Files.deleteIfExists(akar.resolve(nama));
        } catch (IOException e) {
            // Berkas yatim tidak merusak apa pun, jadi tidak perlu menggagalkan
            // penyimpanan produk hanya karena ini.
            System.err.println("Berkas lama gagal dihapus: " + nama + " — " + e.getMessage());
        }
    }

    private void unggahKeSupabase(String nama, byte[] isi, String jenis) {
        Request permintaan = new Request.Builder()
                .url(alamatObjek(nama))
                .header("Authorization", "Bearer " + supabaseKunci)
                .header("apikey", supabaseKunci)
                .header("Cache-Control", "max-age=2592000")
                .post(RequestBody.create(isi, MediaType.get(jenis)))
                .build();
        try (Response jawaban = http.newCall(permintaan).execute()) {
            if (!jawaban.isSuccessful()) {
                String alasan = jawaban.body() != null ? jawaban.body().string() : "";
                System.err.println("Unggah ke Supabase ditolak (" + jawaban.code() + "): " + alasan);
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Gambar gagal disimpan di server.");
            }
        } catch (IOException e) {
            System.err.println("Supabase tidak bisa dihubungi: " + e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Gambar gagal disimpan di server.");
        }
    }

    private void hapusDariSupabase(String nama) {
        if (nama.isBlank() || nama.contains("/") || nama.contains("\\") || nama.contains("..")) return;
        Request permintaan = new Request.Builder()
                .url(alamatObjek(nama))
                .header("Authorization", "Bearer " + supabaseKunci)
                .header("apikey", supabaseKunci)
                .delete()
                .build();
        try (Response ignored = http.newCall(permintaan).execute()) {
            // Sama seperti di disk: berkas yatim tidak merusak apa pun.
        } catch (IOException e) {
            System.err.println("Berkas lama gagal dihapus dari Supabase: " + nama + " — " + e.getMessage());
        }
    }
}
