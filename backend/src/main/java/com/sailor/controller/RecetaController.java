package com.sailor.controller;

import com.sailor.dto.RecetaCreateRequestDTO;
import com.sailor.dto.RecetaResponseDTO;
import com.sailor.service.RecetaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recetas")
public class RecetaController {

    @Autowired
    private RecetaService recetaService;

    @PostMapping
    public RecetaResponseDTO createReceta(@RequestBody RecetaCreateRequestDTO request) {
        return recetaService.createReceta(request.getProductoId(), request.getItems(), request.getExtras());
    }

    @GetMapping
    public List<RecetaResponseDTO> listRecetas() {
        return recetaService.listRecetas();
    }

    @GetMapping("/{productoId}")
    public RecetaResponseDTO getRecetaByProducto(@PathVariable Long productoId) {
        return recetaService.getRecetaByProducto(productoId);
    }
}
