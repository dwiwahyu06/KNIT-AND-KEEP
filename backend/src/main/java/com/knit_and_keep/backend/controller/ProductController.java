package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.MutasiStok;
import com.knit_and_keep.backend.model.Product;
import com.knit_and_keep.backend.service.ProductService;
import com.knit_and_keep.backend.service.StokService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final StokService stokService;

    public ProductController(ProductService productService, StokService stokService) {
        this.productService = productService;
        this.stokService = stokService;
    }

    @GetMapping
    public List<Product> semua(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sort) {
        return productService.getAllProducts(search, sort);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> detail(@PathVariable Long id) {
        return productService.cari(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Produk yang stoknya sudah menipis, dipakai dashboard dan halaman stok. */
    @GetMapping("/stok-menipis")
    public List<Product> stokMenipis() {
        return productService.stokMenipis();
    }

    /** Kategori yang benar-benar ada, untuk mengisi filter di katalog. */
    @GetMapping("/kategori")
    public List<String> kategori() {
        return productService.daftarKategori();
    }

    /** Kartu stok: seluruh perubahan jumlah barang beserta penyebabnya. */
    @GetMapping("/mutasi")
    public List<MutasiStok> kartuStok(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String jenis,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dari,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate sampai) {

        LocalDateTime awal = dari == null ? null : dari.atStartOfDay();
        LocalDateTime akhir = sampai == null ? null : sampai.atTime(23, 59, 59);
        return stokService.kartuStok(productId, jenis, awal, akhir);
    }

    @PostMapping
    public ResponseEntity<Product> buat(@RequestBody Product product) {
        return new ResponseEntity<>(productService.createProduct(product), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> ubah(@PathVariable Long id, @RequestBody Product detail) {
        return productService.updateProduct(id, detail)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Barang masuk. Harga beli baru ikut memperbarui HPP rata-rata. */
    @PostMapping("/{id}/stok/tambah")
    public ResponseEntity<Product> tambahStok(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        int qty = Integer.parseInt(String.valueOf(payload.getOrDefault("qty", 0)));
        Double hargaBeli = payload.get("hargaBeli") == null
                ? null : Double.parseDouble(payload.get("hargaBeli").toString());
        String catatan = (String) payload.get("catatan");
        return ResponseEntity.ok(productService.tambahStok(id, qty, hargaBeli, catatan));
    }

    /** Barang keluar di luar penjualan, misalnya rusak atau hilang. */
    @PostMapping("/{id}/stok/kurangi")
    public ResponseEntity<Product> kurangiStok(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        int qty = Integer.parseInt(String.valueOf(payload.getOrDefault("qty", 0)));
        String alasan = (String) payload.get("alasan");
        return ResponseEntity.ok(productService.kurangiStok(id, qty, alasan));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> hapus(@PathVariable Long id) {
        int dikeluarkan = productService.deleteProduct(id);
        if (dikeluarkan < 0) return ResponseEntity.notFound().build();

        return ResponseEntity.ok(Map.of(
                "pesan", dikeluarkan == 0
                        ? "Produk dihapus."
                        : "Produk dihapus dan dikeluarkan dari " + dikeluarkan + " keranjang pelanggan.",
                "keranjangTerdampak", dikeluarkan));
    }
}
