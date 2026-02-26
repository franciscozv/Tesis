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
| Unicidad | Ãšnico en BD (error `23505`) |

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
| Formato | Email vÃ¡lido | Email vÃ¡lido |
| Max caracteres | 100 | 150 |
| Requerido | SÃ­ | No (opcional, transforma a `null`) |
| Unicidad | Ãšnico en BD | Ãšnico en BD |

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

### 1.4 TelÃ©fono

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

> **Nota:** El backend no valida formato chileno con regex. La validaciÃ³n es solo de longitud mÃ¡xima.

---

### 1.5 Fechas

```typescript
// Formato fecha (YYYY-MM-DD)
fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

// Formato datetime (ISO 8601)
fecha_vinculacion: z.string().datetime()
```

| Tipo | Regex/ValidaciÃ³n | Ejemplo |
|------|------------------|---------|
| Fecha simple | `/^\d{4}-\d{2}-\d{2}$/` | `2025-03-15` |
| Datetime | `z.string().datetime()` | `2025-03-15T10:00:00Z` |
| Fecha vÃ¡lida | `z.string().date()` | `2025-03-15` |

**Formato display vs almacenamiento:**

| Contexto | Formato | Ejemplo |
|----------|---------|---------|
| Backend/BD | `YYYY-MM-DD` | `2025-03-15` |
| Display usuario | `DD/MM/YYYY` | `15/03/2025` |
| Datetime BD | ISO 8601 | `2025-03-15T10:00:00.000Z` |

**Restricciones especÃ­ficas por mÃ³dulo:**

| Campo | RestricciÃ³n |
|-------|-------------|
| `fecha_nacimiento` (miembro) | Fecha vÃ¡lida, sin restricciÃ³n de edad |
| `fecha_ingreso` (miembro) | Fecha vÃ¡lida, sin restricciÃ³n pasado/futuro |
| `fecha` (actividad) | Solo formato, sin restricciÃ³n pasado/futuro |
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

### 1.7 Textos con Longitud MÃ­nima

| Campo | Min | Max | MÃ³dulo |
|-------|-----|-----|--------|
| `nombre` (miembro) | 2 | 100 | Miembros |
| `apellido` (miembro) | 2 | 100 | Miembros |
| `nombre` (grupo) | 2 | 100 | Grupos Ministeriales |
| `nombre` (rol grupo) | 2 | 50 | Roles Grupo |
| `nombre` (rol actividad) | 1 | 100 | Roles Actividad |
| `nombre` (tipo actividad) | 1 | 100 | Tipos Actividad |
| `nombre` (tipo necesidad) | 1 | 100 | Tipos Necesidad |
| `nombre` (patrÃ³n) | 1 | 100 | Patrones |
| `nombre` (actividad) | 1 | 150 | Actividades |
| `lugar` (patrÃ³n) | 1 | 200 | Patrones |
| `descripcion` (necesidad) | 1 | 1000 | Necesidades |
| `motivo_cancelacion` | 1 | 500 | Actividades |
| `motivo_rechazo` | 1 | 500 | Invitados |
| `motivo` (historial estado) | 10 | 1000 | Historial Estado |
| `observaciones` (colaborador) | â€” | 500 | Colaboradores |
| `unidad_medida` | 1 | 50 | Necesidades |

---

### 1.8 NÃºmeros (Rangos Permitidos)

| Campo | Tipo | Min | Max | MÃ³dulo |
|-------|------|-----|-----|--------|
| `dia_semana` | int | 1 | 7 | Patrones |
| `duracion_minutos` | int | 1 | â€” | Patrones |
| `mes` (query) | int | 1 | 12 | Calendario / Patrones |
| `anio` (query) | int | 2020 | 2100 | Patrones |
| `cantidad_requerida` | number | >0 | â€” | Necesidades |
| `cantidad_cubierta` | number | â‰¥0 | â€” | Necesidades |
| `cantidad_ofrecida` | number | >0 | â€” | Colaboradores |
| IDs generales | int | >0 | â€” | Todos |

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

| Valor | DescripciÃ³n |
|-------|-------------|
| `administrador` | Acceso completo al sistema |
| `lider` | GestiÃ³n de grupos y actividades |
| `miembro` | Acceso bÃ¡sico |

---

### 2.2 Estado de MembresÃ­a

```typescript
const EstadoMembresiaEnum = z.enum(['sin_membresia', 'probando', 'plena_comunion']);
```

| Valor | DescripciÃ³n |
|-------|-------------|
| `sin_membresia` | Sin membresÃ­a activa |
| `probando` | En perÃ­odo de prueba |
| `plena_comunion` | Miembro pleno |

---

