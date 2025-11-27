package com.sailor.controller;

import com.sailor.dto.PedidoCreateRequestDTO;
import com.sailor.dto.PedidoResponseDTO;
import com.sailor.service.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pedidos")
public class PedidoController {

    @Autowired
    private PedidoService pedidoService;

    @PostMapping
    public PedidoResponseDTO createPedido(@RequestBody PedidoCreateRequestDTO request) {
        return pedidoService.createPedido(request);
    }

    @GetMapping
    public List<PedidoResponseDTO> getAllPedidos() {
        return pedidoService.getAllPedidos();
    }

    @GetMapping("/{id}")
    public PedidoResponseDTO getPedidoById(@PathVariable Long id) {
        return pedidoService.getPedidoById(id);
    }
}
