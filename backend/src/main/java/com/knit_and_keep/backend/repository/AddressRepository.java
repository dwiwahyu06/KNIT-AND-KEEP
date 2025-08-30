package com.knit_and_keep.backend.repository;


import com.knit_and_keep.backend.model.Address;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
        // ✅ Mencari semua alamat untuk satu pelanggan
    List<Address> findByPelangganId(Long pelangganId);

    // ✅ Menghitung jumlah alamat untuk satu pelanggan
    long countByPelangganId(Long pelangganId);

}
