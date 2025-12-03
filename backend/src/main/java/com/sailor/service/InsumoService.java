package com.sailor.service;

import com.sailor.dto.InsumoResponseDTO;
import com.sailor.dto.InsumoUpdateRequestDTO;
import com.sailor.dto.MovimientoCreateRequestDTO;
import com.sailor.dto.MovimientoResponseDTO;
import com.sailor.entity.Insumo;
import com.sailor.entity.MovimientoInsumo;
import com.sailor.repository.InsumoRepository;
import com.sailor.repository.MovimientoInsumoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InsumoService {

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private MovimientoInsumoRepository movimientoInsumoRepository;

    @Transactional
    public InsumoResponseDTO createInsumo(String nombre, String unidad, double stockActual, double stockMinimo) {
        Insumo insumo = new Insumo();
        insumo.setNombre(nombre);
        insumo.setUnidad(unidad);
        insumo.setStockActual(stockActual);
        insumo.setStockMinimo(stockMinimo);

        Insumo saved = insumoRepository.save(insumo);
        return mapToResponseDTO(saved);
    }

    public List<InsumoResponseDTO> listInsumos() {
        return insumoRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public InsumoResponseDTO updateInsumo(Long id, InsumoUpdateRequestDTO request) {
        Insumo insumo = insumoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Insumo no encontrado con id: " + id));

        insumo.setNombre(request.getNombre());
        insumo.setUnidad(request.getUnidad());
        insumo.setStockMinimo(request.getStockMinimo());

        Insumo updated = insumoRepository.save(insumo);
        return mapToResponseDTO(updated);
    }

    @Transactional
    public MovimientoResponseDTO createMovimiento(MovimientoCreateRequestDTO request) {
        Insumo insumo = insumoRepository.findById(request.getInsumoId())
                .orElseThrow(() -> new RuntimeException("Insumo not found with id: " + request.getInsumoId()));

        MovimientoInsumo movimiento = new MovimientoInsumo();
        movimiento.setInsumo(insumo);
        movimiento.setCantidad(request.getCantidad());
        movimiento.setTipo(request.getTipo());
        movimiento.setDescripcion(request.getDescripcion());

        insumo.setStockActual(insumo.getStockActual() + request.getCantidad());

        MovimientoInsumo saved = movimientoInsumoRepository.save(movimiento);
        insumoRepository.save(insumo);

        return mapMovimientoToResponseDTO(saved);
    }

    public List<MovimientoResponseDTO> listMovimientos() {
        return movimientoInsumoRepository.findAll().stream()
                .map(this::mapMovimientoToResponseDTO)
                .collect(Collectors.toList());
    }

    private InsumoResponseDTO mapToResponseDTO(Insumo insumo) {
        InsumoResponseDTO dto = new InsumoResponseDTO();
        dto.setId(insumo.getId());
        dto.setNombre(insumo.getNombre());
        dto.setUnidad(insumo.getUnidad());
        dto.setStockActual(insumo.getStockActual());
        dto.setStockMinimo(insumo.getStockMinimo());
        return dto;
    }

    private MovimientoResponseDTO mapMovimientoToResponseDTO(MovimientoInsumo movimiento) {
        MovimientoResponseDTO dto = new MovimientoResponseDTO();
        dto.setId(movimiento.getId());
        dto.setInsumoId(movimiento.getInsumo().getId());
        dto.setInsumoNombre(movimiento.getInsumo().getNombre());
        dto.setCantidad(movimiento.getCantidad());
        dto.setTipo(movimiento.getTipo());
        dto.setFechaHora(movimiento.getFechaHora());
        dto.setDescripcion(movimiento.getDescripcion());
        return dto;
    }
}
