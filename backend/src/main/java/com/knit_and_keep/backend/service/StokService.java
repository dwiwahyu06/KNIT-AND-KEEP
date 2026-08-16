package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.MutasiStok;
import com.knit_and_keep.backend.model.Product;
import com.knit_and_keep.backend.repository.MutasiStokRepository;
import com.knit_and_keep.backend.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Satu-satunya pintu untuk mengubah jumlah stok.
 *
 * <p>Dua hal yang dijamin di sini:
 *
 * <p><b>Tidak ada stok yang terjual dua kali.</b> Baris produk dikunci di
 * database sebelum diperiksa dan dikurangi. Sebelumnya pemeriksaan dan
 * pengurangan berjalan tanpa kunci, sehingga empat pembeli yang menekan bayar
 * bersamaan semuanya lolos untuk satu barang yang sama.
 *
 * <p><b>Setiap perubahan meninggalkan jejak.</b> Setiap penambahan dan
 * pengurangan tercatat di kartu stok berikut stok sebelum dan sesudahnya.
 */
@Service
public class StokService {

    private final ProductRepository productRepository;
    private final MutasiStokRepository mutasiRepository;

    public StokService(ProductRepository productRepository, MutasiStokRepository mutasiRepository) {
        this.productRepository = productRepository;
        this.mutasiRepository = mutasiRepository;
    }

    /**
     * Mengurangi stok setelah memastikan jumlahnya cukup.
     *
     * Wajib dipanggil dari dalam sebuah transaksi database, karena kuncinya
     * baru dilepas saat transaksi itu selesai.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public Product kurangi(Long productId, int qty, String jenis, String referensi,
                           String catatan, String oleh) {
        if (qty <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jumlah harus lebih dari nol");
        }

        Product produk = productRepository.kunciUntukPerubahan(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Produk id " + productId + " tidak ditemukan"));

        int sebelum = produk.getStock() == null ? 0 : produk.getStock();
        if (sebelum < qty) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Stok " + produk.getName() + " tinggal " + sebelum
                            + ", tidak cukup untuk " + qty + " unit.");
        }

        produk.setStock(sebelum - qty);
        productRepository.save(produk);
        catat(produk, jenis, -qty, sebelum, produk.getStock(), referensi, catatan, oleh);
        return produk;
    }

    /**
     * Menambah stok. Bila harga beli diisi, harga modal dihitung ulang sebagai
     * rata-rata tertimbang supaya HPP tetap masuk akal saat harga beli berubah.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public Product tambah(Long productId, int qty, Double hargaBeli, String jenis,
                          String referensi, String catatan, String oleh) {
        if (qty <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jumlah harus lebih dari nol");
        }

        Product produk = productRepository.kunciUntukPerubahan(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Produk id " + productId + " tidak ditemukan"));

        int sebelum = produk.getStock() == null ? 0 : produk.getStock();
        double modalLama = produk.getCostPrice() == null ? 0.0 : produk.getCostPrice();

        if (hargaBeli != null && hargaBeli > 0) {
            double totalNilai = (sebelum * modalLama) + (qty * hargaBeli);
            int totalQty = sebelum + qty;
            produk.setCostPrice(totalQty == 0 ? hargaBeli : totalNilai / totalQty);
        }

        produk.setStock(sebelum + qty);
        productRepository.save(produk);

        String keterangan = catatan;
        if (hargaBeli != null && hargaBeli > 0) {
            keterangan = (catatan == null || catatan.isBlank() ? "" : catatan + " · ")
                    + "harga beli " + rupiah(hargaBeli)
                    + ", HPP jadi " + rupiah(produk.getCostPrice());
        }
        catat(produk, jenis, qty, sebelum, produk.getStock(), referensi, keterangan, oleh);
        return produk;
    }

    // ==================== KARTU STOK ====================

    public List<MutasiStok> kartuStok(Long productId, String jenis,
                                      LocalDateTime dari, LocalDateTime sampai) {
        return mutasiRepository.cari(
                productId == null ? -1L : productId,
                jenis == null || jenis.isBlank() ? "" : jenis,
                dari == null ? LocalDateTime.of(2000, 1, 1, 0, 0) : dari,
                sampai == null ? LocalDateTime.now().plusYears(50) : sampai);
    }

    private void catat(Product produk, String jenis, int perubahan, int sebelum, int sesudah,
                       String referensi, String catatan, String oleh) {
        MutasiStok m = new MutasiStok();
        m.setProductId(produk.getId());
        m.setNamaProduk(produk.getName());
        m.setSku(produk.getSku());
        m.setJenis(jenis);
        m.setPerubahan(perubahan);
        m.setStokSebelum(sebelum);
        m.setStokSesudah(sesudah);
        m.setReferensi(referensi);
        m.setCatatan(catatan);
        m.setOleh(oleh == null ? "SISTEM" : oleh);
        m.setWaktu(LocalDateTime.now());
        mutasiRepository.save(m);
    }

    private String rupiah(double nilai) {
        return "Rp " + String.format("%,.0f", nilai).replace(',', '.');
    }
}
