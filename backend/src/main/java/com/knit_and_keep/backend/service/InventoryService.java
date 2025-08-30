package com.knit_and_keep.backend.service;


import com.knit_and_keep.backend.model.Inventory;
import com.knit_and_keep.backend.repository.InventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;

    public List<Inventory> getAll() {
        return inventoryRepository.findAll();
    }

    public Inventory getById(Long id) {
        return inventoryRepository.findById(id).orElse(null);
    }

    public Inventory create(Inventory inventory) {
        return inventoryRepository.save(inventory);
    }

    public Inventory update(Long id, Inventory inventory) {
        Inventory existing = inventoryRepository.findById(id).orElse(null);
        if (existing != null) {
            existing.setProductName(inventory.getProductName());
            existing.setStock(inventory.getStock());
            existing.setPrice(inventory.getPrice());
            existing.setCategory(inventory.getCategory());
            return inventoryRepository.save(existing);
        }
        return null;
    }

    public void delete(Long id) {
        inventoryRepository.deleteById(id);
    }
}
