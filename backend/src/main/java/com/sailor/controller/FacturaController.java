package com.sailor.controller;

import com.sailor.dto.FacturaCreateRequestDTO;
import com.sailor.dto.FacturaResponseDTO;
import com.sailor.service.FacturaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/facturas")
public class FacturaController {

    @Autowired
    private FacturaService facturaService;

    @PostMapping
    public FacturaResponseDTO crearFactura(@RequestBody FacturaCreateRequestDTO request) {
        return facturaService.crearFactura(request);
    }

    @GetMapping
    public List<FacturaResponseDTO> listarFacturas() {
        return facturaService.listarFacturas();
    }

    @GetMapping("/{id}")
    public FacturaResponseDTO obtenerFactura(@PathVariable Long id) {
        return facturaService.obtenerFactura(id);
    }
}
