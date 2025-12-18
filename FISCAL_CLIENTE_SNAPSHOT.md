# Datos Fiscales de Cliente para Factura - Documentación

## Resumen

Esta funcionalidad permite emitir facturas con datos fiscales de clientes, soportando tanto el flujo de "Consumidor Final" (rápido, sin persistencia de cliente) como facturas nominativas con snapshot inmutable de los datos fiscales.

## Conceptos Clave

### 1. Consumidor Final vs Factura Nominativa

**Consumidor Final:**
- No requiere identificación fiscal del cliente
- Flujo rápido para ventas al público general
- El snapshot en la factura se establece como:
  - `clienteIdentificacionFiscal`: `"CONSUMIDOR FINAL"`
  - `clienteNombre`: `"Consumidor Final"`
  - Otros campos: `null`

**Factura Nominativa:**
- Requiere al menos:
  - Identificación fiscal (cédula, RUC, NIT)
  - Nombre completo del cliente
- Campos opcionales: dirección, email, teléfono
- Permite búsqueda de clientes existentes por identificación fiscal
- Opcionalmente crea un registro de Cliente persistente para reutilización futura

### 2. Snapshot de Datos Fiscales

El **snapshot** es una copia congelada de los datos fiscales del cliente en el momento de emitir la factura. Esto garantiza:

- **Inmutabilidad histórica**: Si el cliente edita su información posteriormente, las facturas ya emitidas NO se modifican
- **Cumplimiento fiscal**: Los datos en la factura reflejan exactamente lo que se usó en el momento de la transacción
- **Auditoría**: Permite rastrear qué información se utilizó para cada factura

**Campos del snapshot en Factura:**
- `clienteIdentificacionFiscal` (String)
- `clienteNombre` (String)
- `clienteDireccion` (String, nullable)
- `clienteEmail` (String, nullable)
- `clienteTelefono` (String, nullable)

### 3. Búsqueda por Identificación Fiscal

La identificación fiscal es el **identificador único** para buscar clientes:
- Cédula de identidad
- RUC (Registro Único de Contribuyentes)
- NIT (Número de Identificación Tributaria)

**Flujo de búsqueda:**
1. Usuario ingresa identificación fiscal en el campo de búsqueda
2. Sistema busca en la tabla `clientes` por `identificacionFiscal` (índice único)
3. Si existe: auto-completa los campos del formulario con los datos del cliente
4. Si no existe: usuario ingresa datos manualmente y puede optar por guardarlos

## Arquitectura de Base de Datos

### Entidad Cliente

```sql
CREATE TABLE clientes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    identificacion_fiscal VARCHAR(255) NOT NULL UNIQUE,
    direccion VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX idx_cliente_identificacion ON clientes(identificacion_fiscal);
```

### Entidad Factura (modificada)

```sql
CREATE TABLE facturas (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pedido_id BIGINT NOT NULL UNIQUE,
    fecha_hora TIMESTAMP NOT NULL,
    creada_por_usuario_id BIGINT,

    -- Relación opcional con Cliente (puede ser NULL para consumidor final o facturas sin cliente guardado)
    cliente_id BIGINT,

    -- SNAPSHOT de datos fiscales (congelados)
    cliente_identificacion_fiscal VARCHAR(255),
    cliente_nombre VARCHAR(255),
    cliente_direccion VARCHAR(255),
    cliente_email VARCHAR(255),
    cliente_telefono VARCHAR(255),

    subtotal DOUBLE NOT NULL,
    impuestos DOUBLE NOT NULL,
    descuento DOUBLE NOT NULL,
    total DOUBLE NOT NULL,
    estado ENUM('PENDIENTE', 'PAGADA') NOT NULL,

    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (creada_por_usuario_id) REFERENCES usuarios(id)
);
```

**Diseño clave:**
- `cliente_id` es **nullable**: permite facturas sin Cliente persistente
- Campos de snapshot son independientes de `cliente_id`
- Snapshot se llena siempre para facturas nominativas, independientemente de si se guarda el Cliente

## API Endpoints

### Cliente Endpoints (ADMIN, CAJA)

#### GET /clientes/buscar
Busca un cliente por identificación fiscal.

**Query Parameters:**
- `identificacion` (String, required): Identificación fiscal a buscar

