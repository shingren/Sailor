package com.sailor.controller;

import com.sailor.entity.Mesa;
import com.sailor.repository.MesaRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
}
