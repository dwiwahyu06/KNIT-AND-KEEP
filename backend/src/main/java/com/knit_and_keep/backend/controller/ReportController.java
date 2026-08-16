package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.IncomeStatementDetailedResponse;
import com.knit_and_keep.backend.model.IncomeStatementResponse;
import com.knit_and_keep.backend.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:5173")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/income-statement")
    public IncomeStatementResponse ringkas(
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dari,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate sampai) {
        return reportService.generateIncomeStatementSimple(channel, dari, sampai);
    }

    @GetMapping("/income-statement/detailed")
    public IncomeStatementDetailedResponse rinci(
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dari,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate sampai) {
        return reportService.generateIncomeStatementDetailed(channel, dari, sampai);
    }

    /** Rekap satu bulan, format bulan: 2026-08 */
    @GetMapping("/monthly")
    public Map<String, Object> bulanan(
            @RequestParam(required = false) String bulan,
            @RequestParam(required = false) String channel) {
        return reportService.laporanBulanan(bulan, channel);
    }

    @GetMapping("/tren")
    public List<Map<String, Object>> tren(@RequestParam(required = false) String channel) {
        return reportService.tren6Bulan(channel);
    }

    /** Rekap kendala pengiriman dan kerugiannya, dikelompokkan per jenis. */
    @GetMapping("/retur")
    public Map<String, Object> rekapRetur(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dari,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate sampai) {
        return reportService.rekapRetur(dari, sampai);
    }

    /** Penjualan per kategori barang beserta labanya. */
    @GetMapping("/kategori")
    public List<Map<String, Object>> perKategori(
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dari,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate sampai) {
        return reportService.perKategori(channel, dari, sampai);
    }

    /** Pelanggan yang paling banyak berbelanja. */
    @GetMapping("/pelanggan")
    public List<Map<String, Object>> perPelanggan(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dari,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate sampai,
            @RequestParam(defaultValue = "20") int batas) {
        return reportService.perPelanggan(dari, sampai, batas);
    }
}
