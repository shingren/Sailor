package com.sailor.service;

import com.sailor.dto.DashboardResumenDTO;
import com.sailor.entity.Factura;
import com.sailor.repository.FacturaRepository;
import com.sailor.repository.MesaRepository;
import com.sailor.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DashboardService {

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    public DashboardResumenDTO getResumenHoy() {
        // Calculate today's total sales from paid invoices
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);

        List<Factura> facturasPagadas = facturaRepository.findAll().stream()
                .filter(f -> f.getEstado().equals("PAGADA"))
                .filter(f -> f.getFechaHora().isAfter(startOfDay) && f.getFechaHora().isBefore(endOfDay))
                .toList();

        double todayTotalSales = facturasPagadas.stream()
                .mapToDouble(Factura::getTotal)
                .sum();

        // Count open/occupied tables
        int openTablesCount = (int) mesaRepository.findAll().stream()
                .filter(m -> m.getEstado().equals("OCUPADA"))
                .count();

        // Count pending orders (PENDIENTE or EN_PREPARACION)
        int pendingOrdersCount = (int) pedidoRepository.findAll().stream()
                .filter(p -> p.getEstado().equals("PENDIENTE") || p.getEstado().equals("EN_PREPARACION"))
                .count();

        return new DashboardResumenDTO(todayTotalSales, openTablesCount, pendingOrdersCount);
    }
}
