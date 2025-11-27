package com.sailor.dto;

public class PedidoItemRequestDTO {
    private Long productoId;
    private int cantidad;

    public PedidoItemRequestDTO() {
    }

    public Long getProductoId() {
        return productoId;
    }

    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }
}
