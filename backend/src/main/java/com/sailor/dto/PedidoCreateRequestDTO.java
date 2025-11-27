package com.sailor.dto;

import java.util.List;

public class PedidoCreateRequestDTO {
    private Long mesaId;
    private String observaciones;
    private List<PedidoItemRequestDTO> items;

    public PedidoCreateRequestDTO() {
    }

    public Long getMesaId() {
        return mesaId;
    }

    public void setMesaId(Long mesaId) {
        this.mesaId = mesaId;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public List<PedidoItemRequestDTO> getItems() {
        return items;
    }

    public void setItems(List<PedidoItemRequestDTO> items) {
        this.items = items;
    }
}
