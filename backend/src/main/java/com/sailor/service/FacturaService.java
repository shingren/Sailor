package com.sailor.service;

import com.sailor.dto.FacturaResponseDTO;
import com.sailor.dto.PagoResponseDTO;
import com.sailor.entity.Factura;
import com.sailor.entity.FacturaEstado;
import com.sailor.entity.Pago;
import com.sailor.entity.Pedido;
import com.sailor.entity.PedidoItem;
import com.sailor.exception.FacturaAlreadyExistsException;
import com.sailor.repository.FacturaRepository;
import com.sailor.repository.PagoRepository;
import com.sailor.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public FacturaResponseDTO crearFactura(Long pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido not found with id: " + pedidoId));

        if (!pedido.getEstado().equals("LISTO") && !pedido.getEstado().equals("ENTREGADO")) {
            throw new RuntimeException("Can only generate factura for pedido with estado LISTO or ENTREGADO");
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

        Factura savedFactura = facturaRepository.save(factura);
        return mapToResponseDTO(savedFactura);
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
        if (monto <= 0) {
            throw new RuntimeException("Monto must be greater than 0");
        }

        Factura factura = facturaRepository.findById(facturaId)
                .orElseThrow(() -> new RuntimeException("Factura not found with id: " + facturaId));

        Pago pago = new Pago();
        pago.setFactura(factura);
        pago.setMonto(monto);
        pago.setMetodo(metodo);

        Pago savedPago = pagoRepository.save(pago);
        factura.getPagos().add(savedPago);

        double totalPagado = factura.getPagos().stream()
                .mapToDouble(Pago::getMonto)
                .sum();

        if (totalPagado >= factura.getTotal()) {
            factura.setEstado(FacturaEstado.PAGADA);

            // Update pedido estado to PAGADO
            Pedido pedido = factura.getPedido();
            pedido.setEstado("PAGADO");
            pedidoRepository.save(pedido);
        }

        Factura savedFactura = facturaRepository.save(factura);
        return mapToResponseDTO(savedFactura);
    }

    private FacturaResponseDTO mapToResponseDTO(Factura factura) {
        FacturaResponseDTO dto = new FacturaResponseDTO();
        dto.setId(factura.getId());
        dto.setPedidoId(factura.getPedido().getId());
        dto.setFechaHora(factura.getFechaHora());
        dto.setSubtotal(factura.getSubtotal());
        dto.setImpuestos(factura.getImpuestos());
        dto.setDescuento(factura.getDescuento());
        dto.setTotal(factura.getTotal());
        dto.setEstado(factura.getEstado().name());

        List<PagoResponseDTO> pagos = factura.getPagos().stream()
                .map(this::mapPagoToResponseDTO)
                .collect(Collectors.toList());
        dto.setPagos(pagos);

        return dto;
    }

    private PagoResponseDTO mapPagoToResponseDTO(Pago pago) {
        PagoResponseDTO dto = new PagoResponseDTO();
        dto.setId(pago.getId());
        dto.setMonto(pago.getMonto());
        dto.setMetodo(pago.getMetodo());
        dto.setFechaHora(pago.getFechaHora());
        return dto;
    }
}
