package com.sailor.entity;

public enum CuentaEstado {
    ABIERTA,        // Active tab, accepting new pedidos
    CON_FACTURA,    // Invoice generated, awaiting payment
    CERRADA;        // Paid and closed

    public static boolean isValid(String estado) {
        if (estado == null) return false;
        try {
            valueOf(estado);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public static boolean isValidTransition(String from, String to) {
        if (!isValid(from) || !isValid(to)) return false;

        CuentaEstado fromEstado = valueOf(from);
        CuentaEstado toEstado = valueOf(to);

        // ABIERTA -> CON_FACTURA (when invoice is generated)
        // CON_FACTURA -> CERRADA (when invoice is paid)
        // CERRADA is terminal
        if (fromEstado == ABIERTA) {
            return toEstado == CON_FACTURA;
        }
        if (fromEstado == CON_FACTURA) {
            return toEstado == CERRADA;
        }
        return false;
    }
}
