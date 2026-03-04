# Validaciones y Reglas de Negocio - Backend IEP Santa Juana

Referencia completa para replicar esquemas Zod en el frontend.

---

## 1. Validaciones por Campo

### 1.1 RUT

```typescript
// Backend Zod
rut: z.string()
  .min(9)
  .max(10)
  .regex(/^\d{7,8}-[\dkK]$/)
```

| Regla | Valor |
|-------|-------|
| Formato | `12345678-9` o `1234567-K` |
| Regex | `/^\d{7,8}-[\dkK]$/` |
| Min caracteres | 9 |
| Max caracteres | 10 |
| Sin puntos | Almacenado sin puntos ni espacios |
| Unicidad | Único en BD (error `23505`) |

**Formato display vs almacenamiento:**

| Contexto | Formato | Ejemplo |
|----------|---------|---------|
| Backend/BD | Sin puntos | `12345678-9` |
| Display usuario | Con puntos | `12.345.678-9` |

---

### 1.2 Email

```typescript
// Backend Zod
email: z.string().email().max(100)    // usuarios
email: z.string().email().max(150)    // miembros
```

| Regla | Usuarios | Miembros |
|-------|----------|----------|
| Formato | Email válido | Email válido |
| Max caracteres | 100 | 150 |
| Requerido | Sí | No (opcional, transforma a `null`) |
| Unicidad | Único en BD | Único en BD |

---

### 1.3 Password

```typescript
// Backend Zod
password: z.string().min(8).max(100)       // crear usuario / reset
password: z.string().min(1)                 // login (solo requerido)
password_actual: z.string().min(1)          // cambiar password
password_nueva: z.string().min(8).max(100)  // cambiar password
```

| Regla | Valor |
|-------|-------|
| Min caracteres | 8 (crear/cambiar) |
| Max caracteres | 100 |
| Hasheo | bcrypt (backend) |

---

### 1.4 Teléfono

```typescript
// Backend Zod
telefono: z.string().max(20).optional().transform(v => v ?? null)
```

| Regla | Valor |
|-------|-------|
| Max caracteres | 20 |
| Requerido | No |
| Default | `null` |
| Formato sugerido | `+56912345678` |

> **Nota:** El backend no valida formato chileno con regex. La validación es solo de longitud máxima.

---

### 1.5 Fechas

```typescript
// Formato fecha (YYYY-MM-DD)
fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

// Formato datetime (ISO 8601)
fecha_vinculacion: z.string().datetime()
```

| Tipo | Regex/Validación | Ejemplo |
|------|------------------|---------|
| Fecha simple | `/^\d{4}-\d{2}-\d{2}$/` | `2025-03-15` |
| Datetime | `z.string().datetime()` | `2025-03-15T10:00:00Z` |
| Fecha válida | `z.string().date()` | `2025-03-15` |

**Formato display vs almacenamiento:**

| Contexto | Formato | Ejemplo |
|----------|---------|---------|
| Backend/BD | `YYYY-MM-DD` | `2025-03-15` |
| Display usuario | `DD/MM/YYYY` | `15/03/2025` |
| Datetime BD | ISO 8601 | `2025-03-15T10:00:00.000Z` |

**Restricciones específicas por módulo:**

| Campo | Restricción |
|-------|-------------|
| `fecha_nacimiento` (miembro) | Fecha válida, sin restricción de edad |
| `fecha_ingreso` (miembro) | Fecha válida, sin restricción pasado/futuro |
| `fecha` (actividad) | Solo formato, sin restricción pasado/futuro |
| `anio` (generar instancias) | Min 2020, Max 2100 |

---

### 1.6 Horas

```typescript
// Backend Zod
hora_inicio: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/)
hora_fin: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/)
```

| Regla | Valor |
|-------|-------|
| Formato | `HH:MM` o `HH:MM:SS` |
| Regex | `/^\d{2}:\d{2}(:\d{2})?$/` |
| Regla negocio | `hora_fin > hora_inicio` (validado en service) |

