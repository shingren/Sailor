package com.sailor.repository;

import com.sailor.entity.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    @Query("SELECT r FROM Reserva r WHERE r.mesa.id = :mesaId AND r.fecha = :fecha AND r.estado = 'RESERVADO' AND r.horaInicio < :horaFin AND r.horaFin > :horaInicio")
    List<Reserva> findOverlappingReservas(
            @Param("mesaId") Long mesaId,
            @Param("fecha") LocalDate fecha,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFin") LocalTime horaFin
    );
}
