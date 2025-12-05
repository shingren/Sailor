package com.sailor.dto;

import java.util.List;

public class RecetaCreateRequestDTO {
    private Long productoId;
    private List<RecetaItemDTO> items;
    private List<RecetaExtraDTO> extras;

    public RecetaCreateRequestDTO() {
    }

    public Long getProductoId() {
        return productoId;
    }

    public void setProductoId(Long productoId) {
        this.productoId = productoId;
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
