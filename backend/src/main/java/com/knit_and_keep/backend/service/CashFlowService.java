package com.knit_and_keep.backend.service;

import com.knit_and_keep.backend.model.CashFlow;
import com.knit_and_keep.backend.repository.CashFlowRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CashFlowService {

    private final CashFlowRepository repository;

    public CashFlowService(CashFlowRepository repository) {
        this.repository = repository;
    }

    /** Awal dan akhir periode; kosong berarti seluruh riwayat. */
    private LocalDateTime awal(LocalDate dari) {
        return dari == null ? LocalDateTime.of(2000, 1, 1, 0, 0) : dari.atStartOfDay();
    }

    private LocalDateTime akhir(LocalDate sampai) {
        return sampai == null ? LocalDateTime.now().plusYears(50) : sampai.atTime(23, 59, 59);
    }

    public List<CashFlow> cari(String jenis, LocalDate dari, LocalDate sampai) {
        return repository.cari(
                jenis == null || jenis.isBlank() ? "" : jenis.toUpperCase(),
                awal(dari), akhir(sampai));
    }

    public Map<String, Object> ringkasan(LocalDate dari, LocalDate sampai) {
        List<CashFlow> semua = cari(null, dari, sampai);

        double masuk = semua.stream()
                .filter(c -> "IN".equalsIgnoreCase(c.getType()))
                .mapToDouble(c -> c.getAmount() == null ? 0 : c.getAmount()).sum();
        double keluar = semua.stream()
                .filter(c -> "OUT".equalsIgnoreCase(c.getType()))
                .mapToDouble(c -> c.getAmount() == null ? 0 : c.getAmount()).sum();

        Map<String, Object> hasil = new LinkedHashMap<>();
        hasil.put("kasMasuk", masuk);
        hasil.put("kasKeluar", keluar);
        hasil.put("saldo", masuk - keluar);
        hasil.put("jumlahCatatan", semua.size());
        return hasil;
    }

    public CashFlow save(CashFlow cashFlow) {
        if (cashFlow.getCategory() == null || cashFlow.getCategory().isBlank()) {
            cashFlow.setCategory("MANUAL");
        }
        return repository.save(cashFlow);
    }

    public void hapus(Long id) {
        repository.deleteById(id);
    }

    /**
     * Dipanggil otomatis oleh alur pesanan, retur, dan pengeluaran.
     * Semua uang yang bergerak di aplikasi lewat sini, jadi arus kas tidak
     * perlu diinput ulang secara manual.
     */
    public CashFlow catat(String type, double amount, String description,
                          String category, String referensi, String channel) {
        CashFlow cf = new CashFlow();
        cf.setType(type);
        cf.setAmount(amount);
        cf.setDescription(description);
        cf.setCategory(category);
        cf.setReferensi(referensi);
        cf.setChannel(channel);
        return repository.save(cf);
    }

    /** Menghapus catatan kas yang mengacu ke satu pesanan atau pengeluaran. */
    @Transactional
    public void hapusByReferensi(String referensi) {
        if (referensi == null || referensi.isBlank()) return;
        repository.hapusByReferensi(referensi);
    }
}
