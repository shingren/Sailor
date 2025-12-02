package com.sailor.controller;

import com.sailor.dto.JoinMesasDTO;
import com.sailor.dto.UpdateMesaPositionDTO;
import com.sailor.entity.Mesa;
import com.sailor.repository.MesaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mesas")
public class MesaController {

    @Autowired
    private MesaRepository mesaRepository;

    @GetMapping
    public List<Mesa> getAllMesas() {
        return mesaRepository.findAll();
    }

    @PostMapping
    public Mesa createMesa(@RequestBody Mesa mesa) {
        return mesaRepository.save(mesa);
    }

    @PutMapping("/{id}/position")
    public ResponseEntity<Mesa> updateMesaPosition(
            @PathVariable Long id,
            @RequestBody UpdateMesaPositionDTO dto) {
        return mesaRepository.findById(id)
                .map(mesa -> {
                    mesa.setPositionX(dto.getPositionX());
                    mesa.setPositionY(dto.getPositionY());
                    if (dto.getZona() != null) {
                        mesa.setZona(dto.getZona());
                    }
                    Mesa updated = mesaRepository.save(mesa);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/join")
    public ResponseEntity<String> joinMesas(@RequestBody JoinMesasDTO dto) {
        if (dto.getMesaIds() == null || dto.getMesaIds().size() < 2) {
            return ResponseEntity.badRequest().body("At least 2 tables required to join");
        }

        // Use the first mesa's ID as the group ID
        Long groupId = dto.getMesaIds().get(0);

        for (Long mesaId : dto.getMesaIds()) {
            mesaRepository.findById(mesaId).ifPresent(mesa -> {
                mesa.setGroupId(groupId);
                mesaRepository.save(mesa);
            });
        }

        return ResponseEntity.ok("Tables joined successfully");
    }

    @PostMapping("/{id}/split")
    public ResponseEntity<Mesa> splitMesa(@PathVariable Long id) {
        return mesaRepository.findById(id)
                .map(mesa -> {
                    // Find all mesas in the same group
                    Long groupId = mesa.getGroupId();
                    if (groupId != null) {
                        List<Mesa> groupedMesas = mesaRepository.findAll().stream()
                                .filter(m -> groupId.equals(m.getGroupId()))
                                .toList();

                        // Clear group ID for all mesas in the group
                        for (Mesa m : groupedMesas) {
                            m.setGroupId(null);
                            mesaRepository.save(m);
                        }
                    }
                    return ResponseEntity.ok(mesa);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