**Formato display vs almacenamiento:**

| Contexto | Formato | Ejemplo |
|----------|---------|---------|
| Backend/BD | `HH:MM:SS` | `10:00:00` |
| Input usuario | `HH:MM` | `10:00` |
| Display | `HH:MM` | `10:00` |

---

### 1.7 Textos con Longitud Mínima

| Campo | Min | Max | Módulo |
|-------|-----|-----|--------|
| `nombre` (miembro) | 2 | 100 | Miembros |
| `apellido` (miembro) | 2 | 100 | Miembros |
| `nombre` (grupo) | 2 | 100 | Grupos Ministeriales |
| `nombre` (rol grupo) | 2 | 50 | Roles Grupo |
| `nombre` (rol actividad) | 1 | 100 | Roles Actividad |
| `nombre` (tipo actividad) | 1 | 100 | Tipos Actividad |
| `nombre` (tipo necesidad) | 1 | 100 | Tipos Necesidad |
| `nombre` (patrón) | 1 | 100 | Patrones |
| `nombre` (actividad) | 1 | 150 | Actividades |
| `lugar` (patrón) | 1 | 200 | Patrones |
| `descripcion` (necesidad) | 1 | 1000 | Necesidades |
| `motivo_cancelacion` | 1 | 500 | Actividades |
| `motivo_rechazo` | 1 | 500 | Invitados |
| `motivo` (historial estado) | 10 | 1000 | Historial Estado |
| `observaciones` (colaborador) | — | 500 | Colaboradores |
| `unidad_medida` | 1 | 50 | Necesidades |

---

### 1.8 Números (Rangos Permitidos)

| Campo | Tipo | Min | Max | Módulo |
|-------|------|-----|-----|--------|
| `dia_semana` | int | 1 | 7 | Patrones |
| `duracion_minutos` | int | 1 | — | Patrones |
| `mes` (query) | int | 1 | 12 | Calendario / Patrones |
| `anio` (query) | int | 2020 | 2100 | Patrones |
| `cantidad_requerida` | number | >0 | — | Necesidades |
| `cantidad_cubierta` | number | ≥0 | — | Necesidades |
| `cantidad_ofrecida` | number | >0 | — | Colaboradores |
| IDs generales | int | >0 | — | Todos |

---

### 1.9 Color (Hex)

```typescript
// Backend Zod
color: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
```

| Regla | Valor |
|-------|-------|
| Formato | `#RRGGBB` |
| Regex | `/^#[0-9A-Fa-f]{6}$/` |
| Ejemplo | `#3B82F6` |

---

## 2. Enums y Estados Permitidos

### 2.1 Roles de Usuario

```typescript
const RolesEnum = z.enum(['administrador', 'usuario']);
```

| Valor | Descripción |
|-------|-------------|
| `administrador` | Acceso completo al sistema |
| `lider` | Gestión de grupos y actividades |
| `miembro` | Acceso básico |

---

### 2.2 Estado de Integrante

```typescript
const EstadoComunionEnum = z.enum(['asistente', 'probando', 'plena_comunion']);
```

| Valor | Descripción |
|-------|-------------|
| `asistente` | Sin Integrante activa |
| `probando` | En período de prueba |
| `plena_comunion` | Miembro pleno |

---

### 2.3 Género

```typescript
const GeneroEnum = z.enum(['masculino', 'femenino']);
```

---

### 2.4 Estado de Actividad

```typescript
const EstadoActividadEnum = z.enum(['programada', 'realizada', 'cancelada']);
```

**Transiciones permitidas:**

```
programada → realizada    ✅
programada → cancelada    ✅ (requiere motivo_cancelacion)
realizada  → cancelada    ✅ (requiere motivo_cancelacion)
cancelada  → programada   ❌
cancelada  → realizada    ❌
realizada  → programada   ❌
mismo → mismo             ❌
```

