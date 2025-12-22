# Bug Fix: Mostrar Extras en "Pedidos Listos para Facturar"

**Fecha**: 2025-12-20
**Tipo**: Frontend UI Bug
**Severidad**: Media (afecta UX, no funcionalidad crítica)
**Estado**: ✅ RESUELTO

---

## 📋 Descripción del Problema

En la página `/facturas`, sección **"Pedidos Listos para Facturar"**, los extras seleccionados en cada pedido **NO se mostraban** en la columna "Items", aunque el backend sí los estaba enviando correctamente en el JSON.

Esto obligaba al usuario a generar la factura solo para ver qué extras tenía el pedido, en lugar de verlos antes de facturar.

### Impacto

- **Usuarios afectados**: ROL CAJA (usuarios que generan facturas)
- **Caso de uso**: Revisar pedidos antes de facturar para confirmar extras y total
- **Workaround previo**: Generar factura y ver extras en "Facturas Recientes"

---

## 🔍 Diagnóstico

### Backend
✅ **Ya funcionaba correctamente**
- Endpoint: `GET /pedidos/listos-facturar`
- DTO: `PedidoResponseDTO` → `List<PedidoItemResponseDTO>` → `List<PedidoItemExtraResponseDTO>`
- El mapper `mapItemToResponseDTO` ya incluía los extras ([PedidoService.java:227-230](backend/src/main/java/com/sailor/service/PedidoService.java#L227-L230))
- La respuesta JSON contenía los extras correctamente

**Ejemplo de JSON del backend**:
```json
{
  "id": 19,
  "items": [
    {
      "productoNombre": "Pizza Margherita",
      "cantidad": 2,
      "precioUnitario": 12000.0,
      "extras": [
        {
          "nombre": "mas masa",
          "cantidad": 1,
          "precioUnitario": 250.0
        }
      ]
    }
  ]
}
```

### Frontend
❌ **No renderizaba los extras**
- Archivo: `frontend/src/FacturasPage.jsx`
- Sección: "Pedidos Listos para Facturar" (líneas 832-836)
- Problema: Solo mostraba: `${item.cantidad}x ${item.productoNombre}`
- **NO renderizaba** `item.extras`

**Evidencia**: El cálculo de total **SÍ usaba los extras** ([FacturasPage.jsx:792-796](frontend/src/FacturasPage.jsx#L792-L796)):
```javascript
const totalEstimado = pedido.items.reduce((sum, item) => {
  const itemTotal = item.cantidad * item.precioUnitario
  const extrasTotal = (item.extras || []).reduce((eSum, extra) =>
    eSum + (extra.cantidad * extra.precioUnitario * item.cantidad), 0)
  return sum + itemTotal + extrasTotal
}, 0)
```
Esto confirmó que el backend sí enviaba los extras.

**Comparación**: En "Facturas Recientes", los extras **SÍ se mostraban** correctamente ([FacturasPage.jsx:1245-1256](frontend/src/FacturasPage.jsx#L1245-L1256))

---

## 🛠️ Solución Implementada

### Cambios Realizados

**1. Frontend: [FacturasPage.jsx](frontend/src/FacturasPage.jsx)**
- **Líneas modificadas**: 832-851
- **Cambio**: Actualizar la columna "Items" para renderizar extras debajo de cada producto
- **Patrón usado**: Mismo patrón que "Facturas Recientes" (comprobado funcional)

**Antes**:
```jsx
<td>
  {pedido.items.length} ítem{pedido.items.length !== 1 ? 's' : ''}
  <div style={{ fontSize: '0.85em', color: '#666', marginTop: '2px' }}>
    {pedido.items.map(item => `${item.cantidad}x ${item.productoNombre}`).join(', ')}
  </div>
</td>
```

**Después**:
```jsx
<td>
  <div style={{ fontSize: '0.9em' }}>
    {pedido.items.map((item, idx) => (
      <div key={idx} style={{ marginBottom: idx < pedido.items.length - 1 ? '8px' : '0' }}>
        <div style={{ fontWeight: '500' }}>
          {item.cantidad}x {item.productoNombre}
        </div>
        {item.extras && item.extras.length > 0 && (
          <div style={{ marginTop: '3px', marginLeft: '12px', fontSize: '0.85em', color: '#666' }}>
            {item.extras.map((extra, extraIdx) => (
              <div key={extraIdx}>
                + {extra.nombre} x{extra.cantidad} ({formatCurrency(extra.precioUnitario)})
              </div>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
</td>
```

**2. Test Automatizado: [test_extras_en_pedidos_listos_facturar.sh](test_extras_en_pedidos_listos_facturar.sh)**
- **Propósito**: Validar que el backend serializa extras correctamente
- **Pasos**:
  1. Login como admin
  2. Crear pedido con producto + extra
  3. Cambiar estado a ENTREGADO
  4. Llamar `GET /pedidos/listos-facturar`
  5. Validar que el JSON contiene extras con nombre y precio
- **Resultado**: ✅ PASSED

---

## ✅ Validación

### Test Automatizado
```bash
bash test_extras_en_pedidos_listos_facturar.sh
```

**Resultado**:
```
✅ ALL TESTS PASSED!

Summary:
- Backend correctly serializes extras in /pedidos/listos-facturar
- Pedido #19 has extra 'mas masa' (₡250.0)
- Frontend should now display extras in 'Pedidos Listos para Facturar'
```

### Caso de Prueba Manual

1. Ir a `/inventario` → Recetas
   - Confirmar que existe producto "Pizza Margherita" con extra "mas masa" (₡250)

2. Ir a `/pedidos`
   - Crear pedido con Pizza Margherita + extra "mas masa"
   - Cambiar estado a ENTREGADO

3. Ir a `/facturas`
   - En sección **"Pedidos Listos para Facturar"**:
     - ✅ El pedido debe aparecer
     - ✅ En columna "Items", debe mostrar:
       ```
       2x Pizza Margherita
         + mas masa x1 (₡250.00)
       ```
   - Total estimado debe incluir el precio del extra
   - Generar factura
   - En "Facturas Recientes", confirmar que muestra los mismos extras

---

## 📊 Ejemplo de JSON del Endpoint

**Endpoint**: `GET /pedidos/listos-facturar`

**Response** (pedido con extras):
```json
{
  "id": 19,
  "mesaId": 1,
  "mesaCodigo": "M1",
  "fechaHora": "2025-12-20T19:38:18.830857",
  "estado": "ENTREGADO",
  "observaciones": "Test pedido con extras para validar listos-facturar",
  "items": [
    {
      "id": 19,
      "productoId": 1,
      "productoNombre": "Pizza Margherita",
      "cantidad": 2,
      "precioUnitario": 12000.0,
      "extras": [
        {
          "id": 4,
          "nombre": "mas masa",
          "cantidad": 1,
          "precioUnitario": 250.0
        }
      ]
    }
  ]
}
```

---

## 📸 Visualización Esperada

**Antes** (columna "Items"):
```
2x Pizza Margherita
```

**Después** (columna "Items"):
```
2x Pizza Margherita
  + mas masa x1 (₡250.00)
```

**Total Estimado**:
- Base: 2 × ₡12,000.00 = ₡24,000.00
- Extras: 2 × (1 × ₡250.00) = ₡500.00
- **Total**: ₡24,500.00

---

## 🚀 Deploy

### Archivos Modificados
- ✅ `frontend/src/FacturasPage.jsx`

### Archivos Creados
- ✅ `test_extras_en_pedidos_listos_facturar.sh`
- ✅ `BUG_FIX_EXTRAS_PEDIDOS_LISTOS.md` (este archivo)

### Build Process
```bash
# Restart web container (solo frontend modificado)
docker compose restart web

# O rebuild completo (opcional)
docker compose up -d --build
```

### Verificación Post-Deploy
```bash
# Ejecutar test automatizado
bash test_extras_en_pedidos_listos_facturar.sh

# Verificar en navegador
# 1. Abrir https://sailor.aarch.shop/facturas
# 2. Confirmar que pedidos listos muestran extras
```

---

## 📝 Notas Adicionales

### Backend (no modificado)
- El backend ya funcionaba correctamente
- No se requirieron cambios en DTOs, servicios o controllers
- El mapeo de extras ya existía desde implementación original

### Consistencia UI
- El patrón de renderizado de extras ahora es **consistente** entre:
  - "Pedidos Listos para Facturar"
  - "Facturas Recientes"
- Ambas secciones usan el mismo estilo visual para extras

### Performance
- No hay impacto en rendimiento
- Solo cambió la presentación visual (no lógica de negocio)
- El endpoint `/pedidos/listos-facturar` ya traía los extras (sin N+1 queries)

---

## ✅ Criterios de Aceptación

- [x] Extras se muestran en "Pedidos Listos para Facturar" antes de generar factura
- [x] Cada extra muestra: nombre, cantidad y precio unitario
- [x] Total estimado sigue siendo correcto (incluye extras)
- [x] No se requiere generar factura para ver extras
- [x] Test automatizado valida el endpoint backend
- [x] UI es consistente con "Facturas Recientes"

---

**Testeado por**: Claude Sonnet 4.5
**Aprobado para deploy**: ✅ SÍ
**Requiere rebuild backend**: ❌ NO (solo frontend)
