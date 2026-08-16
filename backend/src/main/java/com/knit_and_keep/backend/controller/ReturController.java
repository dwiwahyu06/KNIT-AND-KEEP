package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.model.OrderFlow;
import com.knit_and_keep.backend.model.Retur;
import com.knit_and_keep.backend.model.Transaction;
import com.knit_and_keep.backend.security.Sesi;
import com.knit_and_keep.backend.service.ReturService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/retur")
@CrossOrigin(origins = "http://localhost:5173")
public class ReturController {

    @Autowired
    private ReturService returService;

    /** Pilihan jenis kendala untuk mengisi dropdown di frontend. */
    @GetMapping("/jenis-kendala")
    public ResponseEntity<List<Map<String, String>>> jenisKendala() {
        List<Map<String, String>> daftar = OrderFlow.JENIS_KENDALA.stream()
                .map(j -> Map.of("value", j, "label", rapikan(j)))
                .toList();
        return ResponseEntity.ok(daftar);
    }

    @GetMapping
    public ResponseEntity<List<Retur>> semua(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(returService.semua(status));
    }

    @GetMapping("/user/{pelangganId}")
    public ResponseEntity<List<Retur>> milikPelanggan(@PathVariable Long pelangganId) {
        Sesi.wajibPemilik(pelangganId);
        return ResponseEntity.ok(returService.milikPelanggan(pelangganId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Retur> detail(@PathVariable Long id) {
        Retur r = returService.cari(id);
        if (!Sesi.adalahAdmin()) {
            Long pemilik = r.getTransaction() == null || r.getTransaction().getPelanggan() == null
                    ? null : r.getTransaction().getPelanggan().getId();
            Sesi.wajibPemilik(pemilik);
        }
        return ResponseEntity.ok(r);
    }

    @PostMapping
    public ResponseEntity<Retur> ajukan(@RequestBody Map<String, Object> payload) {
        Long transactionId = Long.parseLong(payload.get("transactionId").toString());
        return ResponseEntity.ok(returService.ajukan(
                transactionId,
                (String) payload.get("jenisKendala"),
                (String) payload.get("alasan"),
                (String) payload.get("fotoBukti"),
                Sesi.adalahAdmin() ? "ADMIN" : "PELANGGAN"));
    }

    @PutMapping("/{id}/setujui")
    public ResponseEntity<Retur> setujui(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Double nominal = payload.get("nominalRefund") == null
                ? 0.0 : Double.parseDouble(payload.get("nominalRefund").toString());
        return ResponseEntity.ok(returService.setujui(
                id,
                (String) payload.get("bentukPenyelesaian"),
                nominal,
                Boolean.parseBoolean(String.valueOf(payload.getOrDefault("barangKembali", false))),
                Boolean.parseBoolean(String.valueOf(payload.getOrDefault("layakJual", false))),
                (String) payload.get("catatanAdmin")));
    }

    @PutMapping("/{id}/tolak")
    public ResponseEntity<Retur> tolak(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> payload) {
        String catatan = payload == null ? null : (String) payload.get("catatanAdmin");
        return ResponseEntity.ok(returService.tolak(id, catatan));
    }

    /** Menutup pesanan setelah kendalanya tuntas. */
    @PutMapping("/pesanan/{transactionId}/tutup")
    public ResponseEntity<Transaction> tutup(@PathVariable Long transactionId,
                                             @RequestBody(required = false) Map<String, Object> payload) {
        String catatan = payload == null ? null : (String) payload.get("catatan");
        return ResponseEntity.ok(returService.tutupKendala(transactionId, catatan));
    }

    private String rapikan(String kode) {
        String[] kata = kode.toLowerCase().split("_");
        StringBuilder sb = new StringBuilder();
        for (String k : kata) {
            if (k.isEmpty()) continue;
            sb.append(Character.toUpperCase(k.charAt(0))).append(k.substring(1)).append(" ");
        }
        return sb.toString().trim();
    }
}
