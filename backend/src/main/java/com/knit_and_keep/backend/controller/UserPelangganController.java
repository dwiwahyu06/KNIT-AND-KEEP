package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.UserPelanggan;
import com.knit_and_keep.backend.repository.UserPelangganRepository;
import com.knit_and_keep.backend.security.Sesi;
import com.knit_and_keep.backend.security.TokenService;
import com.knit_and_keep.backend.service.UserPelangganService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pelanggan")
@CrossOrigin(origins = "http://localhost:5173")
public class UserPelangganController {

    @Autowired private UserPelangganService userService;
    @Autowired private UserPelangganRepository userPelangganRepository;
    @Autowired private TokenService tokenService;

    /** Daftar pelanggan untuk halaman Akun. Hanya pengelola yang boleh membukanya. */
    @GetMapping("/all")
    public ResponseEntity<List<UserPelanggan>> semua() {
        Sesi.wajibAdmin();
        return ResponseEntity.ok(userPelangganRepository.findAll());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserPelanggan user) {
        Map<String, Object> response = new HashMap<>();
        try {
            UserPelanggan baru = userService.register(user);
            response.put("success", true);
            response.put("message", "Registrasi berhasil!");
            response.put("user", baru);
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
            UserPelanggan user = userService.login(payload.get("username"), payload.get("password"));

            response.put("success", true);
            response.put("message", "Login berhasil!");
            response.put("user", user);
            response.put("token", tokenService.terbitkan(
                    user.getId(), user.getUsername(), Sesi.PELANGGAN));
            response.put("berlakuJam", tokenService.masaBerlakuJam());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> ubahProfil(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Sesi.wajibPemilik(id);
        Map<String, Object> response = new HashMap<>();
        try {
            UserPelanggan diperbarui = userService.updateProfile(
                    id, payload.get("username"), payload.get("email"));
            response.put("success", true);
            response.put("message", "Profil berhasil diperbarui.");
            response.put("user", diperbarui);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/update-password/{id}")
    public ResponseEntity<?> ubahPassword(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Sesi.wajibPemilik(id);
        Map<String, Object> response = new HashMap<>();
        try {
            userService.updatePassword(id, payload.get("oldPassword"), payload.get("newPassword"));
            response.put("success", true);
            response.put("message", "Password berhasil diubah.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> profil(@PathVariable Long id) {
        Sesi.wajibPemilik(id);
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Menonaktifkan atau mengaktifkan kembali akun pelanggan.
     *
     * Akun tidak dihapus, karena riwayat belanjanya masih dibutuhkan pembukuan.
     * Yang dihentikan hanya kemampuannya untuk masuk.
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> ubahStatusAkun(@PathVariable Long id,
                                            @RequestBody Map<String, Object> payload) {
        Sesi.wajibAdmin();
        boolean aktif = Boolean.parseBoolean(String.valueOf(payload.getOrDefault("aktif", true)));

        UserPelanggan user = userPelangganRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Pelanggan tidak ditemukan"));

        user.setAktif(aktif);
        userPelangganRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("aktif", aktif);
        response.put("message", "Akun " + user.getUsername()
                + (aktif ? " diaktifkan kembali." : " dinonaktifkan."));
        return ResponseEntity.ok(response);
    }
}