**Responses:**
- `200 OK`: Cliente encontrado
  ```json
  {
    "id": 1,
    "nombre": "Juan Pérez",
    "identificacionFiscal": "1234567890",
    "direccion": "Calle Falsa 123",
    "email": "juan@example.com",
    "telefono": "555-1234",
    "activo": true
  }
  ```
- `404 Not Found`: Cliente no existe

#### GET /clientes
Lista todos los clientes activos.

**Response:**
```json
[
  {
    "id": 1,
    "nombre": "Juan Pérez",
    "identificacionFiscal": "1234567890",
    ...
  }
]
```

#### POST /clientes
Crea un nuevo cliente.

**Request Body:**
```json
{
  "nombre": "María García",
  "identificacionFiscal": "0987654321",
  "direccion": "Av. Principal 456",
  "email": "maria@example.com",
  "telefono": "555-5678"
}
```

**Response:** `201 Created` con ClienteResponseDTO

#### PUT /clientes/{id}
Actualiza un cliente existente.

**Request Body:** ClienteCreateRequestDTO (igual que POST)

**Response:** `200 OK` con ClienteResponseDTO actualizado

### Factura Endpoint (modificado)

#### POST /facturas
Crea una factura con datos fiscales del cliente.

**Request Body:**
```json
{
  "pedidoId": 123,
  "esConsumidorFinal": false,
  "clienteIdentificacionFiscal": "1234567890",
  "clienteNombre": "Juan Pérez",
  "clienteDireccion": "Calle Falsa 123",
  "clienteEmail": "juan@example.com",
  "clienteTelefono": "555-1234",
  "guardarCliente": true
}
```

**Campos:**
- `pedidoId` (Long, required): ID del pedido a facturar
- `esConsumidorFinal` (Boolean, default: `true`): Tipo de factura
- `clienteIdentificacionFiscal` (String, required si nominativa)
- `clienteNombre` (String, required si nominativa)
- `clienteDireccion` (String, optional)
- `clienteEmail` (String, optional)
- `clienteTelefono` (String, optional)
- `guardarCliente` (Boolean, default: `false`): Si crear registro de Cliente persistente

**Lógica de procesamiento:**

1. **Si `esConsumidorFinal = true`:**
   - No buscar ni crear Cliente
   - Snapshot: `"CONSUMIDOR FINAL"` / `"Consumidor Final"`

2. **Si `esConsumidorFinal = false` (nominativa):**
   - Validar que `clienteIdentificacionFiscal` y `clienteNombre` estén presentes
   - Buscar Cliente por `identificacionFiscal`:
     - **Si existe**: asociar `factura.cliente = cliente` y usar datos del cliente existente para pre-llenar snapshot (priorizando datos del request si están presentes)
     - **Si NO existe**:
       - Si `guardarCliente = true`: crear nuevo Cliente y asociar
       - Si `guardarCliente = false`: no crear Cliente
   - En todos los casos nominativos: guardar snapshot con los datos confirmados

**Response:**
```json
{
  "id": 456,
  "pedidoId": 123,
  "fechaHora": "2025-12-16T10:30:00",
  "creadaPor": "admin@sailor.com",
  "clienteId": 1,
  "clienteIdentificacionFiscal": "1234567890",
  "clienteNombre": "Juan Pérez",
  "clienteDireccion": "Calle Falsa 123",
  "clienteEmail": "juan@example.com",
  "clienteTelefono": "555-1234",
  "subtotal": 100.00,
  "impuestos": 13.00,
  "descuento": 0.00,
  "total": 113.00,
  "estado": "PENDIENTE",
  "pagos": [],
  "totalPagado": 0.00,
  "saldoPendiente": 113.00
}
```

## Frontend UI

### Formulario de Generar Factura

**Sección "Datos Fiscales":**

1. **Radio buttons:**
   - [ ] Consumidor Final (default)
   - [ ] Factura a nombre de

2. **Cuando "Factura a nombre de" está seleccionado:**

   - **Campo Cédula/RUC** con botón "Buscar Cliente"
     - Si cliente existe: auto-completa todos los campos
     - Si no existe: muestra mensaje y permite ingreso manual

   - **Campos del cliente:**
     - Nombre Completo * (required)
     - Dirección (optional)
     - Email (optional)
     - Teléfono (optional)

   - **Checkbox:** "Guardar cliente para futuras facturas"
     - Visible solo cuando el cliente NO existe
     - Permite crear registro persistente de Cliente

