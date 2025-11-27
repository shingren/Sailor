package com.sailor.service;

import com.sailor.dto.ReservaCreateRequestDTO;
import com.sailor.dto.ReservaResponseDTO;
import com.sailor.entity.Mesa;
import com.sailor.entity.Reserva;
import com.sailor.repository.MesaRepository;
import com.sailor.repository.ReservaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReservaService {

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Transactional
    public ReservaResponseDTO crearReserva(ReservaCreateRequestDTO request) {
        Mesa mesa = mesaRepository.findById(request.getMesaId())
                .orElseThrow(() -> new RuntimeException("Mesa not found with id: " + request.getMesaId()));

        LocalDate fecha = LocalDate.parse(request.getFecha());
        LocalTime horaInicio = LocalTime.parse(request.getHoraInicio());
        LocalTime horaFin = LocalTime.parse(request.getHoraFin());

        if (existsOverlap(request.getMesaId(), fecha, horaInicio, horaFin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mesa ya reservada en ese horario");
        }

        Reserva reserva = new Reserva();
        reserva.setMesa(mesa);
        reserva.setClienteNombre(request.getClienteNombre());
        reserva.setClienteTelefono(request.getClienteTelefono());
        reserva.setFecha(fecha);
        reserva.setHoraInicio(horaInicio);
        reserva.setHoraFin(horaFin);
        reserva.setCantidadPersonas(request.getCantidadPersonas());

        Reserva saved = reservaRepository.save(reserva);
        return mapToResponseDTO(saved);
    }

    public List<ReservaResponseDTO> listarReservas() {
        return reservaRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public ReservaResponseDTO obtenerReserva(Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva not found with id: " + id));
        return mapToResponseDTO(reserva);
    }

    @Transactional
    public ReservaResponseDTO cancelarReserva(Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva not found with id: " + id));

        if (reserva.getEstado().equals("CANCELADO")) {
            throw new RuntimeException("Reserva already canceled");
        }

        reserva.setEstado("CANCELADO");
        Reserva saved = reservaRepository.save(reserva);
        return mapToResponseDTO(saved);
    }

    private boolean existsOverlap(Long mesaId, LocalDate fecha, LocalTime horaInicio, LocalTime horaFin) {
        List<Reserva> overlapping = reservaRepository.findOverlappingReservas(mesaId, fecha, horaInicio, horaFin);
        return !overlapping.isEmpty();
    }

    private ReservaResponseDTO mapToResponseDTO(Reserva reserva) {
        ReservaResponseDTO dto = new ReservaResponseDTO();
        dto.setId(reserva.getId());
        dto.setMesaId(reserva.getMesa().getId());
        dto.setMesaCodigo(reserva.getMesa().getCodigo());
        dto.setClienteNombre(reserva.getClienteNombre());
        dto.setClienteTelefono(reserva.getClienteTelefono());
        dto.setFecha(reserva.getFecha());
        dto.setHoraInicio(reserva.getHoraInicio());
        dto.setHoraFin(reserva.getHoraFin());
        dto.setCantidadPersonas(reserva.getCantidadPersonas());
        dto.setEstado(reserva.getEstado());
        return dto;
    }
}