---

### 2.5 Estado de Invitación

```typescript
const EstadoInvitadoEnum = z.enum(['pendiente', 'confirmado', 'rechazado']);
```

**Transiciones permitidas:**

```
pendiente  → confirmado   ✅
pendiente  → rechazado    ✅ (requiere motivo_rechazo)
confirmado → *            ❌
rechazado  → *            ❌
```

---

### 2.6 Estado de Necesidad Logística

```typescript
const EstadoNecesidadEnum = z.enum(['abierta', 'cubierta', 'cerrada']);
```

**Transiciones permitidas:**

```
abierta  → cubierta   ✅
abierta  → cerrada    ✅
cubierta → abierta    ✅
cubierta → cerrada    ✅
cerrada  → cubierta   ✅
cerrada  → abierta    ❌
mismo → mismo         ❌
```

---

### 2.7 Estado de Colaborador

```typescript
const EstadoColaboradorEnum = z.enum(['pendiente', 'aceptada', 'rechazada']);
```

**Transiciones permitidas:**

```
pendiente → aceptada   ✅
pendiente → rechazada  ✅
aceptada  → *          ❌
rechazada → *          ❌
```

---

### 2.8 Frecuencia de Patrón

```typescript
const FrecuenciaEnum = z.enum([
  'semanal',
  'primera_semana',
  'segunda_semana',
  'tercera_semana',
  'cuarta_semana'
]);
```

| Valor | Descripción |
|-------|-------------|
| `semanal` | Todas las semanas del mes |
| `primera_semana` | Solo la 1ra semana |
| `segunda_semana` | Solo la 2da semana |
| `tercera_semana` | Solo la 3ra semana |
| `cuarta_semana` | Solo la 4ta semana |

---

### 2.9 Día de la Semana

| Valor | Día |
|-------|-----|
| 1 | Lunes |
| 2 | Martes |
| 3 | Miércoles |
| 4 | Jueves |
| 5 | Viernes |
| 6 | Sábado |
| 7 | Domingo |

---

## 3. Estructura de Respuestas API

### 3.1 Respuesta Exitosa

```typescript
interface ServiceResponse<T> {
  success: true;
  message: string;
  responseObject: T;
  statusCode: number; // 200, 201
}
```

### 3.2 Respuesta con Error

```typescript
interface ServiceResponse<null> {
  success: false;
  message: string;
  responseObject: null;
  statusCode: number; // 400, 401, 403, 404, 409, 500
}
```

### 3.3 Códigos HTTP Usados

| Código | Significado | Cuándo |
|--------|-------------|--------|
| 200 | OK | Lectura, actualización, eliminación exitosa |
| 201 | Created | Creación exitosa |
| 400 | Bad Request | Validación Zod fallida, regla de negocio violada |
| 401 | Unauthorized | Token inválido, expirado o ausente |
| 403 | Forbidden | Rol no autorizado, acceso a recurso de otro usuario |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Duplicado (email, RUT, nombre único) |
| 500 | Internal Server Error | Error inesperado del servidor |

### 3.4 Error de Validación Zod

Cuando falla la validación Zod, el backend retorna los detalles del error:

```json
{
  "success": false,
  "message": "Datos de entrada inválidos",
  "responseObject": null,
  "statusCode": 400
}
```

---

## 4. Permisos por Rol

### 4.1 Matriz de Permisos

