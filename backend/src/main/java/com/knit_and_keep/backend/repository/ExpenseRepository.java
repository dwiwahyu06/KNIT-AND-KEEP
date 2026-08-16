package com.knit_and_keep.backend.repository;

import com.knit_and_keep.backend.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    /**
     * Penyaring pengeluaran. Sama seperti arus kas, penyaringan dikerjakan di
     * kueri dan parameternya selalu terisi nilai penanda.
     */
    @Query("""
        SELECT e FROM Expense e
        WHERE (:kategori = '' OR e.category = :kategori)
          AND e.date BETWEEN :dari AND :sampai
        ORDER BY e.date DESC, e.id DESC
        """)
    List<Expense> cari(@Param("kategori") String kategori,
                       @Param("dari") LocalDate dari,
                       @Param("sampai") LocalDate sampai);
}
