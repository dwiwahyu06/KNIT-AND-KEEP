package com.knit_and_keep.backend.model;

import java.time.LocalDate;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "orders")
@Data

public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Double totalPrice;
    private String status; // PENDING, PAID, SHIPPED
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
private List<OrderStatus> statusHistory;
private LocalDate createdAt = LocalDate.now();


}