| Módulo | Leer | Crear | Editar | Eliminar | Cambiar Estado |
|--------|------|-------|--------|----------|----------------|
| **Usuarios** | Admin | Admin | Admin | — | Admin |
| **Miembros** | Todos | Admin | Admin | Admin | Admin |
| **Grupos** | Todos | Admin | Admin | Admin | — |
| **Integrante Grupo** | Todos | Admin, Líder | — | — | Admin, Líder |
| **Actividades** | Todos* | Admin, Líder | Admin, Líder | — | Admin, Líder |
| **Patrones** | Todos | Admin | Admin | — | Admin |
| **Invitados** | Todos | Admin, Líder | — | Admin, Líder | Todos** |
| **Necesidades** | Todos | Admin, Líder | Admin, Líder | Admin, Líder | Admin, Líder |
| **Colaboradores** | Todos | Todos | — | Todos*** | Admin, Líder |
| **Candidatos** | — | Admin, Líder | — | — | — |
| **Calendario** | Todos* | — | — | — | — |
| **Roles Grupo** | Todos | Admin | Admin | Admin | — |
| **Roles Actividad** | Todos | Admin | Admin | Admin | — |
| **Tipos Actividad** | Todos | Admin | Admin | Admin | — |
| **Tipos Necesidad** | Todos | Admin | Admin | Admin | — |
| **Historial Estado** | Admin | Admin | — | — | — |
| **Historial Rol** | Admin, Líder | Admin, Líder | — | — | — |

\* Incluye endpoints públicos (sin auth).
\** Solo responder su propia invitación; marcar asistencia = Admin, Líder.
\*** Solo eliminar propia colaboración pendiente.

