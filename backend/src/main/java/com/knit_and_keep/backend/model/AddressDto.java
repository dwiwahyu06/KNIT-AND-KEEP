package com.knit_and_keep.backend.model;

import lombok.Data;

/** Data alamat yang dikirim formulir React. */
@Data
public class AddressDto {
    private String namaPenerima;
    private String teleponPenerima;

    private String provinsi;
    private String kabupaten;
    private String kecamatan;
    private String kelurahan;
    private String kodePos;

    private String detailAlamat;
    private String rt;
    private String rw;
    private Double latitude;
    private Double longitude;

    /** ID kelurahan dari RajaOngkir — wajib supaya ongkir bisa dihitung. */
    private String destinationId;
    private String labelTujuan;

    private Boolean utama;
}
