package com.sailor.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "mesas")
public class Mesa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String codigo;
    private int capacidad;
    private String estado;

    // Floorplan positioning
    private Double positionX;
    private Double positionY;
    private String zona; // INSIDE, TERRACE, BAR

    @Column(name = "group_id")
    private Long groupId; // For joining tables

    @Column(name = "is_locked")
    private Boolean isLocked = false; // Lock table position

    @ManyToOne
    @JoinColumn(name = "location_id")
    private Location location;

    public Mesa() {
    }

    public Mesa(String codigo, int capacidad, String estado) {
        this.codigo = codigo;
        this.capacidad = capacidad;
        this.estado = estado;
        this.zona = "INSIDE"; // Default zone
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public int getCapacidad() {
        return capacidad;
    }

    public void setCapacidad(int capacidad) {
        this.capacidad = capacidad;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
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

    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public Boolean getIsLocked() {
        return isLocked;
    }

    public void setIsLocked(Boolean isLocked) {
        this.isLocked = isLocked;
    }
}