### 4.2 Endpoints Públicos (sin autenticación)

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/auth/login` | Iniciar sesión |
| `POST /api/auth/recuperar-password` | Solicitar recuperación |
| `POST /api/auth/reset-password` | Restablecer contraseña |
| `GET /api/actividades/publicas` | Actividades públicas futuras |
| `GET /api/calendario/publico` | Calendario público mensual |

---

## 5. Reglas de Negocio Importantes

### 5.1 Requisito de Plena Comunión

Varias operaciones requieren que el miembro tenga `estado_comunion = 'plena_comunion'`:

| Operación | Requisito |
|-----------|-----------|
| Ser líder principal de grupo | Plena comunión |
| Vincularse a grupo ministerial | Plena comunión |
| Roles con `requiere_plena_comunion = true` | Plena comunión |

---

### 5.2 Unicidad (Constraints de BD)

| Campo | Tabla | Error |
|-------|-------|-------|
| `email` | usuarios | 409 Conflict |
| `rut` | miembros | 409 Conflict |
| `email` | miembros | 409 Conflict |
| `nombre` | grupos ministeriales | 409 Conflict |
| `nombre` | patrones actividad | 409 Conflict |
| `nombre` | roles actividad | 409 Conflict |
| `nombre` | roles grupo | 409 Conflict |
| `nombre` | tipos actividad | 409 Conflict |
| `nombre` | tipos necesidad | 409 Conflict |
| (miembro, grupo, rol) activo | Integrante grupo | 409 Conflict |
| (miembro, actividad, rol) | invitados | 409 Conflict |
| (miembro, necesidad) pendiente | colaboradores | 409 Conflict |

---

### 5.3 Eliminación Condicionada

No se puede eliminar un recurso si está en uso:

| Recurso | Condición para eliminar |
|---------|------------------------|
| Grupo ministerial | No tener miembros activos (`fecha_desvinculacion IS NULL`) |
| Rol de grupo | No estar asignado en Integrantes activas |
| Rol de actividad | No estar usado en invitaciones |
| Tipo de actividad | No estar usado en actividades activas |
| Tipo de necesidad | No estar usado en necesidades |
| Invitación | Solo si `estado = 'pendiente'` |
| Necesidad | Solo si `estado = 'abierta'` |
| Colaboración | Solo si `estado = 'pendiente'` |

---

### 5.4 Relación hora_inicio < hora_fin

```typescript
// Validación en actividadesService
if (hora_fin <= hora_inicio) {
  throw "La hora de fin debe ser mayor a la hora de inicio";
}
```

Se valida en el **service**, no en el schema Zod. El frontend debe replicar esta validación con `.refine()`:

```typescript
// Ejemplo para frontend
const ActividadSchema = z.object({
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  hora_fin: z.string().regex(/^\d{2}:\d{2}$/),
}).refine(
  (data) => data.hora_fin > data.hora_inicio,
  { message: "La hora de fin debe ser mayor a la hora de inicio", path: ["hora_fin"] }
);
```

---

### 5.5 Cantidades en Necesidades y Colaboraciones

```
cantidad_cubierta <= cantidad_requerida           (siempre)
cantidad_ofrecida <= cantidad_faltante             (al crear colaboración)
cantidad_faltante = cantidad_requerida - cantidad_cubierta
```

- Al **aceptar** una colaboración, se suma `cantidad_ofrecida` a `cantidad_cubierta` automáticamente.
- Se valida que la suma no exceda `cantidad_requerida`.

---

### 5.6 Motivo Obligatorio Condicionalmente

Hay dos schemas con `.refine()` que exigen motivo según el estado:

**Cancelar actividad:**

```typescript
const PatchEstadoSchema = z.object({
  estado: z.enum(['programada', 'realizada', 'cancelada']),
  motivo_cancelacion: z.string().min(1).max(500).optional(),
}).refine(
  (data) => data.estado !== 'cancelada' || !!data.motivo_cancelacion,
  { message: "El motivo es requerido al cancelar", path: ["motivo_cancelacion"] }
);
```

**Rechazar invitación:**

```typescript
const PatchResponderSchema = z.object({
  estado: z.enum(['confirmado', 'rechazado']),
  motivo_rechazo: z.string().min(1).max(500).optional(),
}).refine(
  (data) => data.estado !== 'rechazado' || !!data.motivo_rechazo,
  { message: "El motivo es requerido al rechazar", path: ["motivo_rechazo"] }
);
```

---

### 5.7 Estado Anterior Debe Coincidir

En historiales, el `estado_anterior` debe coincidir con el estado actual del registro:

```
// Historial Estado
estado_anterior enviado === miembro.estado_comunion actual   → ✅
estado_anterior enviado !== miembro.estado_comunion actual   → ❌ 400
```

Y el nuevo valor debe ser diferente al anterior (validado en Zod `.refine()`):

```typescript
.refine(
  (data) => data.estado_nuevo !== data.estado_anterior,
  { message: "El estado nuevo debe ser diferente al anterior" }
)
```

---

### 5.8 Actividades Canceladas Son Inmutables

```
actividad.estado === 'cancelada' → No se puede editar (PUT)
actividad.estado === 'cancelada' → No se puede cambiar estado (PATCH)
```

---

### 5.9 Scoring de Candidatos

El algoritmo de puntuación para sugerir candidatos:

| Criterio | Puntos | Condición |
|----------|--------|-----------|
| **Experiencia** (0-30) | 30 | ≥10 veces en el rol |
| | 20 | ≥5 veces |
| | 10 | ≥1 vez |
| | 0 | Sin experiencia |
| **Antigüedad** (0-20) | 20 | ≥10 años + plena comunión |
| | 15 | ≥5 años + plena comunión |
| | 10 | ≥3 años + plena comunión |
| | 5 | ≥1 año + plena comunión |
| | 0 | Sin plena comunión |
| **Asistencia** (0-30) | 30 | ≥90% |
| | 20 | ≥75% |
| | 10 | ≥50% |
| | 0 | <50% |
| **Disponibilidad** (0-20) | 20 | Sin conflicto en la fecha |
| | 0 | Tiene conflicto |
| **Total máximo** | **100** | |

**Manejo de división por 0 en asistencia:**
- Si el miembro no tiene invitaciones (total = 0), el porcentaje de asistencia se calcula como 0%.
- No se produce error de división por cero.

**Límite de resultados:** Top 20 candidatos ordenados por `puntuacion_total` descendente.

---

### 5.10 Generación de Instancias desde Patrones

- Solo se generan desde patrones **activos**.
- Si no hay patrones activos, retorna error.
- Calcula fechas según `frecuencia` y `dia_semana`.
- `hora_fin` se calcula automáticamente: `hora_inicio + duracion_minutos`.
- Se crean con `estado = 'programada'` y `patron_id` vinculado.

---

### 5.11 Token JWT

| Campo | Descripción |
|-------|-------------|
| `id` | ID del usuario |
| `email` | Email del usuario |
| `rol` | Rol del usuario |
| `miembro_id` | ID del miembro vinculado (puede ser `null`) |
| Expiración | Configurada por variable de entorno |
| Reset token | Expira en 1 hora, tipo `password_reset` |

---

### 5.12 Calendario - Validación de Propiedad

`GET /api/calendario/mis-responsabilidades/:miembro_id` valida que el `miembro_id` del token coincida con el `:miembro_id` de la URL. Si no coincide → **403 Forbidden**.

---

## 6. Validación Común de IDs (Params)

Todos los endpoints con `:id` en la ruta usan esta validación:

```typescript
// commonValidation.ts
const IdParamSchema = z.object({
  id: z.string()
    .refine((data) => !Number.isNaN(Number(data)), 'ID must be a numeric value')
    .transform(Number)
    .refine((num) => num > 0, 'ID must be a positive number')
});
```

---

## 7. Schemas Zod Completos por Módulo

### 7.1 Auth

```typescript
// Login
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Cambiar Password
const CambiarPasswordSchema = z.object({
  password_actual: z.string().min(1),
  password_nueva: z.string().min(8).max(100),
});

