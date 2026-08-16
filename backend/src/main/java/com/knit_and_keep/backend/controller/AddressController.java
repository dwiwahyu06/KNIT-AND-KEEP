package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.Address;
import com.knit_and_keep.backend.model.AddressDto;
import com.knit_and_keep.backend.repository.AddressRepository;
import com.knit_and_keep.backend.security.Sesi;
import com.knit_and_keep.backend.service.AddressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api")
public class AddressController {

    @Autowired private AddressService addressService;
    @Autowired private AddressRepository addressRepository;

    @GetMapping("/pelanggan/{pelangganId}/addresses")
    public ResponseEntity<List<Address>> milikPelanggan(@PathVariable Long pelangganId) {
        Sesi.wajibPemilik(pelangganId);
        return ResponseEntity.ok(addressService.getAddressesByPelangganId(pelangganId));
    }

    @PostMapping("/pelanggan/{pelangganId}/addresses")
    public ResponseEntity<Address> buat(@PathVariable Long pelangganId, @RequestBody AddressDto dto) {
        Sesi.wajibPemilik(pelangganId);
        Address alamat = new Address();
        salin(dto, alamat);
        Address tersimpan = addressService.createAddressForPelanggan(pelangganId, alamat);
        return ResponseEntity.status(HttpStatus.CREATED).body(tersimpan);
    }

    @GetMapping("/addresses/{id}")
    public ResponseEntity<Address> detail(@PathVariable Long id) {
        return addressRepository.findById(id)
                .map(a -> { pastikanMilikSendiri(a); return ResponseEntity.ok(a); })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/addresses/{id}")
    public ResponseEntity<Address> ubah(@PathVariable Long id, @RequestBody AddressDto dto) {
        return addressRepository.findById(id)
                .map(alamat -> {
                    pastikanMilikSendiri(alamat);
                    salin(dto, alamat);
                    return ResponseEntity.ok(addressRepository.save(alamat));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<HttpStatus> hapus(@PathVariable Long id) {
        return addressRepository.findById(id)
                .map(a -> {
                    pastikanMilikSendiri(a);
                    addressRepository.delete(a);
                    return new ResponseEntity<HttpStatus>(HttpStatus.NO_CONTENT);
                })
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    private void pastikanMilikSendiri(Address alamat) {
        if (Sesi.adalahAdmin()) return;
        Sesi.wajibPemilik(alamat.getPelanggan() == null ? null : alamat.getPelanggan().getId());
    }

    private void salin(AddressDto dto, Address alamat) {
        alamat.setNamaPenerima(dto.getNamaPenerima());
        alamat.setTeleponPenerima(dto.getTeleponPenerima());
        alamat.setProvinsi(dto.getProvinsi());
        alamat.setKabupaten(dto.getKabupaten());
        alamat.setKecamatan(dto.getKecamatan());
        alamat.setKelurahan(dto.getKelurahan());
        alamat.setKodePos(dto.getKodePos());
        alamat.setDetailAlamat(dto.getDetailAlamat());
        alamat.setRt(dto.getRt());
        alamat.setRw(dto.getRw());
        alamat.setLatitude(dto.getLatitude());
        alamat.setLongitude(dto.getLongitude());
        alamat.setDestinationId(dto.getDestinationId());
        alamat.setLabelTujuan(dto.getLabelTujuan());
        if (dto.getUtama() != null) alamat.setUtama(dto.getUtama());
    }
}
