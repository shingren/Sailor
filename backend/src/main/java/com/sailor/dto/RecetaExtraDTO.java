package com.sailor.dto;

public class RecetaExtraDTO {
    private Long id;
    private String nombre;
    private double precio;
    private Long insumoId;
    private String insumoNombre;
    private double cantidadInsumo;

    public RecetaExtraDTO() {
    }

    public RecetaExtraDTO(Long id, String nombre, double precio, Long insumoId, String insumoNombre, double cantidadInsumo) {
        this.id = id;
        this.nombre = nombre;
        this.precio = precio;
        this.insumoId = insumoId;
        this.insumoNombre = insumoNombre;
        this.cantidadInsumo = cantidadInsumo;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public double getPrecio() {
        return precio;
    }

    public void setPrecio(double precio) {
        this.precio = precio;
    }

    public Long getInsumoId() {
        return insumoId;
    }

    public void setInsumoId(Long insumoId) {
        this.insumoId = insumoId;
    }

    public String getInsumoNombre() {
        return insumoNombre;
    }

    public void setInsumoNombre(String insumoNombre) {
        this.insumoNombre = insumoNombre;
    }

    public double getCantidadInsumo() {
        return cantidadInsumo;
    }

    public void setCantidadInsumo(double cantidadInsumo) {
        this.cantidadInsumo = cantidadInsumo;
    }
}
