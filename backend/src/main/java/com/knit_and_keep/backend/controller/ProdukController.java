// package com.knit_and_keep.backend.controller;


// import com.knit_and_keep.backend.model.Produk;
// import com.knit_and_keep.backend.repository.ProdukRepository;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;

// @RestController
// @RequestMapping("/api/produk")
// public class ProdukController {

//     @Autowired
//     private ProdukRepository produkRepository;

//     @GetMapping
//     public List<Produk> getAllProduk() {
//         return produkRepository.findAll();
//     }

//     @PostMapping
//     public Produk createProduk(@RequestBody Produk produk) {
//         return produkRepository.save(produk);
//     }

//     @GetMapping("/{id}")
//     public Produk getProdukById(@PathVariable Long id) {
//         return produkRepository.findById(id)
//                 .orElseThrow(() -> new RuntimeException("Produk tidak ditemukan"));
//     }

//     @PutMapping("/{id}")
//     public Produk updateProduk(@PathVariable Long id, @RequestBody Produk produkDetails) {
//         Produk produk = produkRepository.findById(id)
//                 .orElseThrow(() -> new RuntimeException("Produk tidak ditemukan"));
//         produk.setNama(produkDetails.getNama());
//         produk.setHarga(produkDetails.getHarga());
//         produk.setStok(produkDetails.getStok());
//         produk.setDeskripsi(produkDetails.getDeskripsi());
//         produk.setGambarUrl(produkDetails.getGambarUrl());
//         return produkRepository.save(produk);
//     }

//     @DeleteMapping("/{id}")
//     public String deleteProduk(@PathVariable Long id) {
//         produkRepository.deleteById(id);
//         return "Produk berhasil dihapus!";
//     }
// }
