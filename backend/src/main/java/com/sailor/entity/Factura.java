package com.sailor.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "facturas")
public class Factura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "pedido_id", nullable = false, unique = true)
    private Pedido pedido;

    @Column(nullable = false)
    private LocalDateTime fechaHora;

    @Column(name = "fecha_hora_pago")
    private LocalDateTime fechaHoraPago;

    @ManyToOne
    @JoinColumn(name = "creada_por_usuario_id")
    private Usuario creadaPorUsuario;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    // Snapshot de datos fiscales del cliente (congelados en el momento de facturar)
    @Column(name = "cliente_identificacion_fiscal")
    private String clienteIdentificacionFiscal;

    @Column(name = "cliente_nombre")
    private String clienteNombre;

    @Column(name = "cliente_direccion")
    private String clienteDireccion;

    @Column(name = "cliente_email")
    private String clienteEmail;

    @Column(name = "cliente_telefono")
    private String clienteTelefono;

    @Column(nullable = false)
    private double subtotal;

    @Column(nullable = false)
    private double impuestos;

    @Column(nullable = false)
    private double descuento = 0.0;

    @Column(nullable = false)
    private double total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FacturaEstado estado = FacturaEstado.PENDIENTE;

    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Pago> pagos = new ArrayList<>();

    public Factura() {
        this.fechaHora = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Pedido getPedido() {
        return pedido;
    }

    public void setPedido(Pedido pedido) {
        this.pedido = pedido;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public LocalDateTime getFechaHoraPago() {
        return fechaHoraPago;
    }

    public void setFechaHoraPago(LocalDateTime fechaHoraPago) {
        this.fechaHoraPago = fechaHoraPago;
    }

    public Usuario getCreadaPorUsuario() {
        return creadaPorUsuario;
    }

    public void setCreadaPorUsuario(Usuario creadaPorUsuario) {
        this.creadaPorUsuario = creadaPorUsuario;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
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

    public double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(double subtotal) {
        this.subtotal = subtotal;
    }

    public double getImpuestos() {
        return impuestos;
    }

    public void setImpuestos(double impuestos) {
        this.impuestos = impuestos;
    }

    public double getDescuento() {
        return descuento;
    }

    public void setDescuento(double descuento) {
        this.descuento = descuento;
    }

    public double getTotal() {
        return total;
    }

    public void setTotal(double total) {
        this.total = total;
    }

    public FacturaEstado getEstado() {
        return estado;
    }

    public void setEstado(FacturaEstado estado) {
        this.estado = estado;
    }

    public List<Pago> getPagos() {
        return pagos;
    }

    public void setPagos(List<Pago> pagos) {
        this.pagos = pagos;
    }
}
