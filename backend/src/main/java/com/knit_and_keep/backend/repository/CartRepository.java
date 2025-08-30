package com.knit_and_keep.backend.repository;

import com.knit_and_keep.backend.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<CartItem, Long> {
    
    // Mencari semua item di keranjang milik satu pelanggan\
    @Query("SELECT ci FROM CartItem ci JOIN FETCH ci.product WHERE ci.pelanggan.id = :pelangganId")
    List<CartItem> findByPelangganId(Long pelangganId);

    // Mencari item produk spesifik di keranjang pelanggan
    Optional<CartItem> findByPelangganIdAndProductId(Long pelangganId, Long productId);
}