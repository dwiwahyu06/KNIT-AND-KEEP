package com.knit_and_keep.backend.repository;


import com.knit_and_keep.backend.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderStatusRepository extends JpaRepository<OrderStatus, Long> {
}
