// package com.knit_and_keep.backend.controller;

// import com.knit_and_keep.backend.model.CashFlow;
// import com.knit_and_keep.backend.service.CashFlowService;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;

// @RestController
// @RequestMapping("/api/cashflow")
// @CrossOrigin(origins = "*")
// public class CashFlowController {

//     private final CashFlowService service;

//     public CashFlowController(CashFlowService service) {
//         this.service = service;
//     }

//     @GetMapping
//     public List<CashFlow> getAll() {
//         return service.getAll();
//     }

//     @PostMapping
//     public CashFlow create(@RequestBody CashFlow cashFlow) {
//         return service.save(cashFlow);
//     }
// }

