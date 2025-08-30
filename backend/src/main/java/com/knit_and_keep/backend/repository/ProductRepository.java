package com.knit_and_keep.backend.repository;


import com.knit_and_keep.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * Metode ini akan mencari produk berdasarkan SKU atau Nama.
     * Spring Data JPA akan otomatis membuat query SQL dari nama metode ini.
     * "ContainingIgnoreCase" berarti pencarian tidak case-sensitive (tidak peduli huruf besar/kecil)
     * dan menggunakan klausa LIKE '%search%'.
     */
    List<Product> findBySkuContainingIgnoreCaseOrNameContainingIgnoreCase(String sku, String name);
}