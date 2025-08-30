package com.knit_and_keep.backend.repository;

import com.knit_and_keep.backend.model.UserPelanggan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPelangganRepository extends JpaRepository<UserPelanggan, Long> {
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    Optional<UserPelanggan> findByUsername(String username);

    @Query("SELECT COUNT(u) FROM UserPelanggan u")
    long countCustomers();
}
