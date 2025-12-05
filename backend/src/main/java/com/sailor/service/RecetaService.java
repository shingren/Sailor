package com.sailor.service;

import com.sailor.dto.RecetaExtraDTO;
import com.sailor.dto.RecetaItemDTO;
import com.sailor.dto.RecetaResponseDTO;
import com.sailor.entity.Insumo;
import com.sailor.entity.Producto;
import com.sailor.entity.Receta;
import com.sailor.entity.RecetaExtra;
import com.sailor.entity.RecetaItem;
import com.sailor.repository.InsumoRepository;
import com.sailor.repository.ProductoRepository;
import com.sailor.repository.RecetaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecetaService {

    @Autowired
    private RecetaRepository recetaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Transactional
    public RecetaResponseDTO createReceta(Long productoId, List<RecetaItemDTO> items, List<RecetaExtraDTO> extras) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto not found with id: " + productoId));

        Receta receta = new Receta();
        receta.setProducto(producto);

        // Add recipe items
        for (RecetaItemDTO itemDTO : items) {
            Insumo insumo = insumoRepository.findById(itemDTO.getInsumoId())
                    .orElseThrow(() -> new RuntimeException("Insumo not found with id: " + itemDTO.getInsumoId()));

            RecetaItem recetaItem = new RecetaItem();
            recetaItem.setReceta(receta);
            recetaItem.setInsumo(insumo);
            recetaItem.setCantidadNecesaria(itemDTO.getCantidadNecesaria());

            receta.getItems().add(recetaItem);
        }

        // Add extras if provided
        if (extras != null && !extras.isEmpty()) {
            for (RecetaExtraDTO extraDTO : extras) {
                Insumo insumo = insumoRepository.findById(extraDTO.getInsumoId())
                        .orElseThrow(() -> new RuntimeException("Insumo not found with id: " + extraDTO.getInsumoId()));

                RecetaExtra recetaExtra = new RecetaExtra();
                recetaExtra.setReceta(receta);
                recetaExtra.setNombre(extraDTO.getNombre());
                recetaExtra.setPrecio(extraDTO.getPrecio());
                recetaExtra.setInsumo(insumo);
                recetaExtra.setCantidadInsumo(extraDTO.getCantidadInsumo());

                receta.getExtras().add(recetaExtra);
            }
        }

        Receta saved = recetaRepository.save(receta);
        return mapToResponseDTO(saved);
    }

    public List<RecetaResponseDTO> listRecetas() {
        return recetaRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public RecetaResponseDTO getRecetaByProducto(Long productoId) {
        Receta receta = recetaRepository.findByProductoId(productoId)
                .orElseThrow(() -> new RuntimeException("Receta not found for producto id: " + productoId));
        return mapToResponseDTO(receta);
    }

    @Transactional
    public RecetaResponseDTO updateReceta(Long recetaId, List<RecetaItemDTO> items, List<RecetaExtraDTO> extras) {
        Receta receta = recetaRepository.findById(recetaId)
                .orElseThrow(() -> new RuntimeException("Receta not found with id: " + recetaId));

        // Clear existing items and extras (orphanRemoval will delete them)
        receta.getItems().clear();
        receta.getExtras().clear();

        // Add new items
        for (RecetaItemDTO itemDTO : items) {
            Insumo insumo = insumoRepository.findById(itemDTO.getInsumoId())
                    .orElseThrow(() -> new RuntimeException("Insumo not found with id: " + itemDTO.getInsumoId()));

            RecetaItem recetaItem = new RecetaItem();
            recetaItem.setReceta(receta);
            recetaItem.setInsumo(insumo);
            recetaItem.setCantidadNecesaria(itemDTO.getCantidadNecesaria());

            receta.getItems().add(recetaItem);
        }

        // Add new extras if provided
        if (extras != null && !extras.isEmpty()) {
            for (RecetaExtraDTO extraDTO : extras) {
                Insumo insumo = insumoRepository.findById(extraDTO.getInsumoId())
                        .orElseThrow(() -> new RuntimeException("Insumo not found with id: " + extraDTO.getInsumoId()));

                RecetaExtra recetaExtra = new RecetaExtra();
                recetaExtra.setReceta(receta);
                recetaExtra.setNombre(extraDTO.getNombre());
                recetaExtra.setPrecio(extraDTO.getPrecio());
                recetaExtra.setInsumo(insumo);
                recetaExtra.setCantidadInsumo(extraDTO.getCantidadInsumo());

                receta.getExtras().add(recetaExtra);
            }
        }

        Receta updated = recetaRepository.save(receta);
        return mapToResponseDTO(updated);
    }

    private RecetaResponseDTO mapToResponseDTO(Receta receta) {
        RecetaResponseDTO dto = new RecetaResponseDTO();
        dto.setId(receta.getId());
        dto.setProductoId(receta.getProducto().getId());
        dto.setProductoNombre(receta.getProducto().getNombre());

        List<RecetaItemDTO> itemDTOs = receta.getItems().stream()
                .map(this::mapItemToDTO)
                .collect(Collectors.toList());
        dto.setItems(itemDTOs);

        List<RecetaExtraDTO> extraDTOs = receta.getExtras().stream()
                .map(this::mapExtraToDTO)
                .collect(Collectors.toList());
        dto.setExtras(extraDTOs);

        return dto;
    }

    private RecetaItemDTO mapItemToDTO(RecetaItem item) {
        RecetaItemDTO dto = new RecetaItemDTO();
        dto.setInsumoId(item.getInsumo().getId());
        dto.setInsumoNombre(item.getInsumo().getNombre());
        dto.setCantidadNecesaria(item.getCantidadNecesaria());
        return dto;
    }

    private RecetaExtraDTO mapExtraToDTO(RecetaExtra extra) {
        RecetaExtraDTO dto = new RecetaExtraDTO();
        dto.setId(extra.getId());
        dto.setNombre(extra.getNombre());
        dto.setPrecio(extra.getPrecio());
        dto.setInsumoId(extra.getInsumo().getId());
        dto.setInsumoNombre(extra.getInsumo().getNombre());
        dto.setCantidadInsumo(extra.getCantidadInsumo());
        return dto;
    }
}