// Recuperar Password
const RecuperarPasswordSchema = z.object({
  email: z.string().email(),
});

// Reset Password
const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  nueva_password: z.string().min(8).max(100),
});
```

### 7.2 Usuarios

```typescript
const RolesEnum = z.enum(['administrador', 'usuario']);

const CreateUsuarioSchema = z.object({
  email: z.string().email().max(100),
  password: z.string().min(8).max(100),
  rol: RolesEnum,
  miembro_id: z.number().int().positive().optional(),
});

const UpdateUsuarioSchema = z.object({
  email: z.string().email().max(100).optional(),
  rol: RolesEnum.optional(),
});

const PatchEstadoUsuarioSchema = z.object({
  activo: z.boolean(),
});
```

### 7.3 Miembros

```typescript
const EstadoComunionEnum = z.enum(['asistente', 'probando', 'plena_comunion']);
const GeneroEnum = z.enum(['masculino', 'femenino']);

const CreateMiembroSchema = z.object({
  rut: z.string().min(9).max(10).regex(/^\d{7,8}-[\dkK]$/),
  nombre: z.string().min(2).max(100),
  apellido: z.string().min(2).max(100),
  email: z.string().email().max(150).optional().transform(v => v ?? null),
  telefono: z.string().max(20).optional().transform(v => v ?? null),
  fecha_nacimiento: z.string().date().optional().transform(v => v ?? null),
  direccion: z.string().optional().transform(v => v ?? null),
  genero: GeneroEnum.optional().transform(v => v ?? null),
  bautizado: z.boolean().default(false),
  estado_comunion: EstadoComunionEnum.default('asistente'),
  fecha_ingreso: z.string().date(),
});

const UpdateMiembroSchema = CreateMiembroSchema.partial();

const PatchEstadoMiembroSchema = z.object({
  estado_comunion: EstadoComunionEnum,
});
```

### 7.4 Grupos Ministeriales

```typescript
const CreateGrupoSchema = z.object({
  nombre: z.string().min(2).max(100),  descripcion: z.string().optional().transform(v => v ?? null),
  fecha_creacion: z.string().date().optional(),
});

const UpdateGrupoSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),  descripcion: z.string().optional().transform(v => v ?? null),
});
```

### 7.5 Integrante Grupo

```typescript
const VincularSchema = z.object({
  miembro_id: z.number().int().positive(),
  grupo_id: z.number().int().positive(),
  rol_grupo_id: z.number().int().positive(),
  fecha_vinculacion: z.string().datetime().optional(),
});

