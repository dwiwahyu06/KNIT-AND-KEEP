package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.UserPelanggan;
import com.knit_and_keep.backend.service.UserPelangganService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/pelanggan")
@CrossOrigin(origins = "http://localhost:5173")
public class UserPelangganController {

    @Autowired
    private UserPelangganService userService;

    @PostMapping("/register")
public ResponseEntity<?> register(@RequestBody UserPelanggan user) {
    Map<String, Object> response = new HashMap<>();
    try {
        UserPelanggan newUser = userService.register(user);
        response.put("success", true);
        response.put("message", "Registrasi berhasil!");
        response.put("user", newUser);
        return ResponseEntity.ok(response);
    } catch (RuntimeException e) {
        response.put("success", false);
        response.put("message", e.getMessage());
        return ResponseEntity.badRequest().body(response);
    }
}

@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
    Map<String, Object> response = new HashMap<>();
    try {
        String username = payload.get("username");
        String password = payload.get("password");
        UserPelanggan dbUser = userService.login(username, password);
        response.put("success", true);
        response.put("message", "Login berhasil!");
        response.put("user", dbUser);
        return ResponseEntity.ok(response);
    } catch (RuntimeException e) {
        response.put("success", false);
        response.put("message", e.getMessage());
        return ResponseEntity.badRequest().body(response);
    }
}

// UPDATE PROFIL
@PutMapping("/update/{id}")
public ResponseEntity<?> updateProfile(
        @PathVariable Long id,
        @RequestBody Map<String, String> payload) {

    Map<String, Object> response = new HashMap<>();
    try {
        String username = payload.get("username");
        String email = payload.get("email");

        UserPelanggan updatedUser = userService.updateProfile(id, username, email);

        response.put("success", true);
        response.put("message", "Profil berhasil diperbarui!");
        response.put("user", updatedUser);
        return ResponseEntity.ok(response);

    } catch (RuntimeException e) {
        response.put("success", false);
        response.put("message", e.getMessage());
        return ResponseEntity.badRequest().body(response);
    }
}

// UPDATE PASSWORD
@PutMapping("/update-password/{id}")
public ResponseEntity<?> updatePassword(
        @PathVariable Long id,
        @RequestBody Map<String, String> payload) {

    Map<String, Object> response = new HashMap<>();
    try {
        String oldPassword = payload.get("oldPassword");
        String newPassword = payload.get("newPassword");

        userService.updatePassword(id, oldPassword, newPassword);

        response.put("success", true);
        response.put("message", "Password berhasil diubah!");
        return ResponseEntity.ok(response);

    } catch (RuntimeException e) {
        response.put("success", false);
        response.put("message", e.getMessage());
        return ResponseEntity.badRequest().body(response);
    }
}

@GetMapping("/{id}")
public ResponseEntity<?> getProfile(@PathVariable Long id) {
    return userService.getUserById(id)
            .map(user -> ResponseEntity.ok(user))
            .orElse(ResponseEntity.notFound().build());
}


}
