package com.knit_and_keep.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "order_items")
@Data
public class OrderItem {
    @Id @GeneratedValue(strategy = GenerationType   .IDENTITY)
    private Long id;

    private Long orderId;
    private Long productId;
    private Integer quantity;
}

