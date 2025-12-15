# Migración de Estados de Factura

## Contexto

Se estandarizaron los estados de Factura para eliminar la inconsistencia histórica entre `PAGADA` y `PAGADO`.

## Estados Canónicos

### Factura
- **PENDIENTE**: Factura creada, sin pagos o pagos parciales
- **PAGADA**: Factura con pago completo (totalPagado >= total)

### Pedido
- **PENDIENTE**: Pedido creado
- **PREPARACION**: En cocina
- **LISTO**: Listo para entregar
- **ENTREGADO**: Entregado al cliente
- **PAGADO**: Factura asociada está pagada completamente

## Migración de Datos Existentes

Si tu base de datos tiene registros previos con estado `PAGADO` en la tabla `facturas`, ejecuta este script SQL:

```sql
-- Normalizar estados de factura
UPDATE facturas
SET estado = 'PAGADA'
WHERE estado = 'PAGADO';

-- Verificar que no hay estados inconsistentes
SELECT estado, COUNT(*) as cantidad
FROM facturas
GROUP BY estado;
```

## Compatibilidad

- **JPA/Hibernate**: Usa `@Enumerated(EnumType.STRING)` para almacenar valores como strings en la DB
- **ddl-auto: update**: No requiere cambios en schema, solo normalización de datos
- **Frontend**: Actualizado para comparar solo con `'PAGADA'` en lugar de `'PAGADO' || 'PAGADA'`

## Validación Post-Migración

Después de la migración, verifica:

1. Todos los estados de factura son `PENDIENTE` o `PAGADA`:
   ```sql
   SELECT * FROM facturas WHERE estado NOT IN ('PENDIENTE', 'PAGADA');
   ```

2. Las facturas pagadas tienen pedidos en estado `PAGADO`:
   ```sql
   SELECT f.id as factura_id, f.estado as factura_estado, p.id as pedido_id, p.estado as pedido_estado
   FROM facturas f
   JOIN pedidos p ON f.pedido_id = p.id
   WHERE f.estado = 'PAGADA' AND p.estado != 'PAGADO';
   ```

## Ejecución del Script de Migración

### Opción 1: Desde MySQL CLI
```bash
docker exec -i sailor-db-1 mysql -u sailor -psailor123 sailor < backend/src/main/resources/db/migration/V1__normalize_factura_estado.sql
```

### Opción 2: Desde Docker Compose
```bash
docker compose exec db mysql -u sailor -psailor123 sailor -e "UPDATE facturas SET estado = 'PAGADA' WHERE estado = 'PAGADO';"
```

### Opción 3: MySQL Workbench / DBeaver
Conectar a `localhost:3307` y ejecutar el script manualmente.

## Notas

- La migración es **idempotente**: puede ejecutarse múltiples veces sin efectos adversos
- **No requiere downtime**: el cambio es compatible hacia atrás
- Si la base de datos es nueva (sin datos previos), no es necesario ejecutar la migración
