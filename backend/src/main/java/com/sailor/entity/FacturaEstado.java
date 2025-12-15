package com.sailor.entity;

public enum FacturaEstado {
    PENDIENTE,
    PAGADA;

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

        FacturaEstado fromEstado = valueOf(from);
        FacturaEstado toEstado = valueOf(to);

        // PENDIENTE can transition to PAGADA
        // PAGADA is terminal (no further transitions)
        if (fromEstado == PENDIENTE) {
            return toEstado == PAGADA;
        }
        return false;
    }
}
