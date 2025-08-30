package com.knit_and_keep.backend.controller;


import com.knit_and_keep.backend.model.Inventory;
import com.knit_and_keep.backend.service.InventoryService;

// import com.knit_and_keep.backend.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "http://localhost:5173") // sesuaikan port React
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping
    public List<Inventory> getAll() {
        return inventoryService.getAll();
    }

    @GetMapping("/{id}")
    public Inventory getById(@PathVariable Long id) {
        return inventoryService.getById(id);
    }

    @PostMapping
    public Inventory create(@RequestBody Inventory inventory) {
        return inventoryService.create(inventory);
    }

    @PutMapping("/{id}")
    public Inventory update(@PathVariable Long id, @RequestBody Inventory inventory) {
        return inventoryService.update(id, inventory);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        inventoryService.delete(id);
    }
}

