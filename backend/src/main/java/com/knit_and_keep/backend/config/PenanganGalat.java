package com.knit_and_keep.backend.config;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Menerjemahkan galat menjadi jawaban yang bisa dimengerti pengguna.
 *
 * Sebelumnya kesalahan bentuk data dijawab 500 berisi pesan teknis seperti
 * {@code For input string: "[1, 2, 3]"}, yang tampil apa adanya di layar
 * pelanggan. Sekarang setiap jenis galat punya kode dan kalimat yang tepat.
 */
@RestControllerAdvice
public class PenanganGalat {

    /** Galat yang sengaja dilempar layanan, pesannya sudah ditulis untuk pengguna. */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> statusException(ResponseStatusException e) {
        return jawab(HttpStatus.valueOf(e.getStatusCode().value()),
                e.getReason() == null ? "Permintaan tidak bisa diproses" : e.getReason());
    }

    /** Angka yang dikirim bukan angka, tanggal yang bukan tanggal, dan sejenisnya. */
    @ExceptionHandler({MethodArgumentTypeMismatchException.class, NumberFormatException.class})
    public ResponseEntity<Map<String, Object>> salahTipe(Exception e) {
        return jawab(HttpStatus.BAD_REQUEST,
                "Ada isian yang formatnya tidak sesuai. Periksa kembali data yang dikirim.");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> tidakTerbaca(HttpMessageNotReadableException e) {
        return jawab(HttpStatus.BAD_REQUEST, "Data yang dikirim tidak bisa dibaca server.");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> kurangParameter(MissingServletRequestParameterException e) {
        return jawab(HttpStatus.BAD_REQUEST, "Isian " + e.getParameterName() + " wajib diisi.");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> tidakValid(MethodArgumentNotValidException e) {
        String pesan = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(f -> f.getField() + " " + f.getDefaultMessage())
                .orElse("Ada isian yang belum benar.");
        return jawab(HttpStatus.BAD_REQUEST, pesan);
    }

    /** Pelanggaran aturan database, misalnya data masih dipakai di tempat lain. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> bentrokData(DataIntegrityViolationException e) {
        return jawab(HttpStatus.CONFLICT,
                "Data ini masih dipakai di bagian lain, jadi belum bisa diubah atau dihapus.");
    }

    /**
     * Alamat yang tidak ada.
     *
     * Harus ditangani tersendiri, karena jaring terakhir di bawah akan
     * menelannya dan mengubah 404 yang wajar menjadi 500 yang menakutkan.
     */
    @ExceptionHandler({
            org.springframework.web.servlet.NoHandlerFoundException.class,
            org.springframework.web.servlet.resource.NoResourceFoundException.class
    })
    public ResponseEntity<Map<String, Object>> tidakAda(Exception e) {
        return jawab(HttpStatus.NOT_FOUND, "Alamat yang diminta tidak ada.");
    }

    /** Metode yang tidak didukung, misalnya GET pada endpoint yang hanya menerima POST. */
    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> metodeSalah(
            org.springframework.web.HttpRequestMethodNotSupportedException e) {
        return jawab(HttpStatus.METHOD_NOT_ALLOWED,
                "Cara pemanggilan " + e.getMethod() + " tidak didukung untuk alamat ini.");
    }

    /** Jaring terakhir. Pesan aslinya dicatat di log, bukan dikirim ke pengguna. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> galatLain(Exception e) {
        System.err.println("Galat tak tertangani: " + e.getClass().getName() + " — " + e.getMessage());
        e.printStackTrace();
        return jawab(HttpStatus.INTERNAL_SERVER_ERROR,
                "Terjadi gangguan di server. Coba lagi sebentar lagi.");
    }

    private ResponseEntity<Map<String, Object>> jawab(HttpStatus status, String pesan) {
        Map<String, Object> badan = new LinkedHashMap<>();
        badan.put("timestamp", LocalDateTime.now().toString());
        badan.put("status", status.value());
        badan.put("message", pesan);
        return ResponseEntity.status(status).body(badan);
    }
}
