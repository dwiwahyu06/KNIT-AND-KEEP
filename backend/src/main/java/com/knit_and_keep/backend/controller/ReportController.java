// package com.knit_and_keep.backend.controller;

// import com.knit_and_keep.backend.model.IncomeStatementResponse;
// import com.knit_and_keep.backend.model.IncomeStatementDetailedResponse;
// import com.knit_and_keep.backend.service.ReportService;
// import org.springframework.web.bind.annotation.*;

// @RestController
// @RequestMapping("/api/reports")
// @CrossOrigin(origins = "http://localhost:5173")
// public class ReportController {

//     private final ReportService reportService;
//     public ReportController(ReportService reportService) {
//         this.reportService = reportService;
//     }

//     // Endpoint lama (simple) -> compat untuk frontend lama
//     @GetMapping("/income-statement")
//     public IncomeStatementResponse getIncomeStatementSimple() {
//         return reportService.generateIncomeStatementSimple();
//     }

//     // Endpoint baru (detailed) -> sesuai akuntansi
//     @GetMapping("/income-statement/detailed")
//     public IncomeStatementDetailedResponse getIncomeStatementDetailed() {
//         return reportService.generateIncomeStatementDetailed();
//     }
// }
