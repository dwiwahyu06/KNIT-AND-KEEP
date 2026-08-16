package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.CartItem;
import com.knit_and_keep.backend.security.Sesi;
import com.knit_and_keep.backend.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Keranjang belanja.
 *
 * Pemilik keranjang selalu diambil dari token, bukan dari isi permintaan,
 * supaya tidak ada yang bisa mengubah keranjang orang lain dengan menukar
 * nomor pelanggan.
 */
@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "http://localhost:5173")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/{pelangganId}")
    public ResponseEntity<List<CartItem>> isi(@PathVariable Long pelangganId) {
        Sesi.wajibPemilik(pelangganId);
        return ResponseEntity.ok(cartService.getCartItems(pelangganId));
    }

    @PostMapping("/add")
    public ResponseEntity<CartItem> tambah(@RequestBody Map<String, Object> payload) {
        Long pelangganId = pemilik(payload);
        Long productId = Long.parseLong(payload.get("productId").toString());
        int quantity = Integer.parseInt(payload.get("quantity").toString());
        return ResponseEntity.ok(cartService.addProductToCart(pelangganId, productId, quantity));
    }

    @PutMapping("/update")
    public ResponseEntity<CartItem> ubah(@RequestBody Map<String, Object> payload) {
        Long pelangganId = pemilik(payload);
        Long productId = Long.parseLong(payload.get("productId").toString());
        int quantity = Integer.parseInt(payload.get("quantity").toString());
        return ResponseEntity.ok(cartService.updateItemQuantity(pelangganId, productId, quantity));
    }

    @DeleteMapping("/remove")
    public ResponseEntity<Void> hapus(@RequestBody Map<String, Object> payload) {
        Long pelangganId = pemilik(payload);
        Long productId = Long.parseLong(payload.get("productId").toString());
        cartService.removeItemFromCart(pelangganId, productId);
        return ResponseEntity.noContent().build();
    }

    /** Admin boleh menyebut pelanggan lain; pelanggan selalu dirinya sendiri. */
    private Long pemilik(Map<String, Object> payload) {
        Sesi.Pengguna pengguna = Sesi.wajibMasuk();
        if (pengguna.admin() && payload.get("pelangganId") != null) {
            return Long.parseLong(payload.get("pelangganId").toString());
        }
        return pengguna.id();
    }
}
