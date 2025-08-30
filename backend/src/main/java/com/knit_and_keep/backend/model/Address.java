// package com.knit_and_keep.backend.model;

// import com.fasterxml.jackson.annotation.JsonIgnore;
// import jakarta.persistence.*;
// import lombok.Data;

// @Data
// @Entity
// @Table(name = "addresses")
// public class Address {
//     @Id
//     @GeneratedValue(strategy = GenerationType.IDENTITY)
//     private Long id;

//     @ManyToOne(fetch = FetchType.LAZY)
//     @JsonIgnore
//     private UserPelanggan pelanggan;

//     private String provinsi;
//     private String kabupaten;
//     private String kecamatan;
//     private String kelurahan;

//     @Column(length = 512)
//     private String detailAlamat;

//     private String rt;
//     private String rw;
//     private Double latitude;
//     private Double longitude;

//     // Menastikan nama kolom di database adalah 'destination_id'
//     @Column(name = "destination_id")
//     private String destinationId;
// }


package com.knit_and_keep.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "addresses")
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    private UserPelanggan pelanggan;

    private String provinsi;
    private String kabupaten;
    private String kecamatan;
    private String kelurahan;

    @Column(length = 512)
    private String detailAlamat;

    private String rt;
    private String rw;
    private Double latitude;
    private Double longitude;

    // Kolom ini akan menyimpan ID unik dari Komerce untuk perhitungan ongkir
    @Column(name = "destination_id")
    private String destinationId;
}

