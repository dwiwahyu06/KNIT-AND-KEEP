package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.ProfilePelanggan;
import com.knit_and_keep.backend.model.UserPelanggan;
import com.knit_and_keep.backend.repository.ProfilePelangganRepository;
import com.knit_and_keep.backend.repository.UserPelangganRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class ProfilePelangganService {

    @Autowired
    private ProfilePelangganRepository profileRepo;

    @Autowired
    private UserPelangganRepository userRepo;

    public ProfilePelanggan getProfile(Long userId) {
        UserPelanggan user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));

        return profileRepo.findByUser(user).orElseGet(() -> {
            // kalau belum ada profile, buat baru kosong
            ProfilePelanggan newProfile = new ProfilePelanggan();
            newProfile.setUser(user);
            return profileRepo.save(newProfile);
        });
    }

    public ProfilePelanggan updateProfile(Long userId, String alamat, String nomorHp, String tanggalLahir) {
        UserPelanggan user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));

        ProfilePelanggan profile = profileRepo.findByUser(user)
                .orElseGet(() -> {
                    ProfilePelanggan newProfile = new ProfilePelanggan();
                    newProfile.setUser(user);
                    return newProfile;
                });

        if (alamat != null) profile.setAlamat(alamat);
        if (nomorHp != null) profile.setNomorHp(nomorHp);
        if (tanggalLahir != null) profile.setTanggalLahir(java.time.LocalDate.parse(tanggalLahir));

        return profileRepo.save(profile);
    }
}
