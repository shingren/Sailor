package com.sailor.service;

import com.sailor.dto.ClienteCreateRequestDTO;
import com.sailor.dto.ClienteResponseDTO;
import com.sailor.entity.Cliente;
import com.sailor.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    public Optional<ClienteResponseDTO> buscarPorIdentificacion(String identificacionFiscal) {
        return clienteRepository.findByIdentificacionFiscal(identificacionFiscal)
                .map(this::mapToResponseDTO);
    }

    public List<ClienteResponseDTO> listarClientes() {
        return clienteRepository.findAll().stream()
                .filter(Cliente::isActivo)
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClienteResponseDTO crearCliente(ClienteCreateRequestDTO request) {
        // Validar que no exista ya un cliente con esta identificación
        Optional<Cliente> existente = clienteRepository.findByIdentificacionFiscal(
                request.getIdentificacionFiscal());

        if (existente.isPresent()) {
            throw new RuntimeException("Ya existe un cliente con la identificación fiscal: "
                    + request.getIdentificacionFiscal());
        }

        Cliente cliente = new Cliente();
        cliente.setNombre(request.getNombre());
        cliente.setIdentificacionFiscal(request.getIdentificacionFiscal());
        cliente.setDireccion(request.getDireccion());
        cliente.setEmail(request.getEmail());
        cliente.setTelefono(request.getTelefono());
        cliente.setActivo(true);

        Cliente savedCliente = clienteRepository.save(cliente);
        return mapToResponseDTO(savedCliente);
    }

    @Transactional
    public ClienteResponseDTO actualizarCliente(Long id, ClienteCreateRequestDTO request) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente not found with id: " + id));

        // Update fields
        cliente.setNombre(request.getNombre());
        cliente.setDireccion(request.getDireccion());
        cliente.setEmail(request.getEmail());
        cliente.setTelefono(request.getTelefono());

        Cliente savedCliente = clienteRepository.save(cliente);
        return mapToResponseDTO(savedCliente);
    }

    private ClienteResponseDTO mapToResponseDTO(Cliente cliente) {
        ClienteResponseDTO dto = new ClienteResponseDTO();
        dto.setId(cliente.getId());
        dto.setNombre(cliente.getNombre());
        dto.setIdentificacionFiscal(cliente.getIdentificacionFiscal());
        dto.setDireccion(cliente.getDireccion());
        dto.setEmail(cliente.getEmail());
        dto.setTelefono(cliente.getTelefono());
        dto.setActivo(cliente.isActivo());
        return dto;
    }
}
