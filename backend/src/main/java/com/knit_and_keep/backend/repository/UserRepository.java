package com.knit_and_keep.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.knit_and_keep.backend.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    User findByUsername(String username);
}