### 2.3 GÃ©nero

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
programada â†’ realizada    âœ…
programada â†’ cancelada    âœ… (requiere motivo_cancelacion)
realizada  â†’ cancelada    âœ… (requiere motivo_cancelacion)
cancelada  â†’ programada   âŒ
cancelada  â†’ realizada    âŒ
realizada  â†’ programada   âŒ
mismo â†’ mismo             âŒ
```

---

### 2.5 Estado de InvitaciÃ³n

```typescript
const EstadoInvitadoEnum = z.enum(['pendiente', 'confirmado', 'rechazado']);
```

**Transiciones permitidas:**

```
pendiente  â†’ confirmado   âœ…
pendiente  â†’ rechazado    âœ… (requiere motivo_rechazo)
confirmado â†’ *            âŒ
rechazado  â†’ *            âŒ
```

---

### 2.6 Estado de Necesidad LogÃ­stica

```typescript
const EstadoNecesidadEnum = z.enum(['abierta', 'cubierta', 'cerrada']);
```

**Transiciones permitidas:**

```
abierta  â†’ cubierta   âœ…
abierta  â†’ cerrada    âœ…
cubierta â†’ abierta    âœ…
cubierta â†’ cerrada    âœ…
cerrada  â†’ cubierta   âœ…
cerrada  â†’ abierta    âŒ
mismo â†’ mismo         âŒ
```

---

### 2.7 Estado de Colaborador

```typescript
const EstadoColaboradorEnum = z.enum(['pendiente', 'aceptada', 'rechazada']);
```

**Transiciones permitidas:**

```
pendiente â†’ aceptada   âœ…
pendiente â†’ rechazada  âœ…
aceptada  â†’ *          âŒ
rechazada â†’ *          âŒ
```

---

### 2.8 Frecuencia de PatrÃ³n

```typescript
const FrecuenciaEnum = z.enum([
  'semanal',
  'primera_semana',
  'segunda_semana',
  'tercera_semana',
  'cuarta_semana'
]);
```

| Valor | DescripciÃ³n |
|-------|-------------|
| `semanal` | Todas las semanas del mes |
| `primera_semana` | Solo la 1ra semana |
| `segunda_semana` | Solo la 2da semana |
| `tercera_semana` | Solo la 3ra semana |
| `cuarta_semana` | Solo la 4ta semana |

---

### 2.9 DÃ­a de la Semana

| Valor | DÃ­a |
|-------|-----|
| 1 | Lunes |
| 2 | Martes |
| 3 | MiÃ©rcoles |
| 4 | Jueves |
| 5 | Viernes |
| 6 | SÃ¡bado |
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

### 3.3 CÃ³digos HTTP Usados

| CÃ³digo | Significado | CuÃ¡ndo |
|--------|-------------|--------|
| 200 | OK | Lectura, actualizaciÃ³n, eliminaciÃ³n exitosa |
| 201 | Created | CreaciÃ³n exitosa |
| 400 | Bad Request | ValidaciÃ³n Zod fallida, regla de negocio violada |
| 401 | Unauthorized | Token invÃ¡lido, expirado o ausente |
| 403 | Forbidden | Rol no autorizado, acceso a recurso de otro usuario |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Duplicado (email, RUT, nombre Ãºnico) |
| 500 | Internal Server Error | Error inesperado del servidor |

### 3.4 Error de ValidaciÃ³n Zod

Cuando falla la validaciÃ³n Zod, el backend retorna los detalles del error:

```json
{
  "success": false,
  "message": "Datos de entrada invÃ¡lidos",
  "responseObject": null,
  "statusCode": 400
}
```

---

## 4. Permisos por Rol

### 4.1 Matriz de Permisos

| MÃ³dulo | Leer | Crear | Editar | Eliminar | Cambiar Estado |
|--------|------|-------|--------|----------|----------------|
| **Usuarios** | Admin | Admin | Admin | â€” | Admin |
| **Miembros** | Todos | Admin | Admin | Admin | Admin |
| **Grupos** | Todos | Admin | Admin | Admin | â€” |
| **MembresÃ­a Grupo** | Todos | Admin, LÃ­der | â€” | â€” | Admin, LÃ­der |
| **Actividades** | Todos* | Admin, LÃ­der | Admin, LÃ­der | â€” | Admin, LÃ­der |
| **Patrones** | Todos | Admin | Admin | â€” | Admin |
| **Invitados** | Todos | Admin, LÃ­der | â€” | Admin, LÃ­der | Todos** |
| **Necesidades** | Todos | Admin, LÃ­der | Admin, LÃ­der | Admin, LÃ­der | Admin, LÃ­der |
| **Colaboradores** | Todos | Todos | â€” | Todos*** | Admin, LÃ­der |
| **Candidatos** | â€” | Admin, LÃ­der | â€” | â€” | â€” |
| **Calendario** | Todos* | â€” | â€” | â€” | â€” |
| **Roles Grupo** | Todos | Admin | Admin | Admin | â€” |
| **Roles Actividad** | Todos | Admin | Admin | Admin | â€” |
| **Tipos Actividad** | Todos | Admin | Admin | Admin | â€” |
| **Tipos Necesidad** | Todos | Admin | Admin | Admin | â€” |
| **Historial Estado** | Admin | Admin | â€” | â€” | â€” |
| **Historial Rol** | Admin, LÃ­der | Admin, LÃ­der | â€” | â€” | â€” |

\* Incluye endpoints pÃºblicos (sin auth).
\** Solo responder su propia invitaciÃ³n; marcar asistencia = Admin, LÃ­der.
\*** Solo eliminar propia colaboraciÃ³n pendiente.

### 4.2 Endpoints PÃºblicos (sin autenticaciÃ³n)

| Endpoint | DescripciÃ³n |
|----------|-------------|
| `POST /api/auth/login` | Iniciar sesiÃ³n |
| `POST /api/auth/recuperar-password` | Solicitar recuperaciÃ³n |
| `POST /api/auth/reset-password` | Restablecer contraseÃ±a |
| `GET /api/actividades/publicas` | Actividades pÃºblicas futuras |
| `GET /api/calendario/publico` | Calendario pÃºblico mensual |

---

## 5. Reglas de Negocio Importantes

### 5.1 Requisito de Plena ComuniÃ³n

Varias operaciones requieren que el miembro tenga `estado_membresia = 'plena_comunion'`:

| OperaciÃ³n | Requisito |
|-----------|-----------|
| Ser lÃ­der principal de grupo | Plena comuniÃ³n |
| Vincularse a grupo ministerial | Plena comuniÃ³n |
| Roles con `requiere_plena_comunion = true` | Plena comuniÃ³n |

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
| (miembro, grupo, rol) activo | membresÃ­a grupo | 409 Conflict |
| (miembro, actividad, rol) | invitados | 409 Conflict |
| (miembro, necesidad) pendiente | colaboradores | 409 Conflict |

---

### 5.3 EliminaciÃ³n Condicionada

No se puede eliminar un recurso si estÃ¡ en uso:

| Recurso | CondiciÃ³n para eliminar |
|---------|------------------------|
| Grupo ministerial | No tener miembros activos (`fecha_desvinculacion IS NULL`) |
| Rol de grupo | No estar asignado en membresÃ­as activas |
| Rol de actividad | No estar usado en invitaciones |
| Tipo de actividad | No estar usado en actividades activas |
| Tipo de necesidad | No estar usado en necesidades |
| InvitaciÃ³n | Solo si `estado = 'pendiente'` |
| Necesidad | Solo si `estado = 'abierta'` |
| ColaboraciÃ³n | Solo si `estado = 'pendiente'` |

---

### 5.4 RelaciÃ³n hora_inicio < hora_fin

```typescript
// ValidaciÃ³n en actividadesService
if (hora_fin <= hora_inicio) {
  throw "La hora de fin debe ser mayor a la hora de inicio";
}
```

Se valida en el **service**, no en el schema Zod. El frontend debe replicar esta validaciÃ³n con `.refine()`:

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
cantidad_ofrecida <= cantidad_faltante             (al crear colaboraciÃ³n)
cantidad_faltante = cantidad_requerida - cantidad_cubierta
```

