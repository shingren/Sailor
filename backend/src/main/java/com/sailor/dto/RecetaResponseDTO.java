package com.sailor.dto;

import java.util.List;

public class RecetaResponseDTO {
    private Long id;
    private Long productoId;
    private String productoNombre;
    private List<RecetaItemDTO> items;
    private List<RecetaExtraDTO> extras;

    public RecetaResponseDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductoId() {
        return productoId;
    }

    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }

    public String getProductoNombre() {
        return productoNombre;
    }

    public void setProductoNombre(String productoNombre) {
        this.productoNombre = productoNombre;
    }

    public List<RecetaItemDTO> getItems() {
        return items;
    }

    public void setItems(List<RecetaItemDTO> items) {
        this.items = items;
    }

    public List<RecetaExtraDTO> getExtras() {
        return extras;
    }

    public void setExtras(List<RecetaExtraDTO> extras) {
        this.extras = extras;
    }
}
