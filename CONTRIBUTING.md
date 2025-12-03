# Guía de Contribución - Sailor

Gracias por tu interés en contribuir al proyecto Sailor. Este documento proporciona pautas y mejores prácticas para asegurar una colaboración efectiva y mantener la calidad del código.

## Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Empezar](#cómo-empezar)
- [Flujo de Trabajo con Git](#flujo-de-trabajo-con-git)
- [Estándares de Código](#estándares-de-código)
- [Commits y Mensajes](#commits-y-mensajes)
- [Pull Requests](#pull-requests)
- [Pruebas Locales](#pruebas-locales)
- [Seguridad](#seguridad)
- [Obtener Ayuda](#obtener-ayuda)

## Código de Conducta

- Sé respetuoso con todos los colaboradores
- Acepta críticas constructivas de manera profesional
- Enfócate en lo que es mejor para el proyecto
- Mantén una comunicación clara y profesional

## Cómo Empezar

### 1. Configuración del Entorno

Antes de comenzar a contribuir, asegúrate de tener todo configurado:

```bash
# Clonar el repositorio
git clone <repository-url>
cd Sailor

# Levantar el stack completo con Docker
docker compose up --build
```

Accede a la aplicación en https://localhost y verifica que todo funcione correctamente.

### 2. Familiarízate con el Proyecto

- Lee el [README.md](./README.md) para entender la arquitectura
- Explora el [SETUP.md](./SETUP.md) para detalles de configuración
- Revisa el [CLAUDE.md](./CLAUDE.md) para entender las convenciones del proyecto
- Navega por el código en `backend/` y `frontend/`

### 3. Encuentra una Tarea

- Revisa los Issues abiertos en GitHub
- Busca issues etiquetados como `good first issue` si eres nuevo
- Comenta en el issue que deseas trabajar en él antes de empezar

## Flujo de Trabajo con Git

### Configuración Inicial

```bash
# Asegúrate de tener la rama main actualizada
git checkout main
git pull origin main
```

### Crear una Nueva Rama

Usa nombres descriptivos siguiendo estas convenciones:

- `feature/nombre-funcionalidad` - Nueva característica
- `fix/descripcion-bug` - Corrección de errores
- `ui/mejora-interfaz` - Mejoras de interfaz de usuario
- `refactor/area-codigo` - Refactorización sin cambios funcionales
- `docs/actualizacion` - Documentación

**Ejemplos:**
```bash
git checkout -b feature/edicion-productos
git checkout -b fix/calculo-total-factura
git checkout -b ui/mejora-tabla-pedidos
git checkout -b refactor/service-layer
```

### Trabajar en tu Rama

```bash
# Hacer cambios en el código
# ...

# Ver los cambios
git status
git diff

# Agregar archivos al staging
git add .

# Hacer commit (ver sección de commits más abajo)
git commit -m "Descripción clara del cambio"

# Pushear a tu rama remota
git push origin feature/nombre-funcionalidad
```

### Mantener tu Rama Actualizada

Si `main` ha avanzado mientras trabajas:

```bash
# Desde tu rama de feature
git fetch origin
git rebase origin/main

# O si prefieres merge
git merge origin/main
```

## Estándares de Código

### Backend (Java/Spring Boot)

- Sigue las convenciones de Java estándar
- Usa **nombres en inglés** para clases, métodos y variables
- Usa **CamelCase** para clases: `PedidoService`, `InsumoController`
- Usa **camelCase** para métodos y variables: `createPedido()`, `totalVentas`
- Mantén las capas separadas: `entity`, `repository`, `service`, `controller`, `dto`
- Usa `@Transactional` para operaciones que modifican datos
- Siempre valida entrada de usuario en controladores
- Maneja excepciones apropiadamente (nunca expongas stack traces al cliente)

**Ejemplo de estructura de un Service:**
```java
@Service
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Transactional
    public ProductoResponseDTO createProducto(String nombre, double precio) {
        Producto producto = new Producto();
        producto.setNombre(nombre);
        producto.setPrecio(precio);

        Producto saved = productoRepository.save(producto);
        return mapToResponseDTO(saved);
    }

    private ProductoResponseDTO mapToResponseDTO(Producto producto) {
        // Mapeo
    }
}
```

### Frontend (React)

- Usa **functional components** con hooks
- Usa **nombres en inglés** para variables y funciones
- Usa **PascalCase** para componentes: `MesasPage`, `FacturasPage`
- Usa **camelCase** para funciones y variables: `handleSubmit`, `isLoading`
- Usa el hook `useAuth()` para acceder a autenticación
- Todas las llamadas API deben incluir `Authorization: getAuthHeader()`
- Maneja estados de loading y error apropiadamente
- Usa rutas relativas `/api/...` para llamadas al backend
- Mantén el código CSS consistente con el diseño existente

**Ejemplo de un componente:**
```javascript
function MesasPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()
  const [mesas, setMesas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchMesas()
    }
  }, [isAuthenticated])

  const fetchMesas = async () => {
    try {
      const response = await fetch('/api/mesas', {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (!response.ok) {
        setError('Error al cargar mesas')
        return
      }

      const data = await response.json()
      setMesas(data)
    } catch (err) {
      setError('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Renderizado...
}
```

### Archivos de Configuración

- No modifiques `docker-compose.yml` sin discutir primero
- No cambies puertos sin actualizar la documentación
- No agregues nuevas dependencias Maven/npm sin justificación clara

## Commits y Mensajes

### Formato de Mensajes de Commit

Usa mensajes claros y descriptivos en **español**:

```
[Tipo] Descripción breve del cambio

Explicación más detallada si es necesario (opcional).
Puede incluir múltiples líneas.

- Punto adicional 1
- Punto adicional 2
```

### Tipos de Commit

- **feat**: Nueva funcionalidad
- **fix**: Corrección de bug
- **ui**: Cambios de interfaz
- **refactor**: Refactorización de código
- **docs**: Documentación
- **style**: Formato, punto y coma, etc. (no cambia lógica)
- **test**: Agregar o modificar pruebas
- **chore**: Tareas de mantenimiento

### Ejemplos de Buenos Commits

✅ **BIEN:**
```
feat: Agregar edición de insumos en InventarioPage

Implementa funcionalidad para editar nombre, unidad y stock mínimo
de insumos existentes mediante edición inline en la tabla.

- Agrega estado de edición con editingInsumoId
- Crea endpoint PUT /insumos/{id}
- Actualiza DTO InsumoUpdateRequestDTO
```

✅ **BIEN:**
```
fix: Corregir cálculo de diferencia en cierre de caja

El cálculo anterior no consideraba el saldo inicial, causando
diferencias incorrectas en el reporte.
```

✅ **BIEN:**
```
ui: Mejorar diseño de tabla de facturas

- Agregar badges de color para estados
- Mejorar espaciado entre columnas
- Centrar acciones en la tabla
```

❌ **MAL:**
```
update
```

❌ **MAL:**
```
fix bug
```

❌ **MAL:**
```
cambios varios en frontend
```

### Commits Atómicos

Cada commit debe representar **un cambio lógico**:

- ✅ Un commit por bug fix
- ✅ Un commit por feature pequeña
- ❌ No mezcles múltiples features en un solo commit
- ❌ No hagas commits con código que no compile

## Pull Requests

### Antes de Abrir un PR

1. **Asegúrate de que el código compile**
   ```bash
   cd backend && mvn clean package
   cd ../frontend && npm run build
   ```

2. **Prueba con Docker Compose**
   ```bash
   docker compose up --build
   ```

3. **Verifica que no haya archivos sensibles**
   - No incluyas `.env`
   - No incluyas credenciales
   - Revisa el diff antes de pushear

4. **Actualiza tu rama con main**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

### Estructura del Pull Request

**Título del PR:**
- Usa formato: `[Tipo] Descripción breve`
- Ejemplo: `[Feature] Edición de insumos existentes`
- Ejemplo: `[Fix] Corregir validación de stock en pedidos`

**Descripción del PR:**

```markdown
## Descripción
Descripción clara de qué hace este PR y por qué es necesario.

## Cambios realizados
- Cambio 1
- Cambio 2
- Cambio 3

## Archivos modificados
- `backend/src/.../InsumoService.java`
- `frontend/src/InventarioPage.jsx`

## Cómo probar
1. Levantar el stack: `docker compose up --build`
2. Ir a Inventario
3. Hacer clic en "Editar" en un insumo
4. Modificar nombre y guardar
5. Verificar que los cambios persistan

## Screenshots (si aplica)
[Capturas de pantalla de cambios UI]

## Checklist
- [ ] El código compila sin errores
- [ ] Probado localmente con Docker
- [ ] No incluye archivos sensibles (.env, secrets)
- [ ] Documentación actualizada (si aplica)
- [ ] Commits con mensajes descriptivos
```

### Revisión de Código

- Responde a comentarios de revisión de manera constructiva
- Realiza los cambios solicitados en nuevos commits
- No hagas `force push` si otros están revisando tu código
- Marca conversaciones como resueltas cuando hayas aplicado el cambio

### Merge

- Solo el propietario del proyecto hará merge de PRs
- Asegúrate de que todos los checks pasen antes de solicitar merge
- La rama será eliminada automáticamente después del merge

## Pruebas Locales

### Probar Backend Solo

```bash
cd backend
mvn clean package
mvn spring-boot:run
```

Accede a: http://localhost:8080/health

### Probar Frontend Solo

```bash
cd frontend
npm install
npm run dev
```

Accede a: http://localhost:5173

### Probar Stack Completo

```bash
docker compose up --build
```

Accede a: https://localhost

### Verificar Logs

```bash
# Ver logs de todos los contenedores
docker compose logs

# Ver logs de un servicio específico
docker compose logs api
docker compose logs web
docker compose logs db

# Seguir logs en tiempo real
docker compose logs -f api
```

## Seguridad

### NUNCA Commitees:

- ❌ Archivos `.env` o variables de entorno
- ❌ Credenciales de base de datos
- ❌ API keys o tokens
- ❌ Secretos JWT personalizados
- ❌ Archivos `node_modules/` o `target/`
- ❌ Logs con información sensible

### Buenas Prácticas:

- ✅ Usa `.gitignore` apropiadamente
- ✅ Revisa `git diff` antes de cada commit
- ✅ Usa variables de entorno para configuración sensible
- ✅ Reporta vulnerabilidades de seguridad en privado al propietario

### Validación de Entrada

- Siempre valida entrada de usuario en backend
- No confíes en validación del frontend únicamente
- Usa `@Valid` en Spring Boot para DTOs
- Sanitiza input para prevenir SQL injection y XSS

## Obtener Ayuda

### Canales de Comunicación

- **Issues de GitHub**: Para reportar bugs o solicitar features
- **Pull Requests**: Para discutir cambios específicos de código
- **Contacto directo**: Para preguntas urgentes o privadas

### Reportar Bugs

Al reportar un bug, incluye:

1. **Descripción clara** del problema
2. **Pasos para reproducir**:
   ```
   1. Ir a 'Inventario'
   2. Hacer clic en 'Crear Insumo'
   3. Ingresar valores...
   4. Ver error
   ```
3. **Comportamiento esperado**
4. **Comportamiento actual**
5. **Screenshots** (si aplica)
6. **Logs de error** (consola del navegador o backend)
7. **Entorno**:
   - Sistema operativo
   - Navegador (si es frontend)
   - Versión de Docker

### Solicitar Features

Al solicitar una nueva funcionalidad:

1. Describe **qué** quieres lograr
2. Explica **por qué** es útil
3. Proporciona **casos de uso**
4. (Opcional) Sugiere una implementación

## Agradecimientos

¡Gracias por contribuir a Sailor! Tu tiempo y esfuerzo son muy apreciados.

---

**Última actualización**: Diciembre 2024
