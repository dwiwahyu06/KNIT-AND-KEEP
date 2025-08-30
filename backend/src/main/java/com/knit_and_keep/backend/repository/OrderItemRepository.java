// package com.knit_and_keep.backend.repository;

// import java.util.List;

// import org.springframework.data.jpa.repository.JpaRepository;

// import com.knit_and_keep.backend.model.OrderItem;

// public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
//     List<OrderItem> findByOrderId(Long orderId);
// }

package com.knit_and_keep.backend.repository;

import com.knit_and_keep.backend.model.OrderItem;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

  @Query(value = "SELECT COALESCE(SUM(quantity),0) FROM order_items", nativeQuery = true)
  long sumSoldUnits();

  // Top 10 produk berdasarkan qty terjual
  @Query(value = """
    SELECT p.name, COALESCE(SUM(oi.quantity),0) AS qty
    FROM order_items oi 
    JOIN products p ON p.id = oi.product_id
    GROUP BY p.name
    ORDER BY qty DESC
    LIMIT 10
  """, nativeQuery = true)
  java.util.List<Object[]> top10ProductByQty();
}
