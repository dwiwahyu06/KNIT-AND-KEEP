
// package com.knit_and_keep.backend.repository;

// import java.util.List;

// import org.springframework.data.jpa.repository.JpaRepository;

// import com.knit_and_keep.backend.model.Order;

// public interface OrderRepository extends JpaRepository<Order, Long> {
//     List<Order> findByUserId(Long userId);
// }


// package com.knit_and_keep.backend.repository;

// import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.data.jpa.repository.Query;
// import org.springframework.stereotype.Repository;

// import com.knit_and_keep.backend.model.Order;

// // import com.knit_and_keep.backend.model.Order;
// // import org.springframework.data.jpa.repository.*;
// // import org.springframework.stereotype.Repository;

// // @Repository
// // public interface OrderRepository extends JpaRepository<Order, Long> {

// //   @Query(value = "SELECT COUNT(*) FROM orders", nativeQuery = true)
// //   long countOrders();

// //   // Revenue per month (pakai kolom created_at & total pada orders)
// //   @Query(value = """
// //     SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS ym,
// //            COALESCE(SUM(total),0) as revenue
// //     FROM orders
// //     WHERE created_at >= (CURRENT_DATE - INTERVAL '6 months')
// //     GROUP BY 1 ORDER BY 1
// //   """, nativeQuery = true)
// //   java.util.List<Object[]> revenueLast6Months();
// // }


// @Repository
// public interface OrderRepository extends JpaRepository<Order, Long> {

//   @Query(value = "SELECT COUNT(*) FROM orders", nativeQuery = true)
//   long countOrders();

//   // Revenue per month (pakai kolom created_at kalau ada, 
//   // tapi karena Order entity belum punya, tambahin dulu createdAt di Order)
//   @Query(value = """
//     SELECT to_char(date_trunc('month', o.created_at), 'YYYY-MM') AS ym,
//            COALESCE(SUM(o.total_price),0) as revenue
//     FROM orders o
//     WHERE o.created_at >= (CURRENT_DATE - INTERVAL '6 months')
//     GROUP BY 1 ORDER BY 1
//   """, nativeQuery = true)
//   java.util.List<Object[]> revenueLast6Months();
// }
