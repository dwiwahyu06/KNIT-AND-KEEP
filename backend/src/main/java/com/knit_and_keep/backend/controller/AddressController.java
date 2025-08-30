// package com.knit_and_keep.backend.controller;
// import com.knit_and_keep.backend.model.Address;
// import com.knit_and_keep.backend.service.AddressService;
// import com.knit_and_keep.backend.repository.AddressRepository;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;
// import java.util.List;
// import org.springframework.http.HttpStatus;

// @CrossOrigin(origins = "http://localhost:5173")
// @RestController
// @RequestMapping("/api")
// public class AddressController {
//     @Autowired
//     private AddressService addressService;
//     @Autowired
//     private AddressRepository addressRepository;

//     @GetMapping("/pelanggan/{pelangganId}/addresses")
//     public ResponseEntity<List<Address>> getAddressesByPelanggan(@PathVariable Long pelangganId) {
//         List<Address> addresses = addressService.getAddressesByPelangganId(pelangganId);
//         return ResponseEntity.ok(addresses);
//     }

//     @PostMapping("/pelanggan/{pelangganId}/addresses")
//     public ResponseEntity<Address> createAddress(@PathVariable Long pelangganId, @RequestBody Address address) {
//         Address savedAddress = addressService.createAddressForPelanggan(pelangganId, address);
//         return ResponseEntity.status(HttpStatus.CREATED).body(savedAddress);
//     }

//     @GetMapping("/addresses/{id}")
//     public ResponseEntity<Address> getAddressById(@PathVariable Long id) {
//         return addressRepository.findById(id)
//                 .map(ResponseEntity::ok)
//                 .orElse(ResponseEntity.notFound().build());
//     }

//     @PutMapping("/addresses/{id}")
//     public ResponseEntity<Address> updateAddress(@PathVariable Long id, @RequestBody Address addressDetails) {
//         return addressRepository.findById(id)
//                 .map(existingAddress -> {
//                     existingAddress.setProvinsi(addressDetails.getProvinsi());
//                     existingAddress.setKabupaten(addressDetails.getKabupaten());
//                     existingAddress.setKecamatan(addressDetails.getKecamatan());
//                     existingAddress.setKelurahan(addressDetails.getKelurahan());
//                     existingAddress.setDetailAlamat(addressDetails.getDetailAlamat());
//                     existingAddress.setRt(addressDetails.getRt());
//                     existingAddress.setRw(addressDetails.getRw());
//                     existingAddress.setLatitude(addressDetails.getLatitude());
//                     existingAddress.setLongitude(addressDetails.getLongitude());
//                     return ResponseEntity.ok(addressRepository.save(existingAddress));
//                 })
//                 .orElse(ResponseEntity.notFound().build());
//     }

//     @DeleteMapping("/addresses/{id}")
//     public ResponseEntity<HttpStatus> deleteAddress(@PathVariable Long id) {
//         if (!addressRepository.existsById(id)) {
//             return new ResponseEntity<>(HttpStatus.NOT_FOUND);
//         }
//         addressRepository.deleteById(id);
//         return new ResponseEntity<>(HttpStatus.NO_CONTENT);
//     }
// }

package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.AddressDto;
import com.knit_and_keep.backend.model.Address;
import com.knit_and_keep.backend.service.AddressService;
import com.knit_and_keep.backend.repository.AddressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.http.HttpStatus;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api")
public class AddressController {
    @Autowired
    private AddressService addressService;
    
    @Autowired
    private AddressRepository addressRepository;

    @GetMapping("/pelanggan/{pelangganId}/addresses")
    public ResponseEntity<List<Address>> getAddressesByPelanggan(@PathVariable Long pelangganId) {
        List<Address> addresses = addressService.getAddressesByPelangganId(pelangganId);
        return ResponseEntity.ok(addresses);
    }

    // Menggunakan DTO untuk membuat alamat baru
    @PostMapping("/pelanggan/{pelangganId}/addresses")
    public ResponseEntity<Address> createAddress(@PathVariable Long pelangganId, @RequestBody AddressDto addressDto) {
        Address address = new Address();
        // Memetakan data dari DTO ke Entity Address
        address.setProvinsi(addressDto.getProvinsi());
        address.setKabupaten(addressDto.getKabupaten());
        address.setKecamatan(addressDto.getKecamatan());
        address.setKelurahan(addressDto.getKelurahan());
        address.setDetailAlamat(addressDto.getDetailAlamat());
        address.setRt(addressDto.getRt());
        address.setRw(addressDto.getRw());
        address.setLatitude(addressDto.getLatitude());
        address.setLongitude(addressDto.getLongitude());
        address.setDestinationId(addressDto.getDestinationId()); // Menyimpan ID Komerce

        Address savedAddress = addressService.createAddressForPelanggan(pelangganId, address);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedAddress);
    }

    @GetMapping("/addresses/{id}")
    public ResponseEntity<Address> getAddressById(@PathVariable Long id) {
        return addressRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Menggunakan DTO untuk memperbarui alamat
    @PutMapping("/addresses/{id}")
    public ResponseEntity<Address> updateAddress(@PathVariable Long id, @RequestBody AddressDto addressDetails) {
        return addressRepository.findById(id)
                .map(existingAddress -> {
                    existingAddress.setProvinsi(addressDetails.getProvinsi());
                    existingAddress.setKabupaten(addressDetails.getKabupaten());
                    existingAddress.setKecamatan(addressDetails.getKecamatan());
                    existingAddress.setKelurahan(addressDetails.getKelurahan());
                    existingAddress.setDetailAlamat(addressDetails.getDetailAlamat());
                    existingAddress.setRt(addressDetails.getRt());
                    existingAddress.setRw(addressDetails.getRw());
                    existingAddress.setLatitude(addressDetails.getLatitude());
                    existingAddress.setLongitude(addressDetails.getLongitude());
                    existingAddress.setDestinationId(addressDetails.getDestinationId()); // Memperbarui ID Komerce
                    return ResponseEntity.ok(addressRepository.save(existingAddress));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<HttpStatus> deleteAddress(@PathVariable Long id) {
        if (!addressRepository.existsById(id)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        addressRepository.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}