### Visualización de Factura

**Sección "Datos Fiscales (Snapshot)":**

Muestra los datos congelados del cliente en el momento de facturación:
- Nombre
- Identificación (si no es "CONSUMIDOR FINAL")
- Dirección (si existe)
- Email (si existe)
- Teléfono (si existe)

Esta información es inmutable y refleja los datos históricos de la factura.

## Casos de Uso

### Caso 1: Venta Rápida a Consumidor Final

**Flujo:**
1. Usuario crea pedido y lo marca como ENTREGADO
2. Abre "Generar Factura"
3. Ingresa Pedido ID
4. Deja seleccionado "Consumidor Final" (default)
5. Click "Generar Factura"

**Resultado:**
- Factura creada con snapshot:
  - `clienteIdentificacionFiscal`: `"CONSUMIDOR FINAL"`
  - `clienteNombre`: `"Consumidor Final"`
- No se crea registro de Cliente

### Caso 2: Cliente Frecuente (Ya Registrado)

**Flujo:**
1. Usuario crea pedido y lo marca como ENTREGADO
2. Abre "Generar Factura"
3. Ingresa Pedido ID
4. Selecciona "Factura a nombre de"
5. Ingresa identificación fiscal del cliente (ej: "1234567890")
6. Click "Buscar Cliente"
7. Sistema auto-completa: nombre, dirección, email, teléfono
8. Usuario revisa y confirma los datos
9. Click "Generar Factura"

**Resultado:**
- Factura creada con:
  - `cliente_id` apunta al Cliente existente
  - Snapshot contiene los datos del Cliente en ese momento
- Si el Cliente edita su información después, la factura NO cambia

### Caso 3: Cliente Nuevo (Primera Compra)

**Flujo:**
1. Usuario crea pedido y lo marca como ENTREGADO
2. Abre "Generar Factura"
3. Ingresa Pedido ID
4. Selecciona "Factura a nombre de"
5. Ingresa identificación fiscal del cliente (ej: "0987654321")
6. Click "Buscar Cliente"
7. Sistema responde "Cliente no encontrado"
8. Usuario ingresa manualmente: nombre, dirección, email, teléfono
9. Marca checkbox "Guardar cliente para futuras facturas"
10. Click "Generar Factura"

**Resultado:**
- Se crea un nuevo registro de Cliente
- Factura creada con:
  - `cliente_id` apunta al nuevo Cliente
  - Snapshot contiene los datos ingresados
- En futuras facturas, este cliente podrá ser encontrado por búsqueda

### Caso 4: Factura Nominativa Sin Guardar Cliente

**Flujo:**
1. Similar al Caso 3, pero el usuario NO marca "Guardar cliente"

**Resultado:**
- NO se crea registro de Cliente
- Factura creada con:
  - `cliente_id` = `null`
  - Snapshot contiene los datos ingresados
- Este cliente NO podrá ser encontrado en futuras búsquedas

## Validaciones

### Backend

1. **Factura nominativa:**
   - `clienteIdentificacionFiscal`: obligatorio, no vacío
   - `clienteNombre`: obligatorio, no vacío

2. **Cliente único:**
   - `identificacionFiscal` tiene constraint UNIQUE
   - Intento de crear duplicado lanza `RuntimeException`

3. **Pedido estado:**
   - Solo pedidos en estado `ENTREGADO` pueden generar factura
   - Validación existente se mantiene

### Frontend

1. **Formulario nominativo:**
   - Campos Cédula/RUC y Nombre marcados como `required`
   - Validación antes de enviar request

2. **Búsqueda:**
   - Botón "Buscar Cliente" deshabilitado si campo identificación está vacío

## Pruebas

### Script de Test: test_cliente_identificacion_snapshot.sh

El script de prueba valida los 3 casos principales:

**Caso A: Consumidor Final**
- Crea factura con `esConsumidorFinal: true`
- Verifica snapshot: `"CONSUMIDOR FINAL"` / `"Consumidor Final"`

