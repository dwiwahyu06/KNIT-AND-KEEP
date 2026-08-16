package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.Notifikasi;
import com.knit_and_keep.backend.security.Sesi;
import com.knit_and_keep.backend.service.NotifikasiService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notifikasi")
@CrossOrigin(origins = "http://localhost:5173")
public class NotifikasiController {

    private final NotifikasiService notifikasiService;

    public NotifikasiController(NotifikasiService notifikasiService) {
        this.notifikasiService = notifikasiService;
    }

    @GetMapping
    public Map<String, Object> milikSaya(
            @RequestParam(defaultValue = "0") int halaman,
            @RequestParam(defaultValue = "20") int ukuran) {

        Long id = Sesi.wajibMasuk().id();
        Page<Notifikasi> hasil = notifikasiService.milik(id, halaman, Math.min(ukuran, 100));

        Map<String, Object> jawaban = new LinkedHashMap<>();
        jawaban.put("isi", hasil.getContent());
        jawaban.put("halaman", hasil.getNumber());
        jawaban.put("totalHalaman", hasil.getTotalPages());
        jawaban.put("total", hasil.getTotalElements());
        jawaban.put("belumDibaca", notifikasiService.belumDibaca(id));
        return jawaban;
    }

    @GetMapping("/jumlah-belum-dibaca")
    public Map<String, Object> jumlahBelumDibaca() {
        Long id = Sesi.wajibMasuk().id();
        return Map.of("belumDibaca", notifikasiService.belumDibaca(id));
    }

    @PutMapping("/{id}/baca")
    public ResponseEntity<Void> baca(@PathVariable Long id) {
        notifikasiService.tandaiDibaca(id, Sesi.wajibMasuk().id());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/baca-semua")
    public Map<String, Object> bacaSemua() {
        int jumlah = notifikasiService.tandaiSemuaDibaca(Sesi.wajibMasuk().id());
        return Map.of("ditandai", jumlah);
    }
}
