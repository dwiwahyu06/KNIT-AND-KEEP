package com.knit_and_keep.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_status")
@Data
public class OrderStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String status; // PENDING, PAID, SHIPPED, DELIVERED
    private LocalDateTime changedAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;
}

