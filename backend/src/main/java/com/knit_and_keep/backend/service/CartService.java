package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.CartItem;
import com.knit_and_keep.backend.model.Product;
import com.knit_and_keep.backend.model.UserPelanggan;
import com.knit_and_keep.backend.repository.CartRepository;
import com.knit_and_keep.backend.repository.ProductRepository;
import com.knit_and_keep.backend.repository.UserPelangganRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Keranjang belanja.
 *
 * Jumlah yang diminta selalu diperiksa terhadap stok di sini, bukan hanya di
 * tampilan. Sebelumnya permintaan langsung ke backend bisa memasukkan 10.000
 * unit untuk barang yang stoknya 10.
 */
@Service
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserPelangganRepository userPelangganRepository;

    public CartService(CartRepository cartRepository,
                       ProductRepository productRepository,
                       UserPelangganRepository userPelangganRepository) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.userPelangganRepository = userPelangganRepository;
    }

    public List<CartItem> getCartItems(Long pelangganId) {
        return cartRepository.findByPelangganId(pelangganId);
    }

    @Transactional
    public CartItem addProductToCart(Long pelangganId, Long productId, int quantity) {
        if (quantity <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Jumlah harus lebih dari nol");
        }

        Product produk = ambilProduk(productId);
        CartItem item = cartRepository.findByPelangganIdAndProductId(pelangganId, productId)
                .orElse(null);

        int jumlahBaru = (item == null ? 0 : item.getQuantity()) + quantity;
        periksaStok(produk, jumlahBaru);

        if (item == null) {
            UserPelanggan pelanggan = userPelangganRepository.findById(pelangganId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pelanggan tidak ditemukan"));
            item = new CartItem();
            item.setProduct(produk);
            item.setPelanggan(pelanggan);
        }
        item.setQuantity(jumlahBaru);
        return cartRepository.save(item);
    }

    @Transactional
    public CartItem updateItemQuantity(Long pelangganId, Long productId, int jumlahBaru) {
        CartItem item = cartRepository.findByPelangganIdAndProductId(pelangganId, productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Barang ini tidak ada di keranjang Anda"));

        if (jumlahBaru <= 0) {
            cartRepository.delete(item);
            return null;
        }

        periksaStok(ambilProduk(productId), jumlahBaru);
        item.setQuantity(jumlahBaru);
        return cartRepository.save(item);
    }

    @Transactional
    public void removeItemFromCart(Long pelangganId, Long productId) {
        cartRepository.findByPelangganIdAndProductId(pelangganId, productId)
                .ifPresent(cartRepository::delete);
    }

    private Product ambilProduk(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produk tidak ditemukan"));
    }

    private void periksaStok(Product produk, int diminta) {
        int tersedia = produk.getStock() == null ? 0 : produk.getStock();
        if (tersedia == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    produk.getName() + " sedang habis.");
        }
        if (diminta > tersedia) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Stok " + produk.getName() + " tinggal " + tersedia + " unit.");
        }
    }
}