**Caso B: Nominativa sin guardar cliente**
- Crea factura con datos de cliente pero `guardarCliente: false`
- Verifica que NO se crea registro de Cliente (búsqueda retorna 404)
- Verifica que snapshot contiene datos correctos

**Caso C: Nominativa con guardar cliente + inmutabilidad**
- Crea factura con `guardarCliente: true`
- Verifica que se crea registro de Cliente
- Edita el Cliente (cambia nombre y dirección)
- Verifica que el snapshot de la factura NO cambió (inmutabilidad)

### Ejecución del Test

```bash
# Asegurar que Docker está corriendo
docker compose up -d

# Esperar a que servicios estén listos
sleep 30

# Ejecutar test
bash test_cliente_identificacion_snapshot.sh
```

**Output esperado:**
```
[SUCCESS] ✓ Caso A PASSED: Consumidor Final snapshot is correct
[SUCCESS] ✓ Caso B PASSED: Cliente was NOT saved (404 response)
[SUCCESS] ✓ Caso B PASSED: Snapshot data is correct even without saving cliente
[SUCCESS] ✓ Caso C PASSED: Snapshot is IMMUTABLE (unchanged after cliente edit)
[SUCCESS] ✓ Caso C PASSED: Snapshot retains original data
ALL TESTS PASSED ✓
```

## Decisiones de Diseño

### ¿Por qué snapshot independiente de Cliente?

**Problema:** Si solo guardáramos `cliente_id` sin snapshot, editar el Cliente cambiaría las facturas históricas.

**Solución:** Almacenar snapshot denormalizado garantiza inmutabilidad histórica.

### ¿Por qué Cliente opcional en Factura?

**Problema:** Forzar creación de Cliente para cada factura nominativa sería inflexible.

**Solución:** `cliente_id` nullable permite facturas nominativas sin crear registro persistente (útil para clientes ocasionales).

### ¿Por qué búsqueda por identificacionFiscal?

**Problema:** Buscar por nombre es ambiguo (múltiples "Juan Pérez").

**Solución:** Identificación fiscal es única por ley, ideal para búsqueda.

### ¿Por qué separar consumidorFinal de nominativa?

**Problema:** Validar campos cliente solo cuando es necesario.

**Solución:** Flag `esConsumidorFinal` clarifica intención y simplifica lógica de validación.

## Migraciones Futuras

Si en el futuro necesitas migrar facturas antiguas (antes de esta funcionalidad):

```sql
-- Marcar facturas antiguas como Consumidor Final
UPDATE facturas
SET
    cliente_identificacion_fiscal = 'CONSUMIDOR FINAL',
    cliente_nombre = 'Consumidor Final'
WHERE
    cliente_identificacion_fiscal IS NULL;
```

## Seguridad y Permisos

- **Roles con acceso a `/clientes/**`**: `ADMIN`, `CAJA`
- **Roles con acceso a `/facturas/**`**: `ADMIN`, `CAJA`
- Ambos roles pueden buscar, crear y actualizar clientes
- Configurado en [SecurityConfig.java](backend/src/main/java/com/sailor/config/SecurityConfig.java)

## Referencias Técnicas

**Backend:**
- [Cliente.java](backend/src/main/java/com/sailor/entity/Cliente.java)
- [ClienteRepository.java](backend/src/main/java/com/sailor/repository/ClienteRepository.java)
- [ClienteService.java](backend/src/main/java/com/sailor/service/ClienteService.java)
- [ClienteController.java](backend/src/main/java/com/sailor/controller/ClienteController.java)
- [Factura.java](backend/src/main/java/com/sailor/entity/Factura.java) (modificado)
- [FacturaService.java](backend/src/main/java/com/sailor/service/FacturaService.java) (modificado)
- [FacturaCreateRequestDTO.java](backend/src/main/java/com/sailor/dto/FacturaCreateRequestDTO.java) (modificado)
- [FacturaResponseDTO.java](backend/src/main/java/com/sailor/dto/FacturaResponseDTO.java) (modificado)

**Frontend:**
- [FacturasPage.jsx](frontend/src/FacturasPage.jsx) (modificado)

**Testing:**
- [test_cliente_identificacion_snapshot.sh](test_cliente_identificacion_snapshot.sh)

---

**Última actualización:** 2025-12-16
