package com.knit_and_keep.backend.config;

import com.knit_and_keep.backend.model.Address;
import com.knit_and_keep.backend.model.Product;
import com.knit_and_keep.backend.model.User;
import com.knit_and_keep.backend.model.UserPelanggan;
import com.knit_and_keep.backend.repository.AddressRepository;
import com.knit_and_keep.backend.repository.ProductRepository;
import com.knit_and_keep.backend.repository.UserPelangganRepository;
import com.knit_and_keep.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.security.SecureRandom;
import java.util.List;

/**
 * Mengisi data awal supaya aplikasi tidak kosong saat pertama dijalankan
 * atau saat didemokan. Hanya berjalan kalau tabelnya masih kosong.
 */
@Configuration
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final UserPelangganRepository pelangganRepository;
    private final ProductRepository productRepository;
    private final AddressRepository addressRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @org.springframework.beans.factory.annotation.Value("${midtrans.is-production}")
    private boolean produksi;

    @org.springframework.beans.factory.annotation.Value("${app.data-contoh}")
    private boolean dataContoh;

    @org.springframework.beans.factory.annotation.Value("${app.admin-awal.username:admin}")
    private String adminAwalUsername;

    @org.springframework.beans.factory.annotation.Value("${app.admin-awal.email:admin@knitandkeep.com}")
    private String adminAwalEmail;

    @org.springframework.beans.factory.annotation.Value("${app.admin-awal.password:}")
    private String adminAwalPassword;

    public DataSeeder(UserRepository userRepository,
                      UserPelangganRepository pelangganRepository,
                      ProductRepository productRepository,
                      AddressRepository addressRepository) {
        this.userRepository = userRepository;
        this.pelangganRepository = pelangganRepository;
        this.productRepository = productRepository;
        this.addressRepository = addressRepository;
    }

    @Override
    public void run(String... args) {
        if (produksi) {
            siapkanProduksi();
            return;
        }
        // Akun pengelola selalu dibuat, kalau tidak tidak ada yang bisa masuk
        // ke aplikasi yang databasenya masih kosong.
        seedAdmin();

        if (!dataContoh) {
            System.out.println(">> Data contoh dimatikan (DATA_CONTOH=false). "
                    + "Katalog dibiarkan kosong supaya bisa diisi barang sungguhan.");
            return;
        }
        seedPelanggan();
        seedProduk();
    }

    /**
     * Di server, data contoh tidak dibuat sama sekali.
     *
     * Yang paling berbahaya adalah akun bawaan: kalau {@code admin/admin123}
     * ikut terbuat di toko sungguhan, siapa pun yang mengenali proyek ini bisa
     * langsung masuk sebagai pengelola. Karena itu pengelola pertama dibuat
     * dengan kata sandi yang harus disiapkan sendiri lewat variabel lingkungan,
     * atau dibuat acak dan dicetak sekali di log.
     */
    private void siapkanProduksi() {
        if (userRepository.count() > 0) {
            System.out.println(">> Mode produksi. Data contoh dilewati.");
            return;
        }

        String sandi = (adminAwalPassword == null || adminAwalPassword.isBlank())
                ? sandiAcak()
                : adminAwalPassword;

        User admin = new User();
        admin.setUsername(adminAwalUsername);
        admin.setEmail(adminAwalEmail);
        admin.setPassword(encoder.encode(sandi));
        admin.setRole("ADMIN");
        userRepository.save(admin);

        System.out.println("""

                ==================== PENGELOLA PERTAMA DIBUAT ====================
                  Nama pengguna : %s
                  Kata sandi    : %s

                  Segera masuk lalu ganti kata sandinya. Pesan ini hanya muncul
                  sekali, dan tidak akan dicetak lagi setelah ini.
                ==================================================================
                """.formatted(adminAwalUsername, sandi));
    }

    private String sandiAcak() {
        String huruf = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        SecureRandom acak = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 16; i++) sb.append(huruf.charAt(acak.nextInt(huruf.length())));
        return sb.toString();
    }

    private void seedAdmin() {
        if (userRepository.count() > 0) return;
        User admin = new User();
        admin.setUsername("admin");
        admin.setEmail("admin@knitandkeep.com");
        admin.setPassword(encoder.encode("admin123"));
        admin.setRole("ADMIN");
        userRepository.save(admin);
        System.out.println(">> Akun admin dibuat: admin / admin123");
    }

    private void seedPelanggan() {
        if (pelangganRepository.count() > 0) return;

        UserPelanggan p = new UserPelanggan();
        p.setUsername("pelanggan");
        p.setEmail("pelanggan@mail.com");
        p.setPassword(encoder.encode("pelanggan123"));
        p.setAktif(true);
        UserPelanggan tersimpan = pelangganRepository.save(p);
        System.out.println(">> Akun pelanggan dibuat: pelanggan / pelanggan123");

        // Alamat contoh lengkap dengan titik kirim yang dikenali kurir, supaya
        // ongkos kirim bisa langsung dicoba tanpa harus mencari wilayah dulu.
        // Pencarian wilayah memakai kuota harian RajaOngkir, jadi lebih baik
        // tidak dihabiskan hanya untuk menyiapkan data awal.
        Address a = new Address();
        a.setPelanggan(tersimpan);
        a.setNamaPenerima("Budi Santoso");
        a.setTeleponPenerima("081234512345");
        a.setDetailAlamat("Jl. Melati No. 12, sebelah warung Bu Ani");
        a.setRt("003");
        a.setRw("005");
        a.setProvinsi("JAWA BARAT");
        a.setKabupaten("BANDUNG");
        a.setKecamatan("CIBIRU");
        a.setKelurahan("CIPADUNG");
        a.setKodePos("40614");
        a.setDestinationId("4817");
        a.setLabelTujuan("CIPADUNG, CIBIRU, BANDUNG, JAWA BARAT, 40614");
        a.setUtama(true);
        addressRepository.save(a);
        System.out.println(">> Alamat contoh ditambahkan untuk akun pelanggan");
    }

    private void seedProduk() {
        if (productRepository.count() > 0) return;

        List<Product> contoh = List.of(
                buat("KNK-001", "Sweater Rajut Wol Krem", "Sweater", "M", "Krem", 55_000, 145_000, 6, 600),
                buat("KNK-002", "Cardigan Rajut Vintage", "Cardigan", "L", "Cokelat", 62_000, 165_000, 4, 650),
                buat("KNK-003", "Kemeja Flanel Kotak", "Kemeja", "M", "Merah Hitam", 38_000, 98_000, 8, 400),
                buat("KNK-004", "Jaket Denim Oversize", "Jaket", "XL", "Biru", 85_000, 210_000, 3, 900),
                buat("KNK-005", "Kaos Band Retro", "Kaos", "L", "Hitam", 25_000, 75_000, 12, 250),
                buat("KNK-006", "Rok Plisket Wol", "Rok", "S", "Abu-abu", 42_000, 110_000, 5, 350),
                buat("KNK-007", "Syal Rajut Tangan", "Aksesori", "All Size", "Mustard", 18_000, 55_000, 15, 150),
                buat("KNK-008", "Blazer Wol Klasik", "Blazer", "M", "Navy", 95_000, 245_000, 2, 800),
                buat("KNK-009", "Celana Chino Corduroy", "Celana", "32", "Cokelat Muda", 48_000, 125_000, 7, 500),
                buat("KNK-010", "Topi Beanie Rajut", "Aksesori", "All Size", "Hijau Botol", 15_000, 48_000, 20, 120)
        );

        productRepository.saveAll(contoh);
        System.out.println(">> " + contoh.size() + " produk contoh ditambahkan");
    }

    private Product buat(String sku, String nama, String kategori, String ukuran, String warna,
                         double modal, double jual, int stok, int berat) {
        Product p = new Product();
        p.setSku(sku);
        p.setName(nama);
        p.setCategory(kategori);
        p.setSize(ukuran);
        p.setColor(warna);
        p.setCostPrice(modal);
        p.setSellPrice(jual);
        p.setStock(stok);
        p.setSupplier("Thrift Supplier Bandung");
        p.setWeight(berat);
        return p;
    }
}
