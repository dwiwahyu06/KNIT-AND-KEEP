package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.CashFlow;
import com.knit_and_keep.backend.service.CashFlowService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cashflow")
@CrossOrigin(origins = "http://localhost:5173")
public class CashFlowController {

    private final CashFlowService service;

    public CashFlowController(CashFlowService service) {
        this.service = service;
    }

    /**
     * @param jenis  IN, OUT, atau kosong untuk keduanya
     * @param dari   awal periode; kosong berarti sejak awal
     * @param sampai akhir periode; kosong berarti sampai hari ini
     */
    @GetMapping
    public List<CashFlow> semua(
            @RequestParam(required = false) String jenis,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dari,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate sampai) {
        return service.cari(jenis, dari, sampai);
    }

    @GetMapping("/ringkasan")
    public Map<String, Object> ringkasan(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dari,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate sampai) {
        return service.ringkasan(dari, sampai);
    }

    @PostMapping
    public CashFlow buat(@RequestBody CashFlow cashFlow) {
        return service.save(cashFlow);
    }

    @DeleteMapping("/{id}")
    public void hapus(@PathVariable Long id) {
        service.hapus(id);
    }
}
