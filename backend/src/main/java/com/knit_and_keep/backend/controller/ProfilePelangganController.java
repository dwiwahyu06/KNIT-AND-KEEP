package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.ProfilePelanggan;
import com.knit_and_keep.backend.service.ProfilePelangganService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:5173")
public class ProfilePelangganController {

    @Autowired
    private ProfilePelangganService profileService;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    @PutMapping("/update/{userId}")
    public ResponseEntity<?> updateProfile(
            @PathVariable Long userId,
            @RequestBody Map<String, String> payload) {

        String alamat = payload.get("alamat");
        String nomorHp = payload.get("nomorHp");
        String tanggalLahir = payload.get("tanggalLahir");

        ProfilePelanggan updated = profileService.updateProfile(userId, alamat, nomorHp, tanggalLahir);
        return ResponseEntity.ok(updated);
    }
}
