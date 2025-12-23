package com.sailor.controller;

import com.sailor.dto.CuentaResponseDTO;
import com.sailor.service.CuentaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cuentas")
public class CuentaController {

    @Autowired
    private CuentaService cuentaService;

    /**
     * Get all open cuentas (for "Ordenes Abiertas" section in UI)
     */
    @GetMapping("/abiertas")
    public List<CuentaResponseDTO> getCuentasAbiertas() {
        return cuentaService.getCuentasAbiertas();
    }

    /**
     * Get cuentas ready for invoicing (for "Pedidos Listos para Facturar" section in UI)
     */
    @GetMapping("/listas-facturar")
    public List<CuentaResponseDTO> getCuentasListasParaFacturar() {
        return cuentaService.getCuentasListasParaFacturar();
    }

    /**
     * Get cuenta by ID
     */
    @GetMapping("/{id}")
    public CuentaResponseDTO getCuentaById(@PathVariable Long id) {
        return cuentaService.getCuentaById(id)
                .orElseThrow(() -> new RuntimeException("Cuenta not found with id: " + id));
    }
}
