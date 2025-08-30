package com.knit_and_keep.backend.model;


import lombok.Data;

/**
 * Data Transfer Object (DTO) untuk menerima request perhitungan ongkir dari frontend.
 * Menggunakan Lombok @Data untuk secara otomatis menghasilkan getter, setter, toString, dll.
 */
@Data
public class ShippingCostRequest {
    private String origin;
    private String destination;
    private int weight;
    private String courier;
}