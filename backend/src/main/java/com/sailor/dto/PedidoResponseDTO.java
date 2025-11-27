package com.sailor.dto;

import java.time.LocalDateTime;
import java.util.List;

public class PedidoResponseDTO {
    private Long id;
    private Long mesaId;
    private String mesaCodigo;
    private LocalDateTime fechaHora;
    private String estado;
    private String observaciones;
    private List<PedidoItemResponseDTO> items;

    public PedidoResponseDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMesaId() {
        return mesaId;
    }

    public void setMesaId(Long mesaId) {
        this.mesaId = mesaId;
    }

    public String getMesaCodigo() {
        return mesaCodigo;
    }

    public void setMesaCodigo(String mesaCodigo) {
        this.mesaCodigo = mesaCodigo;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public List<PedidoItemResponseDTO> getItems() {
        return items;
    }

    public void setItems(List<PedidoItemResponseDTO> items) {
        this.items = items;
    }
}
