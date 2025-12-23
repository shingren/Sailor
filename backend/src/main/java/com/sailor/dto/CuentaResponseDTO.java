package com.sailor.dto;

import java.time.LocalDateTime;
import java.util.List;

public class CuentaResponseDTO {
    private Long id;
    private Long mesaId;
    private String mesaCodigo;
    private String estado;
    private LocalDateTime fechaHoraApertura;
    private LocalDateTime fechaHoraCierre;
    private String creadaPorUsuarioEmail;

    // Summary fields
    private int totalPedidos;
    private int pedidosEntregados;
    private int pedidosPendientes;  // PENDIENTE + PREPARACION + LISTO
    private double totalEstimado;    // Sum of ENTREGADO pedidos only

    // Pedidos in this cuenta
    private List<PedidoResponseDTO> pedidos;

    public CuentaResponseDTO() {
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

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDateTime getFechaHoraApertura() {
        return fechaHoraApertura;
    }

    public void setFechaHoraApertura(LocalDateTime fechaHoraApertura) {
        this.fechaHoraApertura = fechaHoraApertura;
    }

    public LocalDateTime getFechaHoraCierre() {
        return fechaHoraCierre;
    }

    public void setFechaHoraCierre(LocalDateTime fechaHoraCierre) {
        this.fechaHoraCierre = fechaHoraCierre;
    }

    public String getCreadaPorUsuarioEmail() {
        return creadaPorUsuarioEmail;
    }

    public void setCreadaPorUsuarioEmail(String creadaPorUsuarioEmail) {
        this.creadaPorUsuarioEmail = creadaPorUsuarioEmail;
    }

    public int getTotalPedidos() {
        return totalPedidos;
    }

    public void setTotalPedidos(int totalPedidos) {
        this.totalPedidos = totalPedidos;
    }

    public int getPedidosEntregados() {
        return pedidosEntregados;
    }

    public void setPedidosEntregados(int pedidosEntregados) {
        this.pedidosEntregados = pedidosEntregados;
    }

    public int getPedidosPendientes() {
        return pedidosPendientes;
    }

    public void setPedidosPendientes(int pedidosPendientes) {
        this.pedidosPendientes = pedidosPendientes;
    }

    public double getTotalEstimado() {
        return totalEstimado;
    }

    public void setTotalEstimado(double totalEstimado) {
        this.totalEstimado = totalEstimado;
    }

    public List<PedidoResponseDTO> getPedidos() {
        return pedidos;
    }

    public void setPedidos(List<PedidoResponseDTO> pedidos) {
        this.pedidos = pedidos;
    }
}
