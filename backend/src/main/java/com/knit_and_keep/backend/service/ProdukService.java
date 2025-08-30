// package com.knit_and_keep.backend.service;

// import com.knit_and_keep.backend.model.Produk;
// import com.knit_and_keep.backend.repository.ProdukRepository;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Service;

// import java.util.List;

// @Service
// public class ProdukService {

//     @Autowired
//     private ProdukRepository repository;

//     // CREATE
//     public Produk tambahProduk(Produk produk) {
//         return repository.save(produk);
//     }

//     // READ (semua produk)
//     public List<Produk> getAllProduk() {
//         return repository.findAll();
//     }

//     // READ (by id)
//     public Produk getProdukById(Long id) {
//         return repository.findById(id)
//                 .orElseThrow(() -> new RuntimeException("Produk dengan ID " + id + " tidak ditemukan"));
//     }

//     // UPDATE
//     public Produk updateProduk(Long id, Produk produkBaru) {
//         Produk produk = getProdukById(id);
//         produk.setNama(produkBaru.getNama());
//         produk.setHarga(produkBaru.getHarga());
//         produk.setStok(produkBaru.getStok());
//         produk.setDeskripsi(produkBaru.getDeskripsi());
//         produk.setGambarUrl(produkBaru.getGambarUrl());
//         return repository.save(produk);
//     }

//     // DELETE
//     public void hapusProduk(Long id) {
//         repository.deleteById(id);
//     }
// }
