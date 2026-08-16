package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.UserPelanggan;
import com.knit_and_keep.backend.repository.UserPelangganRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;


@Service
public class UserPelangganService {

    @Autowired
    private UserPelangganRepository repository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // REGISTER
    public UserPelanggan register(UserPelanggan user) {
        if (user.getUsername() == null || user.getUsername().isBlank()) {
            throw new RuntimeException("Nama pengguna wajib diisi!");
        }
        if (user.getPassword() == null || user.getPassword().length() < 6) {
            throw new RuntimeException("Password minimal 6 karakter!");
        }
        if (repository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username sudah dipakai!");
        }
        if (repository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email sudah dipakai!");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setAktif(true);
        return repository.save(user);
    }

    // LOGIN
    public UserPelanggan login(String username, String password) {
        UserPelanggan user = repository.findByUsername(username)
                .filter(dbUser -> passwordEncoder.matches(password, dbUser.getPassword()))
                .orElseThrow(() -> new RuntimeException("Username atau password salah!"));

        // Akun yang dinonaktifkan admin tetap ada datanya, tapi tidak bisa masuk.
        if (Boolean.FALSE.equals(user.getAktif())) {
            throw new RuntimeException("Akun ini sedang dinonaktifkan. Hubungi pengelola toko.");
        }
        return user;
    }

    // UPDATE PROFIL (nama/email)
public UserPelanggan updateProfile(Long userId, String newUsername, String newEmail) {
    UserPelanggan user = repository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));

    if (newUsername != null && !newUsername.isBlank()) {
        if (!user.getUsername().equals(newUsername) && repository.existsByUsername(newUsername)) {
            throw new RuntimeException("Username sudah dipakai!");
        }
        user.setUsername(newUsername);
    }

    if (newEmail != null && !newEmail.isBlank()) {
        if (!user.getEmail().equals(newEmail) && repository.existsByEmail(newEmail)) {
            throw new RuntimeException("Email sudah dipakai!");
        }
        user.setEmail(newEmail);
    }

    return repository.save(user);
}

// UPDATE PASSWORD
public void updatePassword(Long userId, String oldPassword, String newPassword) {
    UserPelanggan user = repository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));

    if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
        throw new RuntimeException("Password lama salah!");
    }

    user.setPassword(passwordEncoder.encode(newPassword));
    repository.save(user);
}
public Optional<UserPelanggan> getUserById(Long id) {
    return repository.findById(id);
}

}
