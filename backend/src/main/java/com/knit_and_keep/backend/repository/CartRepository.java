package com.knit_and_keep.backend.repository;

import com.knit_and_keep.backend.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<CartItem, Long> {

    @Query("SELECT ci FROM CartItem ci JOIN FETCH ci.product WHERE ci.pelanggan.id = :pelangganId")
    List<CartItem> findByPelangganId(@Param("pelangganId") Long pelangganId);

    Optional<CartItem> findByPelangganIdAndProductId(Long pelangganId, Long productId);

    /** Mengeluarkan sebuah produk dari keranjang siapa pun, dipakai saat produk dihapus. */
    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.product.id = :productId")
    int hapusByProductId(@Param("productId") Long productId);
}
