package com.knit_and_keep.backend.controller;


import com.knit_and_keep.backend.model.Product;
import com.knit_and_keep.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Mengizinkan request dari frontend React yang berjalan di localhost:3000
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/products") // Base URL untuk semua endpoint di controller ini
public class ProductController {

    @Autowired
    private ProductService productService;

    // Endpoint untuk GET /api/products (dan GET /api/products?search=...)
     @GetMapping
    public List<Product> getAllProducts(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String sort // <-- Tambahkan parameter ini
    ) {
        return productService.getAllProducts(search, sort);
    }

    // Endpoint untuk POST /api/products
    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        Product newProduct = productService.createProduct(product);
        return new ResponseEntity<>(newProduct, HttpStatus.CREATED);
    }

    // Endpoint untuk PUT /api/products/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        return productService.updateProduct(id, productDetails)
                .map(product -> new ResponseEntity<>(product, HttpStatus.OK)) // Jika berhasil, kembalikan 200 OK
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND)); // Jika tidak ditemukan, kembalikan 404 Not Found
    }

    // Endpoint untuk DELETE /api/products/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<HttpStatus> deleteProduct(@PathVariable Long id) {
        if (productService.deleteProduct(id)) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT); // Berhasil, kembalikan 204 No Content
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // Gagal, kembalikan 404 Not Found
        }
    }
}