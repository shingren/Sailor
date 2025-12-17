package com.sailor.service;

import com.sailor.dto.FacturaResponseDTO;
import com.sailor.dto.PagoResponseDTO;
import com.sailor.entity.Factura;
import com.sailor.entity.FacturaEstado;
import com.sailor.entity.Mesa;
import com.sailor.entity.Pago;
import com.sailor.entity.Pedido;
import com.sailor.entity.PedidoItem;
import com.sailor.exception.FacturaAlreadyExistsException;
import com.sailor.exception.InvalidPedidoEstadoException;
import com.sailor.exception.PagoInvalidoException;
import com.sailor.exception.FacturaYaPagadaException;
import com.sailor.exception.MontoExcedeSaldoException;
import com.sailor.repository.FacturaRepository;
import com.sailor.repository.MesaRepository;
import com.sailor.repository.PagoRepository;
import com.sailor.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FacturaService {

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private UsuarioService usuarioService;

    @Transactional
    public FacturaResponseDTO crearFactura(Long pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido not found with id: " + pedidoId));

        // Validate that pedido is in ENTREGADO state (business rule)
        if (!pedido.getEstado().equals("ENTREGADO")) {
            throw new InvalidPedidoEstadoException(
                "Solo se puede facturar pedidos en estado ENTREGADO. Estado actual: " + pedido.getEstado()
            );
        }

        // Validate that factura doesn't already exist for this pedido (One-to-One relationship)
        if (facturaRepository.existsByPedido(pedido)) {
            throw new FacturaAlreadyExistsException("Ya existe una factura para el pedido #" + pedidoId);
        }

        double subtotal = pedido.getItems().stream()
                .mapToDouble(item -> {
                    // Base item price
                    double itemTotal = item.getCantidad() * item.getPrecioUnitario();

                    // Add extras price
                    double extrasTotal = item.getExtras().stream()
                            .mapToDouble(extra -> extra.getCantidad() * extra.getPrecioUnitario() * item.getCantidad())
                            .sum();

                    return itemTotal + extrasTotal;
                })
                .sum();

        double impuestos = subtotal * 0.13;
        double descuento = 0.0;
        double total = subtotal + impuestos - descuento;

        Factura factura = new Factura();
        factura.setPedido(pedido);
        factura.setSubtotal(subtotal);
        factura.setImpuestos(impuestos);
        factura.setDescuento(descuento);
        factura.setTotal(total);

        // Set usuario responsable de crear la factura (trazabilidad)
        try {
            factura.setCreadaPorUsuario(usuarioService.getCurrentUsuario());
        } catch (Exception e) {
            // Si no se puede obtener el usuario (ej. problema con SecurityContext),
            // continuar sin trazabilidad en lugar de fallar toda la operación
            System.err.println("Warning: No se pudo obtener usuario actual para trazabilidad: " + e.getMessage());
        }

        try {
            Factura savedFactura = facturaRepository.save(factura);
            return mapToResponseDTO(savedFactura);
        } catch (DataIntegrityViolationException e) {
            // Race condition: otro thread ya creó la factura entre la validación y el save
            // Convertir a excepción de negocio para respuesta HTTP 409 consistente
            throw new FacturaAlreadyExistsException("Ya existe una factura para el pedido #" + pedidoId);
        }
    }

    public List<FacturaResponseDTO> listarFacturas() {
        return facturaRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public FacturaResponseDTO obtenerFactura(Long id) {
        Factura factura = facturaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Factura not found with id: " + id));
        return mapToResponseDTO(factura);
    }

    @Transactional
    public FacturaResponseDTO registrarPago(Long facturaId, double monto, String metodo) {
        // Validación 1: Monto debe ser mayor a 0
        if (monto <= 0) {
            throw new PagoInvalidoException("El monto debe ser mayor a 0");
        }

        Factura factura = facturaRepository.findById(facturaId)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada con id: " + facturaId));

        // Validación 2: Factura debe estar PENDIENTE (no se puede pagar una factura ya PAGADA)
        if (factura.getEstado() == FacturaEstado.PAGADA) {
            throw new FacturaYaPagadaException("No se pueden registrar pagos en una factura que ya está PAGADA");
        }

        // Validación 3: Monto no puede exceder saldo pendiente
        double totalPagadoActual = factura.getPagos().stream()
                .mapToDouble(Pago::getMonto)
                .sum();
        double saldoPendiente = factura.getTotal() - totalPagadoActual;

        if (monto > saldoPendiente) {
            throw new MontoExcedeSaldoException(
                String.format("El monto ($%.2f) excede el saldo pendiente ($%.2f). No se permiten sobrepagos.",
                    monto, saldoPendiente)
            );
        }

        // Crear y persistir el pago
        Pago pago = new Pago();
        pago.setFactura(factura);
        pago.setMonto(monto);
        pago.setMetodo(metodo);

        // Set usuario responsable de registrar el pago (trazabilidad)
        try {
            pago.setRegistradoPorUsuario(usuarioService.getCurrentUsuario());
        } catch (Exception e) {
            // Si no se puede obtener el usuario (ej. problema con SecurityContext),
            // continuar sin trazabilidad en lugar de fallar toda la operación
            System.err.println("Warning: No se pudo obtener usuario actual para trazabilidad: " + e.getMessage());
        }

        Pago savedPago = pagoRepository.save(pago);
        factura.getPagos().add(savedPago);

        // Recalcular total pagado y actualizar estado si está completamente pagado
        double totalPagado = factura.getPagos().stream()
                .mapToDouble(Pago::getMonto)
                .sum();

        if (totalPagado >= factura.getTotal()) {
            factura.setEstado(FacturaEstado.PAGADA);

            // Set fechaHoraPago only once (idempotent)
            if (factura.getFechaHoraPago() == null) {
                factura.setFechaHoraPago(LocalDateTime.now());
            }

            // Update pedido estado to PAGADO
            Pedido pedido = factura.getPedido();
            pedido.setEstado("PAGADO");
            pedidoRepository.save(pedido);

            // Liberar mesa: marcar como disponible si está ocupada
            Mesa mesa = pedido.getMesa();
            if (mesa != null && "ocupada".equalsIgnoreCase(mesa.getEstado())) {
                mesa.setEstado("disponible");
                mesaRepository.save(mesa);
            }
            // Si está reservada, mantener (no romper reservas)
        }

        Factura savedFactura = facturaRepository.save(factura);
        return mapToResponseDTO(savedFactura);
    }

    private FacturaResponseDTO mapToResponseDTO(Factura factura) {
        FacturaResponseDTO dto = new FacturaResponseDTO();
        dto.setId(factura.getId());
        dto.setPedidoId(factura.getPedido().getId());
        dto.setFechaHora(factura.getFechaHora());

        // Trazabilidad: incluir email del usuario que creó la factura (si existe)
        if (factura.getCreadaPorUsuario() != null) {
            dto.setCreadaPor(factura.getCreadaPorUsuario().getEmail());
        }

        dto.setSubtotal(factura.getSubtotal());
        dto.setImpuestos(factura.getImpuestos());
        dto.setDescuento(factura.getDescuento());
        dto.setTotal(factura.getTotal());
        dto.setEstado(factura.getEstado().name());

        List<PagoResponseDTO> pagos = factura.getPagos().stream()
                .map(this::mapPagoToResponseDTO)
                .collect(Collectors.toList());
        dto.setPagos(pagos);

        // Calcular totalPagado y saldoPendiente
        double totalPagado = factura.getPagos().stream()
                .mapToDouble(Pago::getMonto)
                .sum();
        double saldoPendiente = Math.max(factura.getTotal() - totalPagado, 0.0);

        dto.setTotalPagado(totalPagado);
        dto.setSaldoPendiente(saldoPendiente);

        return dto;
    }

    private PagoResponseDTO mapPagoToResponseDTO(Pago pago) {
        PagoResponseDTO dto = new PagoResponseDTO();
        dto.setId(pago.getId());
        dto.setMonto(pago.getMonto());
        dto.setMetodo(pago.getMetodo());
        dto.setFechaHora(pago.getFechaHora());

        // Trazabilidad: incluir email del usuario que registró el pago (si existe)
        if (pago.getRegistradoPorUsuario() != null) {
            dto.setRegistradoPor(pago.getRegistradoPorUsuario().getEmail());
        }

        return dto;
    }
}
