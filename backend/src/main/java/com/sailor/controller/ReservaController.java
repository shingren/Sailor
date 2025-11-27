package com.sailor.controller;

import com.sailor.dto.ReservaCreateRequestDTO;
import com.sailor.dto.ReservaResponseDTO;
import com.sailor.service.ReservaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reservas")
public class ReservaController {

    @Autowired
    private ReservaService reservaService;

    @PostMapping
    public ReservaResponseDTO crearReserva(@RequestBody ReservaCreateRequestDTO request) {
        return reservaService.crearReserva(request);
    }

    @GetMapping
    public List<ReservaResponseDTO> listarReservas() {
        return reservaService.listarReservas();
    }

    @GetMapping("/{id}")
    public ReservaResponseDTO obtenerReserva(@PathVariable Long id) {
        return reservaService.obtenerReserva(id);
    }

    @PostMapping("/{id}/cancelar")
    public ReservaResponseDTO cancelarReserva(@PathVariable Long id) {
        return reservaService.cancelarReserva(id);
    }
}
