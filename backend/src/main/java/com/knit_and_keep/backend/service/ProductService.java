package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.MutasiStok;
import com.knit_and_keep.backend.model.Product;
import com.knit_and_keep.backend.repository.CartRepository;
import com.knit_and_keep.backend.repository.ProductRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Produk adalah satu-satunya sumber kebenaran untuk barang dan stok.
 * Halaman Barang, Stok, Kasir, dan Katalog semuanya membaca dari sini.
 */
@Service
public class ProductService {

    /** Ambang batas stok menipis, dipakai dashboard dan halaman stok. */
    public static final int AMBANG_STOK_MENIPIS = 3;

    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final StokService stokService;
    private final PenyimpananBerkas penyimpananBerkas;

    public ProductService(ProductRepository productRepository,
                          CartRepository cartRepository,
                          StokService stokService,
                          PenyimpananBerkas penyimpananBerkas) {
        this.productRepository = productRepository;
        this.cartRepository = cartRepository;
        this.stokService = stokService;
        this.penyimpananBerkas = penyimpananBerkas;
    }

    public List<Product> getAllProducts(String search, String sort) {
        List<Product> hasil;

        if (search != null && !search.isBlank()) {
            hasil = productRepository
                    .findBySkuContainingIgnoreCaseOrNameContainingIgnoreCase(search, search);
        } else {
            hasil = productRepository.findAll();
        }

        Comparator<Product> urutan = switch (sort == null ? "" : sort.toLowerCase()) {
            case "termurah" -> Comparator.comparingDouble(
                    (Product p) -> p.getSellPrice() == null ? 0.0 : p.getSellPrice());
            case "termahal" -> Comparator.comparingDouble(
                    (Product p) -> p.getSellPrice() == null ? 0.0 : p.getSellPrice()).reversed();
            case "stok" -> Comparator.comparingInt(
                    (Product p) -> p.getStock() == null ? 0 : p.getStock());
            case "nama" -> Comparator.comparing(
                    (Product p) -> p.getName() == null ? "" : p.getName().toLowerCase());
            default -> Comparator.comparing(
                    (Product p) -> p.getId() == null ? 0L : p.getId(), Comparator.reverseOrder());
        };

        return hasil.stream().sorted(urutan).toList();
    }

    public List<Product> stokMenipis() {
        return productRepository.findAll(Sort.by("stock")).stream()
                .filter(p -> (p.getStock() == null ? 0 : p.getStock()) <= AMBANG_STOK_MENIPIS)
                .toList();
    }

    public List<String> daftarKategori() {
        return productRepository.findAll().stream()
                .map(Product::getCategory)
                .filter(c -> c != null && !c.isBlank())
                .distinct()
                .sorted()
                .toList();
    }

    public Optional<Product> cari(Long id) {
        return productRepository.findById(id);
    }

    // ==================== TULIS ====================

    @Transactional
    public Product createProduct(Product product) {
        periksa(product);
        if (product.getStock() == null) product.setStock(0);
        if (product.getCostPrice() == null) product.setCostPrice(0.0);
        if (product.getSellPrice() == null) product.setSellPrice(0.0);
        if (product.getSku() == null || product.getSku().isBlank()) {
            product.setSku("KNK-" + System.currentTimeMillis());
        }
        // Foto yang diunggah dari perangkat datang sebagai data URI. Yang
        // disimpan di kolom ini hanya alamat berkasnya — isi fotonya sendiri
        // tidak akan muat, dan membuat setiap baris produk membengkak.
        product.setImage(penyimpananBerkas.simpanDataUri(product.getImage(), "produk"));
        return productRepository.save(product);
    }

    @Transactional
    public Optional<Product> updateProduct(Long id, Product detail) {
        periksa(detail);
        return productRepository.findById(id).map(existing -> {
            int stokLama = existing.getStock() == null ? 0 : existing.getStock();
            int stokBaru = detail.getStock() == null ? stokLama : detail.getStock();

            existing.setSku(detail.getSku());
            existing.setName(detail.getName());
            existing.setCategory(detail.getCategory());
            existing.setSize(detail.getSize());
            existing.setColor(detail.getColor());
            existing.setCostPrice(detail.getCostPrice());
            existing.setSellPrice(detail.getSellPrice());
            existing.setSupplier(detail.getSupplier());

            // Foto baru disimpan sebagai berkas dulu, lalu berkas lama dibuang
            // supaya folder unggahan tidak menumpuk foto yang tidak dipakai.
            String fotoLama = existing.getImage();
            String fotoBaru = penyimpananBerkas.simpanDataUri(detail.getImage(), "produk");
            existing.setImage(fotoBaru);
            if (fotoLama != null && !fotoLama.equals(fotoBaru)) {
                penyimpananBerkas.hapusJikaMilikSendiri(fotoLama);
            }

            existing.setDeskripsi(detail.getDeskripsi());
            existing.setKondisi(detail.getKondisi());
            if (detail.getWeight() != null) existing.setWeight(detail.getWeight());

            // Stok yang diubah lewat formulir produk tetap dicatat di kartu stok,
            // supaya tidak ada perubahan jumlah barang yang tanpa jejak.
            existing.setStock(stokLama);
            Product tersimpan = productRepository.save(existing);

            int selisih = stokBaru - stokLama;
            if (selisih > 0) {
                stokService.tambah(id, selisih, null, MutasiStok.PENYESUAIAN,
                        null, "Disesuaikan lewat formulir produk", "ADMIN");
            } else if (selisih < 0) {
                stokService.kurangi(id, -selisih, MutasiStok.PENYESUAIAN,
                        null, "Disesuaikan lewat formulir produk", "ADMIN");
            }
            return productRepository.findById(id).orElse(tersimpan);
        });
    }

    @Transactional
    public Product tambahStok(Long id, int qty, Double hargaBeli, String catatan) {
        return stokService.tambah(id, qty, hargaBeli, MutasiStok.PEMBELIAN, null,
                catatan == null || catatan.isBlank() ? "Barang masuk" : catatan, "ADMIN");
    }

    @Transactional
    public Product kurangiStok(Long id, int qty, String alasan) {
        return stokService.kurangi(id, qty, MutasiStok.PENYESUAIAN, null,
                alasan == null || alasan.isBlank() ? "Barang keluar" : alasan, "ADMIN");
    }

    /**
     * Menghapus produk sekaligus mengeluarkannya dari keranjang siapa pun yang
     * masih menyimpannya.
     *
     * Sebelumnya penghapusan langsung ditolak database dengan galat mentah,
     * karena keranjang masih menunjuk ke produk itu. Riwayat penjualan tetap
     * aman: rincian pesanan menyimpan salinan nama dan harganya sendiri.
     */
    @Transactional
    public int deleteProduct(Long id) {
        Product produk = productRepository.findById(id).orElse(null);
        if (produk == null) return -1;

        String foto = produk.getImage();
        int dikeluarkan = cartRepository.hapusByProductId(id);
        productRepository.deleteById(id);
        penyimpananBerkas.hapusJikaMilikSendiri(foto);
        return dikeluarkan;
    }

    private void periksa(Product p) {
        if (p.getName() == null || p.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nama produk wajib diisi");
        }
        if (p.getCostPrice() != null && p.getCostPrice() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Harga modal tidak boleh negatif");
        }
        if (p.getSellPrice() != null && p.getSellPrice() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Harga jual tidak boleh negatif");
        }
        if (p.getStock() != null && p.getStock() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stok tidak boleh negatif");
        }
        if (p.getWeight() != null && p.getWeight() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Berat tidak boleh negatif");
        }
    }
}
