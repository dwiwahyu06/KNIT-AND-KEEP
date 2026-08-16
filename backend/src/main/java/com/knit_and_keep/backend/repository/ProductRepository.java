package com.knit_and_keep.backend.repository;

import com.knit_and_keep.backend.model.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findBySkuContainingIgnoreCaseOrNameContainingIgnoreCase(String sku, String name);

    /**
     * Mengambil produk sekaligus mengunci barisnya sampai transaksi selesai.
     *
     * Inilah yang mencegah dua pembeli lolos bersamaan untuk stok terakhir:
     * pembeli kedua menunggu sampai pengurangan stok pembeli pertama tersimpan,
     * baru kemudian membaca sisa stok yang sebenarnya.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> kunciUntukPerubahan(@Param("id") Long id);
}
