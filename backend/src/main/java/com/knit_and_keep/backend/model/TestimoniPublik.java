package com.knit_and_keep.backend.model;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Testimoni sebagaimana dilihat pengunjung yang belum masuk.
 *
 * Nama penulis sudah disamarkan di {@link Testimoni}, tetapi nomor pesanan dan
 * id pelanggan yang ikut terbawa membuat penyamaran itu setengah jalan: dua
 * testimoni dengan id pelanggan sama langsung menunjuk orang yang sama, dan
 * nomor pesanan adalah data pembelian yang tidak ada urusannya dengan calon
 * pembeli. Bentuk ini hanya membawa yang memang perlu dibaca.
 */
public record TestimoniPublik(
        Long id,
        Integer rating,
        String ulasan,
        String balasanAdmin,
        String namaPelanggan,
        List<String> barang,
        String gambar,
        LocalDateTime createdAt) {

    public static TestimoniPublik dari(Testimoni t) {
        return new TestimoniPublik(
                t.getId(),
                t.getRating(),
                t.getUlasan(),
                t.getBalasanAdmin(),
                t.getNamaPelangganTersamar(),
                t.getBarang(),
                t.getGambar(),
                t.getCreatedAt());
    }

    public static List<TestimoniPublik> dari(List<Testimoni> daftar) {
        return daftar.stream().map(TestimoniPublik::dari).toList();
    }
}