- Al **aceptar** una colaboraciÃ³n, se suma `cantidad_ofrecida` a `cantidad_cubierta` automÃ¡ticamente.
- Se valida que la suma no exceda `cantidad_requerida`.

---

### 5.6 Motivo Obligatorio Condicionalmente

Hay dos schemas con `.refine()` que exigen motivo segÃºn el estado:

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

**Rechazar invitaciÃ³n:**

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
estado_anterior enviado === miembro.estado_membresia actual   â†’ âœ…
estado_anterior enviado !== miembro.estado_membresia actual   â†’ âŒ 400
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
actividad.estado === 'cancelada' â†’ No se puede editar (PUT)
actividad.estado === 'cancelada' â†’ No se puede cambiar estado (PATCH)
```

---

### 5.9 Scoring de Candidatos

El algoritmo de puntuaciÃ³n para sugerir candidatos:

| Criterio | Puntos | CondiciÃ³n |
|----------|--------|-----------|
| **Experiencia** (0-30) | 30 | â‰¥10 veces en el rol |
| | 20 | â‰¥5 veces |
| | 10 | â‰¥1 vez |
| | 0 | Sin experiencia |
| **AntigÃ¼edad** (0-20) | 20 | â‰¥10 aÃ±os + plena comuniÃ³n |
| | 15 | â‰¥5 aÃ±os + plena comuniÃ³n |
| | 10 | â‰¥3 aÃ±os + plena comuniÃ³n |
| | 5 | â‰¥1 aÃ±o + plena comuniÃ³n |
| | 0 | Sin plena comuniÃ³n |
| **Asistencia** (0-30) | 30 | â‰¥90% |
| | 20 | â‰¥75% |
| | 10 | â‰¥50% |
| | 0 | <50% |
| **Disponibilidad** (0-20) | 20 | Sin conflicto en la fecha |
| | 0 | Tiene conflicto |
| **Total mÃ¡ximo** | **100** | |

**Manejo de divisiÃ³n por 0 en asistencia:**
- Si el miembro no tiene invitaciones (total = 0), el porcentaje de asistencia se calcula como 0%.
- No se produce error de divisiÃ³n por cero.

**LÃ­mite de resultados:** Top 20 candidatos ordenados por `puntuacion_total` descendente.

---

### 5.10 GeneraciÃ³n de Instancias desde Patrones

- Solo se generan desde patrones **activos**.
- Si no hay patrones activos, retorna error.
- Calcula fechas segÃºn `frecuencia` y `dia_semana`.
- `hora_fin` se calcula automÃ¡ticamente: `hora_inicio + duracion_minutos`.
- Se crean con `estado = 'programada'` y `patron_id` vinculado.

---

### 5.11 Token JWT

| Campo | DescripciÃ³n |
|-------|-------------|
| `id` | ID del usuario |
| `email` | Email del usuario |
| `rol` | Rol del usuario |
| `miembro_id` | ID del miembro vinculado (puede ser `null`) |
| ExpiraciÃ³n | Configurada por variable de entorno |
| Reset token | Expira en 1 hora, tipo `password_reset` |

---

### 5.12 Calendario - ValidaciÃ³n de Propiedad

`GET /api/calendario/mis-responsabilidades/:miembro_id` valida que el `miembro_id` del token coincida con el `:miembro_id` de la URL. Si no coincide â†’ **403 Forbidden**.

---

## 6. ValidaciÃ³n ComÃºn de IDs (Params)

Todos los endpoints con `:id` en la ruta usan esta validaciÃ³n:

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

## 7. Schemas Zod Completos por MÃ³dulo

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
const EstadoMembresiaEnum = z.enum(['sin_membresia', 'probando', 'plena_comunion']);
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
  estado_membresia: EstadoMembresiaEnum.default('sin_membresia'),
  fecha_ingreso: z.string().date(),
});

const UpdateMiembroSchema = CreateMiembroSchema.partial();

const PatchEstadoMiembroSchema = z.object({
  estado_membresia: EstadoMembresiaEnum,
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

### 7.5 MembresÃ­a Grupo

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

### 7.9 Necesidades LogÃ­sticas

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
  estado_anterior: EstadoMembresiaEnum,
  estado_nuevo: EstadoMembresiaEnum,
  motivo: z.string().min(10).max(1000),
  usuario_id: z.number().int().positive(),
}).refine(
  (data) => data.estado_nuevo !== data.estado_anterior,
  { message: "El estado nuevo debe ser diferente al anterior" }
);
```

