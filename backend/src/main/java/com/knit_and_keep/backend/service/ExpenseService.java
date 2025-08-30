// package com.knit_and_keep.backend.service;


// import com.knit_and_keep.backend.model.Expense;
// import com.knit_and_keep.backend.repository.ExpenseRepository;
// import org.springframework.stereotype.Service;

// import java.util.List;

// @Service
// public class ExpenseService {
//     private final ExpenseRepository expenseRepository;

//     public ExpenseService(ExpenseRepository expenseRepository) {
//         this.expenseRepository = expenseRepository;
//     }

//     public List<Expense> getAll() {
//         return expenseRepository.findAll();
//     }

//     public Expense save(Expense expense) {
//         return expenseRepository.save(expense);
//     }

//     public void delete(Long id) {
//         expenseRepository.deleteById(id);
//     }
// }
