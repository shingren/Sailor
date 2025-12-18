package com.sailor.controller;

import com.sailor.dto.ClienteCreateRequestDTO;
import com.sailor.dto.ClienteResponseDTO;
import com.sailor.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @GetMapping("/buscar")
    public ResponseEntity<ClienteResponseDTO> buscarPorIdentificacion(
            @RequestParam String identificacion) {
        return clienteService.buscarPorIdentificacion(identificacion)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<ClienteResponseDTO> listarClientes() {
        return clienteService.listarClientes();
    }

    @PostMapping
    public ResponseEntity<ClienteResponseDTO> crearCliente(
            @RequestBody ClienteCreateRequestDTO request) {
        ClienteResponseDTO cliente = clienteService.crearCliente(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(cliente);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteResponseDTO> actualizarCliente(
            @PathVariable Long id,
            @RequestBody ClienteCreateRequestDTO request) {
        ClienteResponseDTO cliente = clienteService.actualizarCliente(id, request);
        return ResponseEntity.ok(cliente);
    }
}