## 8. Datos Semilla (CatÃ¡logos por Defecto)

### Tipos de Actividad

| ID | Nombre | Color |
|----|--------|-------|
| 1 | Culto | â€” |
| 2 | Escuela Dominical | â€” |
| 3 | ReuniÃ³n de OraciÃ³n | â€” |
| 4 | Ensayo de Coro | â€” |
| 5 | ReuniÃ³n General Mensual | â€” |
| 6 | PredicaciÃ³n en Locales | â€” |
| 7 | Confraternidad | â€” |
| 8 | Retiro Espiritual | â€” |
| 9 | Santa Cena | â€” |
| 10 | Pedestre | â€” |

### Roles de Actividad

| ID | Nombre |
|----|--------|
| 1 | Predicador |
| 2 | LÃ­der de Alabanza |
| 3 | MÃºsico |
| 4 | Corista |
| 5 | Profesor Escuela Dominical |
| 6 | Portero |
| 7 | Vigilante |
| 8 | Ofrendero |
| 9 | Coordinador |

### Roles de Grupo

| ID | Nombre | Requiere Plena ComuniÃ³n |
|----|--------|------------------------|
| 1 | LÃ­der | SÃ­ |
| 2 | Secretario | SÃ­ |
| 3 | Tesorero | SÃ­ |
| 4 | Vocal | No |
| 5 | Miembro | No |

### Tipos de Necesidad

| ID | Nombre |
|----|--------|
| 1 | Transporte |
| 2 | AlimentaciÃ³n |
| 3 | Hospedaje |
| 4 | Materiales |
| 5 | Equipos |
| 6 | DecoraciÃ³n |
| 7 | Aseo y Ornato |


