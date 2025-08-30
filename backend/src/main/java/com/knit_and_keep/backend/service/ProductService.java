package com.knit_and_keep.backend.service;


import com.knit_and_keep.backend.model.Product;
import com.knit_and_keep.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Sort;    

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    // READ: Mendapatkan semua produk atau mencari berdasarkan keyword
     public List<Product> getAllProducts(String search, String sort) {
        Sort sorting = Sort.unsorted(); // Default: tidak disortir
        
        if ("newest".equalsIgnoreCase(sort)) {
            // Jika frontend meminta 'newest', sortir berdasarkan 'id' secara menurun
            sorting = Sort.by(Sort.Direction.DESC, "id");
        }
        
        if (search != null && !search.isEmpty()) {
            // Pencarian tetap didukung, namun tanpa sortir untuk menjaga kesederhanaan
            // Jika ingin keduanya, logika perlu digabungkan lebih lanjut
            return productRepository.findBySkuContainingIgnoreCaseOrNameContainingIgnoreCase(search, search);
        }
        
        // Mengembalikan semua produk dengan aturan sortir yang telah ditentukan
        return productRepository.findAll(sorting);
    }

    // CREATE: Menyimpan produk baru
    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    // UPDATE: Memperbarui produk yang ada
    public Optional<Product> updateProduct(Long id, Product productDetails) {
        // Cari produk berdasarkan ID
        return productRepository.findById(id).map(existingProduct -> {
            // Update field dari produk yang sudah ada
            existingProduct.setSku(productDetails.getSku());
            existingProduct.setName(productDetails.getName());
            existingProduct.setCategory(productDetails.getCategory());
            existingProduct.setSize(productDetails.getSize());
            existingProduct.setColor(productDetails.getColor());
            existingProduct.setCostPrice(productDetails.getCostPrice());
            existingProduct.setSellPrice(productDetails.getSellPrice());
            existingProduct.setStock(productDetails.getStock());
            existingProduct.setSupplier(productDetails.getSupplier());
            existingProduct.setImage(productDetails.getImage());
            // Simpan perubahan ke database
            return productRepository.save(existingProduct);
        });
    }

    // DELETE: Menghapus produk berdasarkan ID
    public boolean deleteProduct(Long id) {
        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            return true; // Berhasil dihapus
        }
        return false; // Gagal karena produk tidak ditemukan
    }
}