const DesvincularSchema = z.object({
  fecha_desvinculacion: z.string().datetime().optional(),
});
```

### 7.6 Actividades

```typescript
const EstadoActividadEnum = z.enum(['programada', 'realizada', 'cancelada']);

const CreateActividadSchema = z.object({
  patron_id: z.number().int().positive().optional(),
  tipo_actividad_id: z.number().int().positive(),
  nombre: z.string().min(1).max(150),
  descripcion: z.string().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  hora_fin: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  grupo_id: z.number().int().positive().optional(),
  es_publica: z.boolean().default(false),
  creador_id: z.number().int().positive(),
});

const UpdateActividadSchema = CreateActividadSchema.omit({ creador_id: true }).partial();

const PatchEstadoActividadSchema = z.object({
  estado: EstadoActividadEnum,
  motivo_cancelacion: z.string().min(1).max(500).optional(),
}).refine(
  (data) => data.estado !== 'cancelada' || !!data.motivo_cancelacion,
  { message: "El motivo es requerido al cancelar", path: ["motivo_cancelacion"] }
);

const ListActividadesQuerySchema = z.object({
  mes: z.string().regex(/^\d{1,2}$/).transform(Number).refine(n => n >= 1 && n <= 12).optional(),
  anio: z.string().regex(/^\d{4}$/).transform(Number).optional(),
  estado: EstadoActividadEnum.optional(),
  es_publica: z.string().transform(v => v === 'true').optional(),
});
```

### 7.7 Patrones de Actividad

```typescript
const FrecuenciaEnum = z.enum([
  'semanal', 'primera_semana', 'segunda_semana', 'tercera_semana', 'cuarta_semana'
]);

const CreatePatronSchema = z.object({
  nombre: z.string().min(1).max(100),
  tipo_actividad_id: z.number().int().positive(),
  frecuencia: FrecuenciaEnum,
  dia_semana: z.number().int().min(1).max(7),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  duracion_minutos: z.number().int().positive(),
  lugar: z.string().min(1).max(200),
  grupo_id: z.number().int().positive().optional(),
  es_publica: z.boolean().default(false),
});

const UpdatePatronSchema = CreatePatronSchema.partial();

const PatchEstadoPatronSchema = z.object({
  activo: z.boolean(),
});

const GenerarInstanciasSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020).max(2100),
});
```

### 7.8 Invitados

```typescript
const EstadoInvitadoEnum = z.enum(['pendiente', 'confirmado', 'rechazado']);

const CreateInvitadoSchema = z.object({
  actividad_id: z.number().int().positive(),
  miembro_id: z.number().int().positive(),
  rol_id: z.number().int().positive(),
});

const PatchResponderSchema = z.object({
  estado: z.enum(['confirmado', 'rechazado']),
  motivo_rechazo: z.string().min(1).max(500).optional(),
}).refine(
  (data) => data.estado !== 'rechazado' || !!data.motivo_rechazo,
  { message: "El motivo es requerido al rechazar", path: ["motivo_rechazo"] }
);

const PatchAsistenciaSchema = z.object({
  asistio: z.boolean(),
});
```

### 7.9 Necesidades Logísticas

```typescript
const EstadoNecesidadEnum = z.enum(['abierta', 'cubierta', 'cerrada']);

const CreateNecesidadSchema = z.object({
  actividad_id: z.number().int().positive(),
  tipo_necesidad_id: z.number().int().positive(),
  descripcion: z.string().min(1).max(1000),
  cantidad_requerida: z.number().positive(),
  unidad_medida: z.string().min(1).max(50),
  cantidad_cubierta: z.number().min(0).default(0),
});

const UpdateNecesidadSchema = CreateNecesidadSchema.partial();

const PatchEstadoNecesidadSchema = z.object({
  estado: EstadoNecesidadEnum,
});
```

### 7.10 Colaboradores

```typescript
const EstadoColaboradorEnum = z.enum(['pendiente', 'aceptada', 'rechazada']);

