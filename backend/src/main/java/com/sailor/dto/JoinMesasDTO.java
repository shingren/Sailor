package com.sailor.dto;

import java.util.List;

public class JoinMesasDTO {
    private List<Long> mesaIds;

    public JoinMesasDTO() {
    }

    public JoinMesasDTO(List<Long> mesaIds) {
        this.mesaIds = mesaIds;
    }

    public List<Long> getMesaIds() {
        return mesaIds;
    }

    public void setMesaIds(List<Long> mesaIds) {
        this.mesaIds = mesaIds;
    }
}
