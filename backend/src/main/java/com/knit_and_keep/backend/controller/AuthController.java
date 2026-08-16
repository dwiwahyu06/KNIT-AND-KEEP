package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.User;
import com.knit_and_keep.backend.repository.UserRepository;
import com.knit_and_keep.backend.security.Sesi;
import com.knit_and_keep.backend.security.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Akun pengelola toko.
 *
 * <p>Dua aturan yang dipegang di sini:
 *
 * <p><b>Peran tidak pernah datang dari permintaan.</b> Sebelumnya kolom
 * {@code role} di badan permintaan dipakai apa adanya, sehingga siapa pun bisa
 * mendaftar sambil menyebut dirinya ADMIN lalu membuka seluruh data toko.
 *
 * <p><b>Pendaftaran pengelola bukan halaman umum.</b> Akun pertama boleh dibuat
 * bebas supaya toko baru bisa dimulai; sesudah ada penghuninya, hanya pengelola
 * yang boleh menambah pengelola lain.
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired private UserRepository userRepository;
    @Autowired private TokenService tokenService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Memberi tahu frontend apakah toko ini masih kosong.
     * Halaman pendaftaran pengelola hanya boleh terbuka saat masih kosong.
     */
    @GetMapping("/perlu-pengelola-pertama")
    public Map<String, Object> perluPengelolaPertama() {
        return Map.of("kosong", userRepository.count() == 0);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User permintaan) {
        Map<String, Object> response = new HashMap<>();
        boolean tokoMasihKosong = userRepository.count() == 0;

        // Selama sudah ada pengelola, penambahan berikutnya harus dilakukan
        // oleh pengelola yang sudah masuk.
        if (!tokoMasihKosong && !Sesi.adalahAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Penambahan akun pengelola hanya bisa dilakukan dari panel admin.");
        }

        if (permintaan.getUsername() == null || permintaan.getUsername().isBlank()
                || permintaan.getPassword() == null || permintaan.getPassword().isBlank()) {
            response.put("success", false);
            response.put("message", "Username dan password wajib diisi.");
            return ResponseEntity.badRequest().body(response);
        }
        if (permintaan.getPassword().length() < 6) {
            response.put("success", false);
            response.put("message", "Password minimal 6 karakter.");
            return ResponseEntity.badRequest().body(response);
        }
        if (userRepository.existsByUsername(permintaan.getUsername())) {
            response.put("success", false);
            response.put("message", "Username sudah dipakai.");
            return ResponseEntity.badRequest().body(response);
        }
        if (userRepository.existsByEmail(permintaan.getEmail())) {
            response.put("success", false);
            response.put("message", "Email sudah dipakai.");
            return ResponseEntity.badRequest().body(response);
        }

        // Objek baru dibangun sendiri, bukan menyimpan objek dari permintaan —
        // supaya kolom apa pun yang diselipkan pengirim tidak ikut tersimpan.
        User baru = new User();
        baru.setUsername(permintaan.getUsername().trim());
        baru.setEmail(permintaan.getEmail());
        baru.setPassword(passwordEncoder.encode(permintaan.getPassword()));
        baru.setRole("ADMIN");
        userRepository.save(baru);

        response.put("success", true);
        response.put("message", tokoMasihKosong
                ? "Akun pengelola pertama dibuat."
                : "Akun pengelola baru ditambahkan.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        Map<String, Object> response = new HashMap<>();

        User dbUser = userRepository.findByUsername(user.getUsername());
        if (dbUser == null) {
            response.put("success", false);
            response.put("message", "Akun tidak ditemukan. Periksa kembali username Anda.");
            return ResponseEntity.badRequest().body(response);
        }

        boolean cocok;
        String tersimpan = dbUser.getPassword();
        if (tersimpan.startsWith("$2a$") || tersimpan.startsWith("$2b$")) {
            cocok = passwordEncoder.matches(user.getPassword(), tersimpan);
        } else {
            // Password lama masih polos — kalau benar, sekalian diubah ke BCrypt.
            cocok = tersimpan.equals(user.getPassword());
            if (cocok) {
                dbUser.setPassword(passwordEncoder.encode(user.getPassword()));
                userRepository.save(dbUser);
            }
        }

        if (!cocok) {
            response.put("success", false);
            response.put("message", "Password salah.");
            return ResponseEntity.badRequest().body(response);
        }

        if (!"ADMIN".equalsIgnoreCase(dbUser.getRole())) {
            response.put("success", false);
            response.put("message", "Akun ini tidak punya akses ke halaman admin.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        response.put("success", true);
        response.put("message", "Login berhasil.");
        response.put("user", tanpaPassword(dbUser));
        response.put("token", tokenService.terbitkan(
                dbUser.getId(), dbUser.getUsername(), Sesi.ADMIN));
        response.put("berlakuJam", tokenService.masaBerlakuJam());
        return ResponseEntity.ok(response);
    }

    /** Daftar akun pengelola, ditampilkan di halaman Akun. */
    @GetMapping("/admins")
    public ResponseEntity<List<Map<String, Object>>> semuaAdmin() {
        Sesi.wajibAdmin();
        return ResponseEntity.ok(userRepository.findAll().stream()
                .map(this::tanpaPassword)
                .toList());
    }

    /** Mengatur ulang password pengelola lain, dipakai saat ada yang lupa. */
    @PutMapping("/admins/{id}/password")
    public ResponseEntity<?> aturUlangPassword(@PathVariable Long id,
                                               @RequestBody Map<String, String> payload) {
        Sesi.wajibAdmin();
        String baru = payload.get("passwordBaru");
        if (baru == null || baru.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password minimal 6 karakter.");
        }
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Akun tidak ditemukan"));
        u.setPassword(passwordEncoder.encode(baru));
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("success", true, "message", "Password " + u.getUsername() + " diatur ulang."));
    }

    @DeleteMapping("/admins/{id}")
    public ResponseEntity<?> hapusAdmin(@PathVariable Long id) {
        Sesi.Pengguna pengguna = Sesi.wajibMasuk();
        Sesi.wajibAdmin();

        if (pengguna.id().equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Anda tidak bisa menghapus akun Anda sendiri.");
        }
        if (userRepository.count() <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Toko harus punya minimal satu pengelola.");
        }
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Akun tidak ditemukan"));
        userRepository.delete(u);
        return ResponseEntity.ok(Map.of("success", true, "message", "Akun " + u.getUsername() + " dihapus."));
    }

    /**
     * Menyalin data akun tanpa password.
     * Entity aslinya tidak diubah — mengosongkan field pada entity yang masih
     * dikelola JPA akan ikut tersimpan ke database saat request selesai.
     */
    private Map<String, Object> tanpaPassword(User u) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", u.getId());
        data.put("username", u.getUsername());
        data.put("email", u.getEmail());
        data.put("role", u.getRole());
        return data;
    }
}
