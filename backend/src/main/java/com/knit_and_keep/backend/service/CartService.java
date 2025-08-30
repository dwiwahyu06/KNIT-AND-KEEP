package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.CartItem;
import com.knit_and_keep.backend.model.Product;
import com.knit_and_keep.backend.model.UserPelanggan;
import com.knit_and_keep.backend.repository.CartRepository;
import com.knit_and_keep.backend.repository.ProductRepository;
import com.knit_and_keep.backend.repository.UserPelangganRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private UserPelangganRepository userPelangganRepository;

    public List<CartItem> getCartItems(Long pelangganId) {
        return cartRepository.findByPelangganId(pelangganId);
    }

    @Transactional
    public CartItem addProductToCart(Long pelangganId, Long productId, int quantity) {
        CartItem cartItem = cartRepository.findByPelangganIdAndProductId(pelangganId, productId)
            .orElse(new CartItem());

        if (cartItem.getId() == null) {
            Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produk tidak ditemukan"));
            UserPelanggan pelanggan = userPelangganRepository.findById(pelangganId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pelanggan tidak ditemukan"));
            
            cartItem.setProduct(product);
            cartItem.setPelanggan(pelanggan);
            cartItem.setQuantity(quantity);
        } else {
            cartItem.setQuantity(cartItem.getQuantity() + quantity);
        }

        return cartRepository.save(cartItem);
    }

    /**
     * ✅ FUNGSI BARU: Memperbarui jumlah item di keranjang.
     * Jika jumlah menjadi 0 atau kurang, item akan dihapus.
     */
    @Transactional
    public CartItem updateItemQuantity(Long pelangganId, Long productId, int newQuantity) {
        CartItem cartItem = cartRepository.findByPelangganIdAndProductId(pelangganId, productId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item tidak ditemukan di keranjang"));

        if (newQuantity <= 0) {
            // Jika quantity 0 atau kurang, hapus item dari keranjang
            cartRepository.delete(cartItem);
            return null; // Mengindikasikan item telah dihapus
        } else {
            // Di sini Anda bisa menambahkan validasi stok jika perlu
            // if (newQuantity > cartItem.getProduct().getStock()) {
            //     throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stok tidak mencukupi");
            // }
            cartItem.setQuantity(newQuantity);
            return cartRepository.save(cartItem);
        }
    }

    /**
     * ✅ FUNGSI BARU: Menghapus satu item sepenuhnya dari keranjang.
     */
    public void removeItemFromCart(Long pelangganId, Long productId) {
        CartItem cartItem = cartRepository.findByPelangganIdAndProductId(pelangganId, productId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item tidak ditemukan di keranjang"));
        
        cartRepository.delete(cartItem);
    }
}