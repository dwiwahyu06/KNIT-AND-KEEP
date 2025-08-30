// package com.knit_and_keep.backend.repository;

// import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.data.jpa.repository.Query;
// import org.springframework.stereotype.Repository;

// import com.knit_and_keep.backend.model.Expense;

// @Repository
// public interface ExpenseRepository extends JpaRepository<Expense, Long> {

//   // Total expense per month untuk 6 bulan terakhir
//   @Query(value = """
//     SELECT to_char(date_trunc('month', e.date), 'YYYY-MM') AS ym,
//            COALESCE(SUM(e.amount),0) as total
//     FROM expense e
//     WHERE e.date >= (CURRENT_DATE - INTERVAL '6 months')
//     GROUP BY 1 ORDER BY 1
//   """, nativeQuery = true)
//   java.util.List<Object[]> expenseLast6Months();
// }
