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

    @PatchMapping("/{id}/precio")
    public ResponseEntity<?> updatePrecio(@PathVariable Long id, @RequestBody PrecioUpdateRequest request) {
        // Validate precio
        if (request.getPrecio() == null || request.getPrecio() <= 0) {
            return ResponseEntity.badRequest().body("{\"error\":\"El precio debe ser mayor a 0\"}");
        }

        return productoRepository.findById(id)
                .map(producto -> {
                    producto.setPrecio(request.getPrecio());
                    Producto updated = productoRepository.save(producto);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Inner class for precio update request
    static class PrecioUpdateRequest {
        private Double precio;

        public Double getPrecio() {
            return precio;
        }

        public void setPrecio(Double precio) {
            this.precio = precio;
        }
    }
}
