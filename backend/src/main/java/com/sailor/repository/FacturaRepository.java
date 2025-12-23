package com.sailor.repository;

import com.sailor.entity.Cuenta;
import com.sailor.entity.Factura;
import com.sailor.entity.FacturaEstado;
import com.sailor.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Long> {
    // Legacy pedido-based methods
    Optional<Factura> findByPedido(Pedido pedido);
    boolean existsByPedido(Pedido pedido);

    // New cuenta-based methods
    Optional<Factura> findByCuenta(Cuenta cuenta);
    boolean existsByCuenta(Cuenta cuenta);

    @Query("SELECT COUNT(f) FROM Factura f WHERE f.estado = :estado AND f.fechaHoraPago >= :startOfDay AND f.fechaHoraPago < :endOfDay")
    int countByEstadoAndFechaHoraPagoBetween(@Param("estado") FacturaEstado estado, @Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);
}
