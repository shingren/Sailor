package com.sailor.controller;

import com.sailor.dto.DashboardResumenDTO;
import com.sailor.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/resumen-hoy")
    public DashboardResumenDTO getResumenHoy() {
        return dashboardService.getResumenHoy();
    }
}
