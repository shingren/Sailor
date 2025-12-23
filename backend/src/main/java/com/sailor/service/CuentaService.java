package com.sailor.service;

import com.sailor.dto.CuentaResponseDTO;
import com.sailor.dto.PedidoItemExtraResponseDTO;
import com.sailor.dto.PedidoItemResponseDTO;
import com.sailor.dto.PedidoResponseDTO;
import com.sailor.entity.*;
import com.sailor.repository.CuentaRepository;
import com.sailor.repository.MesaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CuentaService {

    @Autowired
    private CuentaRepository cuentaRepository;

    @Autowired
    private MesaRepository mesaRepository;

    /**
     * Find or create an open Cuenta for a mesa.
     * Used when creating a new pedido - automatically associates to existing open cuenta or creates new one.
     */
    @Transactional
    public Cuenta findOrCreateOpenCuenta(Mesa mesa, Usuario usuario) {
        Optional<Cuenta> existingCuenta = cuentaRepository.findByMesaAndEstado(mesa, CuentaEstado.ABIERTA);

        if (existingCuenta.isPresent()) {
            return existingCuenta.get();
        }

        // Create new cuenta
        Cuenta newCuenta = new Cuenta();
        newCuenta.setMesa(mesa);
        newCuenta.setEstado(CuentaEstado.ABIERTA);
        newCuenta.setFechaHoraApertura(LocalDateTime.now());
        newCuenta.setCreadaPorUsuario(usuario);

        return cuentaRepository.save(newCuenta);
    }

    /**
     * Get all open cuentas for "Ordenes Abiertas" section
     */
    public List<CuentaResponseDTO> getCuentasAbiertas() {
        List<Cuenta> cuentas = cuentaRepository.findByEstado(CuentaEstado.ABIERTA);
        return cuentas.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get cuentas ready for invoicing for "Pedidos Listos para Facturar" section.
     * A cuenta is ready if:
     * - Has at least 1 ENTREGADO pedido
     * - All pedidos are ENTREGADO (or PAGADO)
     * - No factura exists yet
     */
    public List<CuentaResponseDTO> getCuentasListasParaFacturar() {
        List<Cuenta> cuentas = cuentaRepository.findCuentasListasParaFacturar();
        return cuentas.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get cuenta by ID
     */
    public Optional<CuentaResponseDTO> getCuentaById(Long id) {
        return cuentaRepository.findById(id)
                .map(this::mapToResponseDTO);
    }

    /**
     * Close cuenta (called when factura is paid)
     */
    @Transactional
    public void closeCuenta(Long cuentaId) {
        Cuenta cuenta = cuentaRepository.findById(cuentaId)
                .orElseThrow(() -> new RuntimeException("Cuenta not found with id: " + cuentaId));

        cuenta.setEstado(CuentaEstado.CERRADA);
        cuenta.setFechaHoraCierre(LocalDateTime.now());
        cuentaRepository.save(cuenta);
    }

    /**
     * Update cuenta estado to CON_FACTURA (called when factura is generated)
     */
    @Transactional
    public void markCuentaConFactura(Long cuentaId) {
        Cuenta cuenta = cuentaRepository.findById(cuentaId)
                .orElseThrow(() -> new RuntimeException("Cuenta not found with id: " + cuentaId));

        cuenta.setEstado(CuentaEstado.CON_FACTURA);
        cuentaRepository.save(cuenta);
    }

    /**
     * Map Cuenta entity to CuentaResponseDTO with all calculations
     */
    private CuentaResponseDTO mapToResponseDTO(Cuenta cuenta) {
        CuentaResponseDTO dto = new CuentaResponseDTO();
        dto.setId(cuenta.getId());
        dto.setMesaId(cuenta.getMesa().getId());
        dto.setMesaCodigo(cuenta.getMesa().getCodigo());
        dto.setEstado(cuenta.getEstado().name());
        dto.setFechaHoraApertura(cuenta.getFechaHoraApertura());
        dto.setFechaHoraCierre(cuenta.getFechaHoraCierre());

        if (cuenta.getCreadaPorUsuario() != null) {
            dto.setCreadaPorUsuarioEmail(cuenta.getCreadaPorUsuario().getEmail());
        }

        // Calculate summary fields
        List<Pedido> pedidos = cuenta.getPedidos();
        dto.setTotalPedidos(pedidos.size());

        long entregados = pedidos.stream()
                .filter(p -> "ENTREGADO".equals(p.getEstado()) || "PAGADO".equals(p.getEstado()))
                .count();
        dto.setPedidosEntregados((int) entregados);

        long pendientes = pedidos.stream()
                .filter(p -> "PENDIENTE".equals(p.getEstado()) ||
                             "PREPARACION".equals(p.getEstado()) ||
                             "LISTO".equals(p.getEstado()))
                .count();
        dto.setPedidosPendientes((int) pendientes);

        // Calculate total from ENTREGADO pedidos only
        double total = pedidos.stream()
                .filter(p -> "ENTREGADO".equals(p.getEstado()))
                .mapToDouble(this::calculatePedidoTotal)
                .sum();
        dto.setTotalEstimado(total);

        // Map pedidos to DTOs
        List<PedidoResponseDTO> pedidoDTOs = pedidos.stream()
                .map(this::mapPedidoToResponseDTO)
                .collect(Collectors.toList());
        dto.setPedidos(pedidoDTOs);

        return dto;
    }

    /**
     * Calculate total for a single pedido (items + extras)
     */
    private double calculatePedidoTotal(Pedido pedido) {
        double itemsTotal = pedido.getItems().stream()
                .mapToDouble(item -> {
                    double itemTotal = item.getCantidad() * item.getPrecioUnitario();
                    double extrasTotal = item.getExtras().stream()
                            .mapToDouble(extra -> extra.getCantidad() * extra.getPrecioUnitario() * item.getCantidad())
                            .sum();
                    return itemTotal + extrasTotal;
                })
                .sum();
        return itemsTotal;
    }

    /**
     * Map Pedido to PedidoResponseDTO (similar to PedidoService)
     */
    private PedidoResponseDTO mapPedidoToResponseDTO(Pedido pedido) {
        PedidoResponseDTO dto = new PedidoResponseDTO();
        dto.setId(pedido.getId());
        dto.setMesaId(pedido.getMesa().getId());
        dto.setMesaCodigo(pedido.getMesa().getCodigo());
        dto.setFechaHora(pedido.getFechaHora());
        dto.setEstado(pedido.getEstado());
        dto.setObservaciones(pedido.getObservaciones());

        List<PedidoItemResponseDTO> items = pedido.getItems().stream()
                .map(this::mapItemToResponseDTO)
                .collect(Collectors.toList());
        dto.setItems(items);

        return dto;
    }

    /**
     * Map PedidoItem to PedidoItemResponseDTO
     */
    private PedidoItemResponseDTO mapItemToResponseDTO(PedidoItem item) {
        PedidoItemResponseDTO dto = new PedidoItemResponseDTO();
        dto.setId(item.getId());
        dto.setProductoId(item.getProducto().getId());
        dto.setProductoNombre(item.getProducto().getNombre());
        dto.setCantidad(item.getCantidad());
        dto.setPrecioUnitario(item.getPrecioUnitario());

        // Map extras
        List<PedidoItemExtraResponseDTO> extras = item.getExtras().stream()
                .map(this::mapExtraToResponseDTO)
                .collect(Collectors.toList());
        dto.setExtras(extras);

        return dto;
    }

    /**
     * Map PedidoItemExtra to PedidoItemExtraResponseDTO
     */
    private PedidoItemExtraResponseDTO mapExtraToResponseDTO(PedidoItemExtra extra) {
        PedidoItemExtraResponseDTO dto = new PedidoItemExtraResponseDTO();
        dto.setId(extra.getId());
        dto.setNombre(extra.getRecetaExtra().getNombre());
        dto.setCantidad(extra.getCantidad());
        dto.setPrecioUnitario(extra.getPrecioUnitario());
        return dto;
    }
}
