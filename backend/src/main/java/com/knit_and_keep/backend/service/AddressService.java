package com.knit_and_keep.backend.service;
import com.knit_and_keep.backend.model.Address;
import com.knit_and_keep.backend.model.UserPelanggan;
import com.knit_and_keep.backend.repository.AddressRepository;
import com.knit_and_keep.backend.repository.UserPelangganRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class AddressService {
    @Autowired
    private AddressRepository addressRepository;
    @Autowired
    private UserPelangganRepository pelangganRepository;

    public List<Address> getAddressesByPelangganId(Long pelangganId) {
        if (!pelangganRepository.existsById(pelangganId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pelanggan tidak ditemukan");
        }
        return addressRepository.findByPelangganId(pelangganId);
    }

    public Address createAddressForPelanggan(Long pelangganId, Address address) {
        long addressCount = addressRepository.countByPelangganId(pelangganId);
        if (addressCount >= 5) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Anda telah mencapai batas maksimal 5 alamat.");
        }
        UserPelanggan pelanggan = pelangganRepository.findById(pelangganId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pelanggan tidak ditemukan"));
        
        address.setPelanggan(pelanggan);
        return addressRepository.save(address);
    }
}