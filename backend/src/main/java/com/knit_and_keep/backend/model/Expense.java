package com.knit_and_keep.backend.model;


import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;

@Entity
@Data
// Kesamaan dibandingkan lewat id saja. Bawaan Lombok ikut membandingkan
// relasi, dan itu membuat Hibernate memuat koleksi lain di tengah pemuatan
// koleksi ini - berujung ConcurrentModificationException saat checkout.
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Expense {
    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description;

    private Double amount;

    private String category;

    private LocalDate date = LocalDate.now();
}

