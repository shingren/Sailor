package com.sailor.dto;

public class FacturaCreateRequestDTO {
    private Long pedidoId;
    private boolean esConsumidorFinal = true;

    // Datos fiscales del cliente (solo si NO es consumidor final)
    private String clienteIdentificacionFiscal;
    private String clienteNombre;
    private String clienteDireccion;
    private String clienteEmail;
    private String clienteTelefono;

    // Si true, crea/actualiza el cliente para uso futuro
    private boolean guardarCliente = false;

    public FacturaCreateRequestDTO() {
    }

    public Long getPedidoId() {
        return pedidoId;
    }

    public void setPedidoId(Long pedidoId) {
        this.pedidoId = pedidoId;
    }

    public boolean isEsConsumidorFinal() {
        return esConsumidorFinal;
    }

    public void setEsConsumidorFinal(boolean esConsumidorFinal) {
        this.esConsumidorFinal = esConsumidorFinal;
    }

    public String getClienteIdentificacionFiscal() {
        return clienteIdentificacionFiscal;
    }

    public void setClienteIdentificacionFiscal(String clienteIdentificacionFiscal) {
        this.clienteIdentificacionFiscal = clienteIdentificacionFiscal;
    }

    public String getClienteNombre() {
        return clienteNombre;
    }

    public void setClienteNombre(String clienteNombre) {
        this.clienteNombre = clienteNombre;
    }

    public String getClienteDireccion() {
        return clienteDireccion;
    }

    public void setClienteDireccion(String clienteDireccion) {
        this.clienteDireccion = clienteDireccion;
    }

    public String getClienteEmail() {
        return clienteEmail;
    }

    public void setClienteEmail(String clienteEmail) {
        this.clienteEmail = clienteEmail;
    }

    public String getClienteTelefono() {
        return clienteTelefono;
    }

    public void setClienteTelefono(String clienteTelefono) {
        this.clienteTelefono = clienteTelefono;
    }

    public boolean isGuardarCliente() {
        return guardarCliente;
    }

    public void setGuardarCliente(boolean guardarCliente) {
        this.guardarCliente = guardarCliente;
    }
}
