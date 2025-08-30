package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.CartItem;
import com.knit_and_keep.backend.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @GetMapping("/{pelangganId}")
    public ResponseEntity<List<CartItem>> getCartItems(@PathVariable Long pelangganId) {
        List<CartItem> items = cartService.getCartItems(pelangganId);
        return ResponseEntity.ok(items);
    }

    @PostMapping("/add")
    public ResponseEntity<CartItem> addToCart(@RequestBody Map<String, Object> payload) {
        Long pelangganId = Long.parseLong(payload.get("pelangganId").toString());
        Long productId = Long.parseLong(payload.get("productId").toString());
        int quantity = Integer.parseInt(payload.get("quantity").toString());
        
        CartItem newItem = cartService.addProductToCart(pelangganId, productId, quantity);
        return ResponseEntity.ok(newItem);
    }

    /**
     * ✅ ENDPOINT BARU: Untuk memperbarui quantity item (+ dan -).
     * Method: PUT
     * URL: /api/cart/update
     * Body: { "pelangganId": 1, "productId": 123, "quantity": 3 }
     */
    @PutMapping("/update")
    public ResponseEntity<CartItem> updateCartItem(@RequestBody Map<String, Object> payload) {
        Long pelangganId = Long.parseLong(payload.get("pelangganId").toString());
        Long productId = Long.parseLong(payload.get("productId").toString());
        int quantity = Integer.parseInt(payload.get("quantity").toString());

        CartItem updatedItem = cartService.updateItemQuantity(pelangganId, productId, quantity);
        return ResponseEntity.ok(updatedItem);
    }
    
    /**
     * ✅ ENDPOINT BARU: Untuk menghapus satu item dari keranjang (misal, tombol tong sampah).
     * Method: DELETE
     * URL: /api/cart/remove
     * Body: { "pelangganId": 1, "productId": 123 }
     */
    @DeleteMapping("/remove")
    public ResponseEntity<Void> removeCartItem(@RequestBody Map<String, Object> payload) {
        Long pelangganId = Long.parseLong(payload.get("pelangganId").toString());
        Long productId = Long.parseLong(payload.get("productId").toString());

        cartService.removeItemFromCart(pelangganId, productId);
        return ResponseEntity.noContent().build();
    }
}