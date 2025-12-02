package com.sailor.dto;

public class UpdateMesaPositionDTO {
    private Double positionX;
    private Double positionY;
    private String zona;

    public UpdateMesaPositionDTO() {
    }

    public UpdateMesaPositionDTO(Double positionX, Double positionY, String zona) {
        this.positionX = positionX;
        this.positionY = positionY;
        this.zona = zona;
    }

    public Double getPositionX() {
        return positionX;
    }

    public void setPositionX(Double positionX) {
        this.positionX = positionX;
    }

    public Double getPositionY() {
        return positionY;
    }

    public void setPositionY(Double positionY) {
        this.positionY = positionY;
    }

    public String getZona() {
        return zona;
    }

    public void setZona(String zona) {
        this.zona = zona;
    }
}
