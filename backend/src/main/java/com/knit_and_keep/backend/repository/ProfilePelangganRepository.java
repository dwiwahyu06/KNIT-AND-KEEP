package com.knit_and_keep.backend.repository;

import com.knit_and_keep.backend.model.ProfilePelanggan;
import com.knit_and_keep.backend.model.UserPelanggan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfilePelangganRepository extends JpaRepository<ProfilePelanggan, Long> {
    Optional<ProfilePelanggan> findByUser(UserPelanggan user);
}
