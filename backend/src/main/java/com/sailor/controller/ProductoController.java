package com.sailor.controller;

import com.sailor.entity.Producto;
import com.sailor.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/productos")
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    @GetMapping
    public List<Producto> getAllProductos() {
        return productoRepository.findAll();
    }

    @PostMapping
    public Producto createProducto(@RequestBody Producto producto) {
        return productoRepository.save(producto);
    }

    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<Producto> toggleProductoActive(@PathVariable Long id) {
        return productoRepository.findById(id)
                .map(producto -> {
                    producto.setActivo(!producto.isActivo());
                    Producto updated = productoRepository.save(producto);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
