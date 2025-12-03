package com.sailor.controller;

import com.sailor.dto.InsumoCreateRequestDTO;
import com.sailor.dto.InsumoResponseDTO;
import com.sailor.dto.InsumoUpdateRequestDTO;
import com.sailor.dto.MovimientoCreateRequestDTO;
import com.sailor.dto.MovimientoResponseDTO;
import com.sailor.service.InsumoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/insumos")
public class InsumoController {

    @Autowired
    private InsumoService insumoService;

    @PostMapping
    public InsumoResponseDTO createInsumo(@RequestBody InsumoCreateRequestDTO request) {
        return insumoService.createInsumo(
                request.getNombre(),
                request.getUnidad(),
                request.getStockActual(),
                request.getStockMinimo()
        );
    }

    @GetMapping
    public List<InsumoResponseDTO> listInsumos() {
        return insumoService.listInsumos();
    }

    @PutMapping("/{id}")
    public InsumoResponseDTO updateInsumo(@PathVariable Long id, @RequestBody InsumoUpdateRequestDTO request) {
        return insumoService.updateInsumo(id, request);
    }

    @PostMapping("/movimientos")
    public MovimientoResponseDTO createMovimiento(@RequestBody MovimientoCreateRequestDTO request) {
        return insumoService.createMovimiento(request);
    }

    @GetMapping("/movimientos")
    public List<MovimientoResponseDTO> listMovimientos() {
        return insumoService.listMovimientos();
    }
}