const CreateColaboradorSchema = z.object({
  necesidad_id: z.number().int().positive(),
  miembro_id: z.number().int().positive(),
  cantidad_ofrecida: z.number().positive(),
  observaciones: z.string().max(500).optional(),
});

const PatchDecisionSchema = z.object({
  estado: z.enum(['aceptada', 'rechazada']),
});
```

### 7.11 Candidatos

```typescript
const SugerirRolSchema = z.object({
  rol_id: z.number().int().positive(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const SugerirCargoSchema = z.object({
  cargo_id: z.number().int().positive(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
```

### 7.12 Calendario

```typescript
const CalendarioQuerySchema = z.object({
  mes: z.string().regex(/^\d{1,2}$/).transform(Number).refine(n => n >= 1 && n <= 12),
  anio: z.string().regex(/^\d{4}$/).transform(Number),
});
```

### 7.13 Roles Grupo

```typescript
const CreateRolGrupoSchema = z.object({
  nombre: z.string().min(2).max(50).trim(),
  requiere_plena_comunion: z.boolean().default(true),
});

const UpdateRolGrupoSchema = z.object({
  nombre: z.string().min(2).max(50).trim().optional(),
  requiere_plena_comunion: z.boolean().optional(),
});
```

### 7.14 Roles Actividad

```typescript
const CreateRolActividadSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().optional(),
});

const UpdateRolActividadSchema = CreateRolActividadSchema.partial();
```

### 7.15 Tipos Actividad

```typescript
const CreateTipoActividadSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const UpdateTipoActividadSchema = CreateTipoActividadSchema.partial();
```

### 7.16 Tipos Necesidad

```typescript
const CreateTipoNecesidadSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().optional(),
  requiere_asignacion_beneficiarios: z.boolean().default(false),
});

const UpdateTipoNecesidadSchema = CreateTipoNecesidadSchema.partial();
```

### 7.17 Historial Estado

```typescript
const CreateHistorialEstadoSchema = z.object({
  miembro_id: z.number().int().positive(),
  estado_anterior: EstadoComunionEnum,
  estado_nuevo: EstadoComunionEnum,
  motivo: z.string().min(10).max(1000),
  usuario_id: z.number().int().positive(),
}).refine(
  (data) => data.estado_nuevo !== data.estado_anterior,
  { message: "El estado nuevo debe ser diferente al anterior" }
);
```

## 8. Datos Semilla (Catálogos por Defecto)

### Tipos de Actividad

| ID | Nombre | Color |
|----|--------|-------|
| 1 | Culto | — |
| 2 | Escuela Dominical | — |
| 3 | Reunión de Oración | — |
| 4 | Ensayo de Coro | — |
| 5 | Reunión General Mensual | — |
| 6 | Predicación en Locales | — |
| 7 | Confraternidad | — |
| 8 | Retiro Espiritual | — |
| 9 | Santa Cena | — |
| 10 | Pedestre | — |

### Roles de Actividad

| ID | Nombre |
|----|--------|
| 1 | Predicador |
| 2 | Líder de Alabanza |
| 3 | Músico |
| 4 | Corista |
| 5 | Profesor Escuela Dominical |
| 6 | Portero |
| 7 | Vigilante |
| 8 | Ofrendero |
| 9 | Coordinador |

### Roles de Grupo

| ID | Nombre | Requiere Plena Comunión |
|----|--------|------------------------|
| 1 | Líder | Sí |
| 2 | Secretario | Sí |
| 3 | Tesorero | Sí |
| 4 | Vocal | No |
| 5 | Miembro | No |

### Tipos de Necesidad

| ID | Nombre |
|----|--------|
| 1 | Transporte |
| 2 | Alimentación |
| 3 | Hospedaje |
| 4 | Materiales |
| 5 | Equipos |
| 6 | Decoración |
| 7 | Aseo y Ornato |


