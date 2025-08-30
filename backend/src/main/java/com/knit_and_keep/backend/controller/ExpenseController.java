// package com.knit_and_keep.backend.controller;


// import com.knit_and_keep.backend.model.Expense;
// import com.knit_and_keep.backend.service.ExpenseService;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;

// @RestController
// @RequestMapping("/api/expenses")
// @CrossOrigin(origins = "http://localhost:5173") // sesuaikan port React
// public class ExpenseController {
//     private final ExpenseService expenseService;

//     public ExpenseController(ExpenseService expenseService) {
//         this.expenseService = expenseService;
//     }

//     @GetMapping
//     public List<Expense> getAll() {
//         return expenseService.getAll();
//     }

//     @PostMapping
//     public Expense create(@RequestBody Expense expense) {
//         return expenseService.save(expense);
//     }

//     @DeleteMapping("/{id}")
//     public void delete(@PathVariable Long id) {
//         expenseService.delete(id);
//     }
// }
