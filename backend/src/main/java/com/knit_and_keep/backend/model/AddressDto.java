package com.knit_and_keep.backend.model;


import lombok.Data;

// DTO ini digunakan untuk menerima data dari form React
@Data
public class AddressDto {
    private String provinsi;
    private String kabupaten;
    private String kecamatan;
    private String kelurahan;
    private String detailAlamat;
    private String rt;
    private String rw;
    private Double latitude;
    private Double longitude;
    // Field penting untuk menyimpan ID dari Komerce
    private String destinationId;
}


