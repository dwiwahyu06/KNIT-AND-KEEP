package com.knit_and_keep.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.knit_and_keep.backend.model.User;
import com.knit_and_keep.backend.repository.UserRepository;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    // @PostMapping("/register")
    // public ResponseEntity<?> register(@RequestBody User user) {
    //     Map<String, Object> response = new HashMap<>();

    //     if (userRepository.existsByUsername(user.getUsername())) {
    //         response.put("success", false);
    //         response.put("message", "Username sudah dipakai!");
    //         return ResponseEntity.badRequest().body(response);
    //     }
    //     if (userRepository.existsByEmail(user.getEmail())) {
    //         response.put("success", false);
    //         response.put("message", "Email sudah dipakai!");
    //         return ResponseEntity.badRequest().body(response);
    //     }

    //     userRepository.save(user);

    //     response.put("success", true);
    //     response.put("message", "Registrasi berhasil!");
    //     return ResponseEntity.ok(response);
    // }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        Map<String, Object> response = new HashMap<>();

        User dbUser = userRepository.findByUsername(user.getUsername());
        if (dbUser == null) {
            response.put("success", false);
            response.put("message", "User tidak ditemukan!");
            return ResponseEntity.badRequest().body(response);
        }
        if (!dbUser.getPassword().equals(user.getPassword())) {
            response.put("success", false);
            response.put("message", "Password salah!");
            return ResponseEntity.badRequest().body(response);
        }

        // kalau berhasil -> kirim user data
        response.put("success", true);
        response.put("message", "Login berhasil!");
        response.put("user", dbUser);
        return ResponseEntity.ok(response);
    }
}
