# API Endpoints - IEP Santa Juana

## Información Base

| Campo | Valor |
|-------|-------|
| **Base URL** | `http://localhost:4000/api` |
| **Autenticación** | Bearer Token (JWT) en header `Authorization` |
| **Content-Type** | `application/json` |

### Header de autenticación

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Formato de respuesta exitosa

```json
{
  "success": true,
  "message": "Operación exitosa",
  "responseObject": { ... },
  "statusCode": 200
}
```

### Formato de respuesta con error

```json
{
  "success": false,
  "message": "Descripción del error",
  "responseObject": null,
  "statusCode": 400
}
```

### Roles del sistema

| Rol | Descripción |
|-----|-------------|
| `administrador` | Acceso total al sistema |
| `lider` | Gestión de grupos y actividades |
| `miembro` | Acceso básico de lectura y respuesta a invitaciones |

### Credenciales por defecto (desarrollo)

| Rol | Email | Password |
|-----|-------|----------|
| Administrador | `admin@iepsantajuana.cl` | `Admin123!` |
| Líder | `lider@iepsantajuana.cl` | `Lider123!` |
| Miembro | `miembro1@test.cl` | `Miembro123!` |

---

## 1. Autenticación (`/api/auth`)

### POST `/api/auth/login`

Iniciar sesión y obtener token JWT.

- **Autenticación:** No requerida
- **Roles:** Público

**Request Body:**

```json
{
  "email": "admin@iepsantajuana.cl",
  "password": "Admin123!"
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Login exitoso",
  "responseObject": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": 1,
      "email": "admin@iepsantajuana.cl",
      "rol": "administrador",
      "miembro_id": 5
    }
  },
  "statusCode": 200
}
```

**Errores posibles:**

| Código | Mensaje |
|--------|---------|
| 401 | Credenciales inválidas |
| 403 | Usuario desactivado |

---

### POST `/api/auth/recuperar-password`

Solicitar email de recuperación de contraseña.

- **Autenticación:** No requerida

**Request Body:**

```json
{
  "email": "admin@iepsantajuana.cl"
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Se envió un correo con instrucciones para recuperar la contraseña",
  "responseObject": null,
  "statusCode": 200
}
```

---

### POST `/api/auth/reset-password`

Restablecer contraseña usando token de recuperación.

- **Autenticación:** No requerida

**Request Body:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "nueva_password": "NuevaPassword456"
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente",
  "responseObject": null,
  "statusCode": 200
}
```

**Errores posibles:**

| Código | Mensaje |
|--------|---------|
| 400 | Token inválido o expirado |

---

### PATCH `/api/auth/cambiar-password`

Cambiar contraseña del usuario autenticado.

- **Autenticación:** Sí (Bearer Token)
- **Roles:** Todos

**Request Body:**

```json
{
  "password_actual": "Admin123!",
  "password_nueva": "NuevaPassword456"
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Contraseña cambiada exitosamente",
  "responseObject": null,
  "statusCode": 200
}
```

**Errores posibles:**

| Código | Mensaje |
|--------|---------|
| 401 | Contraseña actual incorrecta |

---

## 2. Usuarios (`/api/usuarios`)

> Todos los endpoints requieren: `Bearer Token` + rol `administrador`

### GET `/api/usuarios`

Listar todos los usuarios del sistema.

**Response 200:**

```json
{
  "success": true,
  "responseObject": [
    {
      "id": 1,
      "miembro_id": 5,
      "email": "admin@iepsantajuana.cl",
      "rol": "administrador",
      "activo": true,
      "fecha_creacion": "2024-01-15T10:00:00.000Z",
      "ultimo_acceso": "2024-06-20T15:30:00.000Z"
    }
  ],
  "statusCode": 200
}
```

---

### GET `/api/usuarios/:id`

Obtener usuario por ID.

**Parámetros de ruta:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID del usuario |

**Response 200:**

```json
{
  "success": true,
  "responseObject": {
    "id": 1,
    "miembro_id": 5,
    "email": "admin@iepsantajuana.cl",
    "rol": "administrador",
    "activo": true,
    "fecha_creacion": "2024-01-15T10:00:00.000Z",
    "ultimo_acceso": "2024-06-20T15:30:00.000Z"
  },
  "statusCode": 200
}
```

**Errores posibles:**

| Código | Mensaje |
|--------|---------|
| 404 | Usuario no encontrado |

---

### POST `/api/usuarios`

Crear nuevo usuario (la contraseña se hashea con bcrypt).

**Request Body:**

```json
{
  "email": "nuevo@iepsantajuana.cl",
  "password": "Password123",
  "rol": "lider",
  "miembro_id": 5
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `email` | string | Sí | Email único del usuario |
| `password` | string | Sí | Contraseña (se hashea) |
| `rol` | string | Sí | `administrador` \| `lider` \| `miembro` |
| `miembro_id` | number \| null | No | ID del miembro vinculado |

**Response 201:**

```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "responseObject": {
    "id": 4,
    "email": "nuevo@iepsantajuana.cl",
    "rol": "lider",
    "miembro_id": 5,
    "activo": true
  },
  "statusCode": 201
}
```

---

### PUT `/api/usuarios/:id`

Actualizar email y/o rol de un usuario.

**Request Body:**

```json
{
  "email": "actualizado@iepsantajuana.cl",
  "rol": "lider"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `email` | string | No | Nuevo email |
| `rol` | string | No | `administrador` \| `lider` \| `miembro` |

---

### PATCH `/api/usuarios/:id/estado`

Activar o desactivar usuario.

**Request Body:**

```json
{
  "activo": false
}
```

---

## 3. Miembros (`/api/miembros`)

> Todos los endpoints requieren `Bearer Token`. Escritura solo para `administrador`.

### GET `/api/miembros`

Listar todos los miembros activos.

- **Roles:** Todos los autenticados

**Response 200:**

```json
{
  "success": true,
  "responseObject": [
    {
      "id": 1,
      "rut": "12345678-9",
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan@email.com",
      "telefono": "+56912345678",
      "fecha_nacimiento": "1990-05-15",
      "direccion": "Calle Principal 123",
      "genero": "masculino",
      "bautizado": true,
      "estado_comunion": "plena_comunion",
      "fecha_ingreso": "2024-01-15",
      "activo": true,
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-06-20T15:30:00.000Z"
    }
  ],
  "statusCode": 200
}
```

---

### GET `/api/miembros/:id`

Obtener miembro por ID.

- **Roles:** Todos los autenticados

---

### POST `/api/miembros`

Registrar nuevo miembro. *(RF_01)*

- **Roles:** `administrador`

**Request Body:**

```json
{
  "rut": "12345678-9",
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@email.com",
  "telefono": "+56912345678",
  "fecha_nacimiento": "1990-05-15",
  "direccion": "Calle Principal 123",
  "genero": "masculino",
  "bautizado": false,
  "estado_comunion": "asistente",
  "fecha_ingreso": "2024-01-15"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `rut` | string | Sí | RUT formato `12345678-9` |
| `nombre` | string | Sí | Nombre del miembro |
| `apellido` | string | Sí | Apellido del miembro |
| `email` | string | No | Email de contacto |
| `telefono` | string | No | Teléfono de contacto |
| `fecha_nacimiento` | string | No | Formato `YYYY-MM-DD` |
| `direccion` | string | No | Dirección física |
| `genero` | string | No | `masculino` \| `femenino` |
| `bautizado` | boolean | Sí | Indica si está bautizado |
| `estado_comunion` | string | Sí | `asistente` \| `probando` \| `plena_comunion` |
| `fecha_ingreso` | string | Sí | Formato `YYYY-MM-DD` |

**Response 201:**

```json
{
  "success": true,
  "message": "Miembro registrado exitosamente",
  "responseObject": {
    "id": 10,
    "rut": "12345678-9",
    "nombre": "Juan",
    "apellido": "Pérez",
    "activo": true
  },
  "statusCode": 201
}
```

---

### PUT `/api/miembros/:id`

Actualizar información del miembro. *(RF_03)*

- **Roles:** `administrador`

**Request Body:** Mismos campos que POST (todos opcionales).

---

### DELETE `/api/miembros/:id`

Eliminación lógica (soft delete).

- **Roles:** `administrador`

**Response 200:**

```json
{
  "success": true,
  "message": "Miembro eliminado exitosamente",
  "responseObject": null,
  "statusCode": 200
}
```

---

### PATCH `/api/miembros/:id/estado`

Cambiar estado de membresía. *(RF_05)*

- **Roles:** `administrador`

**Request Body:**

```json
{
  "estado_comunion": "plena_comunion"
}
```

| Valor | Descripción |
|-------|-------------|
| `asistente` | Sin membresía activa |
| `probando` | En período de prueba |
| `plena_comunion` | Miembro en plena comunión |

---

## 4. Grupos Ministeriales (`/api/grupos`)

> Todos requieren `Bearer Token`. Escritura solo para `administrador`.

### GET `/api/grupos`

Listar todos los grupos ministeriales activos.

- **Roles:** Todos los autenticados

**Response 200:**

```json
{
  "success": true,
  "responseObject": [
    {
      "id_grupo": 1,      "nombre": "Coro Oficial",
      "descripcion": "Coro oficial de la iglesia",
      "fecha_creacion": "2024-01-15",
      "activo": true,
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-06-20T15:30:00.000Z"
    }
  ],
  "statusCode": 200
}
```

---

### GET `/api/grupos/:id`

Obtener grupo por ID.

- **Roles:** Todos los autenticados

---

### POST `/api/grupos`

Crear nuevo grupo ministerial.

- **Roles:** `administrador`

**Request Body:**

```json
{
  "nombre": "Coro Oficial",  "descripcion": "Coro oficial de la iglesia",
  "fecha_creacion": "2024-01-15"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre` | string | Sí | Nombre del grupo |
| `descripcion` | string | No | Descripción del grupo |
| `fecha_creacion` | string | Sí | Formato `YYYY-MM-DD` |

---

### PUT `/api/grupos/:id`

Actualizar grupo ministerial.

- **Roles:** `administrador`

**Request Body:** Mismos campos que POST (todos opcionales).

---

### DELETE `/api/grupos/:id`

Eliminación lógica (soft delete).

- **Roles:** `administrador`

---

## 5. Membresía Grupo (`/api/comunion-grupo`)

> Todos requieren `Bearer Token`.

### POST `/api/comunion-grupo`

Vincular miembro a grupo. *(RF_06)*

- **Roles:** `administrador`, `lider`

**Request Body:**

```json
{
  "miembro_id": 5,
  "grupo_id": 2,
  "rol_grupo_id": 3,
  "fecha_vinculacion": "2024-01-15T10:00:00Z"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `miembro_id` | number | Sí | ID del miembro |
| `grupo_id` | number | Sí | ID del grupo |
| `rol_grupo_id` | number | Sí | ID del rol dentro del grupo |
| `fecha_vinculacion` | string | Sí | Fecha ISO 8601 |

**Response 201:**

```json
{
  "success": true,
  "message": "Miembro vinculado al grupo exitosamente",
  "responseObject": {
    "id_integrante": 10,
    "miembro_id": 5,
    "grupo_id": 2,
    "rol_grupo_id": 3,
    "fecha_vinculacion": "2024-01-15T10:00:00.000Z",
    "fecha_desvinculacion": null
  },
  "statusCode": 201
}
```

---

### PATCH `/api/comunion-grupo/:id/desvincular`

Desvincular miembro del grupo. *(RF_07)*

- **Roles:** `administrador`, `lider`

**Request Body:**

```json
{
  "fecha_desvinculacion": "2024-12-31T23:59:59Z"
}
```

---

### GET `/api/comunion-grupo/miembro/:miembro_id`

Obtener todos los grupos de un miembro.

- **Roles:** Todos los autenticados

**Response 200:**

```json
{
  "success": true,
  "responseObject": [
    {
      "id_integrante": 1,
      "miembro_id": 5,
      "grupo_id": 2,
      "rol_grupo_id": 3,
      "fecha_vinculacion": "2024-01-15T10:00:00.000Z",
      "fecha_desvinculacion": null
    }
  ],
  "statusCode": 200
}
```

---

### GET `/api/comunion-grupo/grupo/:grupo_id`

Obtener todos los miembros de un grupo.

- **Roles:** Todos los autenticados

---

## 6. Actividades (`/api/actividades`)

### GET `/api/actividades/publicas`

Obtener actividades públicas programadas futuras.

- **Autenticación:** No requerida

**Response 200:**

```json
{
  "success": true,
  "responseObject": [
    {
      "id": 1,
      "patron_id": 1,
      "tipo_actividad_id": 1,
      "nombre": "Culto dominical 12 enero",
      "descripcion": "Servicio regular del domingo",
      "fecha": "2025-01-12",
      "hora_inicio": "10:00:00",
      "hora_fin": "11:30:00",
      "grupo_id": 1,
      "es_publica": true,
      "estado": "programada",
      "motivo_cancelacion": null,
      "creador_id": 1,
      "fecha_creacion": "2024-12-01T10:00:00.000Z"
    }
  ],
  "statusCode": 200
}
```

---

### GET `/api/actividades`

Listar actividades con filtros opcionales.

- **Autenticación:** Sí
- **Roles:** Todos los autenticados

**Query Params:**

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `mes` | number | No | Mes (1-12) |
| `anio` | number | No | Año (YYYY) |
| `estado` | string | No | `programada` \| `realizada` \| `cancelada` |
| `es_publica` | string | No | `true` \| `false` |

**Ejemplo:** `GET /api/actividades?mes=3&anio=2025&estado=programada`

---

### GET `/api/actividades/:id`

Obtener actividad por ID.

- **Roles:** Todos los autenticados

---

### POST `/api/actividades`

Crear nueva actividad.

- **Roles:** `administrador`, `lider`

**Request Body:**

```json
{
  "patron_id": null,
  "tipo_actividad_id": 1,
  "nombre": "Culto especial de Navidad",
  "descripcion": "Celebración navideña",
  "fecha": "2025-12-25",
  "hora_inicio": "10:00",
  "hora_fin": "12:00",
  "grupo_id": 1,
  "es_publica": true,
  "creador_id": 1
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `patron_id` | number \| null | No | Patrón del que se generó |
| `tipo_actividad_id` | number | Sí | Tipo de actividad |
| `nombre` | string | Sí | Nombre de la actividad |
| `descripcion` | string | No | Descripción |
| `fecha` | string | Sí | Formato `YYYY-MM-DD` |
| `hora_inicio` | string | Sí | Formato `HH:MM` |
| `hora_fin` | string | Sí | Formato `HH:MM` |
| `grupo_id` | number \| null | No | Grupo organizador |
| `es_publica` | boolean | Sí | Visible públicamente |
| `creador_id` | number | Sí | ID del usuario creador |

---

### PUT `/api/actividades/:id`

Actualizar actividad.

- **Roles:** `administrador`, `lider`

**Request Body:** Mismos campos que POST (todos opcionales excepto `creador_id`).

---

### PATCH `/api/actividades/:id/estado`

Cambiar estado de la actividad (requiere `motivo_cancelacion` si se cancela).

- **Roles:** `administrador`, `lider`

**Request Body (realizar):**

```json
{
  "estado": "realizada"
}
```

**Request Body (cancelar):**

```json
{
  "estado": "cancelada",
  "motivo_cancelacion": "Lluvia torrencial impide el acceso al templo"
}
```

| Estado | Descripción |
|--------|-------------|
| `programada` | Actividad planificada |
| `realizada` | Actividad completada |
| `cancelada` | Actividad cancelada (requiere motivo) |

---

## 7. Patrones de Actividad (`/api/patrones`)

> Todos requieren `Bearer Token`.

### GET `/api/patrones`

Listar todos los patrones activos.

- **Roles:** Todos los autenticados

**Response 200:**

```json
{
  "success": true,
  "responseObject": [
    {
      "id": 1,
      "nombre": "Culto dominical matutino",
      "tipo_actividad_id": 1,
      "frecuencia": "semanal",
      "dia_semana": 7,
      "hora_inicio": "10:00:00",
      "duracion_minutos": 90,
      "lugar": "Templo principal",
      "grupo_id": 1,
      "es_publica": false,
      "activo": true,
      "fecha_creacion": "2024-01-15T10:00:00.000Z"
    }
  ],
  "statusCode": 200
}
```

---

### GET `/api/patrones/:id`

Obtener patrón por ID.

- **Roles:** Todos los autenticados

---

### POST `/api/patrones`

Crear nuevo patrón de actividad.

- **Roles:** `administrador`

**Request Body:**

```json
{
  "nombre": "Culto dominical matutino",
  "tipo_actividad_id": 1,
  "frecuencia": "semanal",
  "dia_semana": 7,
  "hora_inicio": "10:00",
  "duracion_minutos": 90,
  "lugar": "Templo principal",
  "grupo_id": 1,
  "es_publica": false
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre` | string | Sí | Nombre del patrón |
| `tipo_actividad_id` | number | Sí | Tipo de actividad |
| `frecuencia` | string | Sí | Ver tabla de frecuencias |
| `dia_semana` | number | Sí | 1=lunes ... 7=domingo |
| `hora_inicio` | string | Sí | Formato `HH:MM` |
| `duracion_minutos` | number | Sí | Duración en minutos |
| `lugar` | string | No | Lugar de la actividad |
| `grupo_id` | number \| null | No | Grupo organizador |
| `es_publica` | boolean | Sí | Visible públicamente |

**Frecuencias disponibles:**

| Valor | Descripción |
|-------|-------------|
| `semanal` | Todas las semanas |
| `primera_semana` | Solo la primera semana del mes |
| `segunda_semana` | Solo la segunda semana del mes |
| `tercera_semana` | Solo la tercera semana del mes |
| `cuarta_semana` | Solo la cuarta semana del mes |

---

### PUT `/api/patrones/:id`

Actualizar patrón.

- **Roles:** `administrador`

---

### PATCH `/api/patrones/:id/estado`

Activar/desactivar patrón.

- **Roles:** `administrador`

**Request Body:**

```json
{
  "activo": true
}
```

---

### POST `/api/patrones/generar-instancias`

Generar actividades desde todos los patrones activos para un mes/año.

- **Roles:** `administrador`

**Request Body:**

```json
{
  "mes": 3,
  "anio": 2025
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Instancias generadas exitosamente",
  "responseObject": {
    "total_patrones": 5,
    "total_actividades_creadas": 18,
    "detalle": [
      {
        "patron_id": 1,
        "patron_nombre": "Culto dominical matutino",
        "actividades_creadas": 4
      },
      {
        "patron_id": 2,
        "patron_nombre": "Reunión de oración miércoles",
        "actividades_creadas": 4
      }
    ]
  },
  "statusCode": 200
}
```

---

## 8. Invitados (`/api/invitados`)

> Todos requieren `Bearer Token`.

### GET `/api/invitados`

Listar invitaciones con filtros opcionales.

- **Roles:** Todos los autenticados

**Query Params:**

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `actividad_id` | number | No | Filtrar por actividad |
| `miembro_id` | number | No | Filtrar por miembro |
| `estado` | string | No | `pendiente` \| `confirmado` \| `rechazado` |

**Ejemplo:** `GET /api/invitados?actividad_id=1&estado=pendiente`

**Response 200:**

```json
{
  "success": true,
  "responseObject": [
    {
      "id": 1,
      "actividad_id": 1,
      "miembro_id": 5,
      "responsabilidad_id": 2,
      "estado": "pendiente",
      "motivo_rechazo": null,
      "asistio": false,
      "fecha_invitacion": "2024-12-01T10:00:00.000Z",
      "fecha_respuesta": null
    }
  ],
  "statusCode": 200
}
```

---

### GET `/api/invitados/:id`

Obtener invitación por ID.

- **Roles:** Todos los autenticados

---

### POST `/api/invitados`

Crear invitación para un miembro a una actividad.

- **Roles:** `administrador`, `lider`

**Request Body:**

```json
{
  "actividad_id": 1,
  "miembro_id": 5,
  "responsabilidad_id": 2
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `actividad_id` | number | Sí | ID de la actividad |
| `miembro_id` | number | Sí | ID del miembro invitado |
| `responsabilidad_id` | number | Sí | ID del responsabilidad de actividad asignado |

---

### PATCH `/api/invitados/:id/responder`

Confirmar o rechazar invitación (requiere `motivo_rechazo` si se rechaza).

- **Roles:** Todos los autenticados

**Request Body (confirmar):**

```json
{
  "estado": "confirmado"
}
```

**Request Body (rechazar):**

```json
{
  "estado": "rechazado",
  "motivo_rechazo": "No puedo asistir por compromisos laborales"
}
```

---

### PATCH `/api/invitados/:id/asistencia`

Marcar asistencia real del invitado.

- **Roles:** `administrador`, `lider`

**Request Body:**

```json
{
  "asistio": true
}
```

---

### DELETE `/api/invitados/:id`

Eliminar invitación (solo si está pendiente).

- **Roles:** `administrador`, `lider`

**Errores posibles:**

| Código | Mensaje |
|--------|---------|
| 400 | Solo se pueden eliminar invitaciones pendientes |

---

## 9. Necesidades Logísticas (`/api/necesidades`)

> Todos requieren `Bearer Token`.

### GET `/api/necesidades/abiertas`

Obtener necesidades abiertas para actividades en los próximos 60 días.

- **Roles:** Todos los autenticados

---

### GET `/api/necesidades`

Listar necesidades con filtros opcionales.

- **Roles:** Todos los autenticados

**Query Params:**

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `estado` | string | No | `abierta` \| `cubierta` \| `cerrada` |
| `actividad_id` | number | No | Filtrar por actividad |

---

### GET `/api/necesidades/:id`

Obtener necesidad por ID.

- **Roles:** Todos los autenticados

---

### POST `/api/necesidades`

Crear nueva necesidad logística.

- **Roles:** `administrador`, `lider`

**Request Body:**

```json
{
  "actividad_id": 1,
  "tipo_necesidad_id": 1,
  "descripcion": "Pan para la santa cena",
  "cantidad_requerida": 50,
  "unidad_medida": "unidades",
  "cantidad_cubierta": 0
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `actividad_id` | number | Sí | ID de la actividad |
| `tipo_necesidad_id` | number | Sí | ID del tipo de necesidad |
| `descripcion` | string | Sí | Descripción de la necesidad |
| `cantidad_requerida` | number | Sí | Cantidad total necesaria |
| `unidad_medida` | string | Sí | Unidad (ej: `unidades`, `litros`, `kg`) |
| `cantidad_cubierta` | number | No | Cantidad ya cubierta (default: 0) |

**Response 201:**

```json
{
  "success": true,
  "responseObject": {
    "id": 5,
    "actividad_id": 1,
    "tipo_necesidad_id": 1,
    "descripcion": "Pan para la santa cena",
    "cantidad_requerida": 50,
    "unidad_medida": "unidades",
    "cantidad_cubierta": 0,
    "estado": "abierta",
    "fecha_registro": "2025-01-15T10:00:00.000Z"
  },
  "statusCode": 201
}
```

---

### PUT `/api/necesidades/:id`

Actualizar necesidad logística.

- **Roles:** `administrador`, `lider`

---

### PATCH `/api/necesidades/:id/estado`

Cambiar estado de la necesidad.

- **Roles:** `administrador`, `lider`

**Request Body:**

```json
{
  "estado": "cubierta"
}
```

| Estado | Descripción |
|--------|-------------|
| `abierta` | Aún falta cubrir |
| `cubierta` | Completamente cubierta |
| `cerrada` | Cerrada manualmente |

---

### DELETE `/api/necesidades/:id`

Eliminar necesidad (solo si está abierta).

- **Roles:** `administrador`, `lider`

---

## 10. Colaboradores (`/api/colaboradores`)

> Todos requieren `Bearer Token`.

### GET `/api/colaboradores`

Listar colaboraciones con filtros opcionales.

- **Roles:** Todos los autenticados

**Query Params:**

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `necesidad_id` | number | No | Filtrar por necesidad |
| `miembro_id` | number | No | Filtrar por miembro |
| `estado` | string | No | `pendiente` \| `aceptada` \| `rechazada` |

---

### GET `/api/colaboradores/:id`

Obtener colaboración por ID.

- **Roles:** Todos los autenticados

---

### POST `/api/colaboradores`

Registrar oferta de colaboración voluntaria.

- **Roles:** Todos los autenticados

**Request Body:**

```json
{
  "necesidad_id": 1,
  "miembro_id": 5,
  "cantidad_ofrecida": 10,
  "observaciones": "Puedo traer pan casero"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `necesidad_id` | number | Sí | ID de la necesidad |
| `miembro_id` | number | Sí | ID del miembro colaborador |
| `cantidad_ofrecida` | number | Sí | Cantidad que ofrece |
| `observaciones` | string | No | Observaciones adicionales |

---

### PATCH `/api/colaboradores/:id/decision`

Aceptar o rechazar oferta de colaboración.

- **Roles:** `administrador`, `lider`

**Request Body:**

```json
{
  "estado": "aceptada"
}
```

---

### DELETE `/api/colaboradores/:id`

Eliminar colaboración (solo si está pendiente).

- **Roles:** Todos los autenticados

---

## 11. Candidatos - Scoring (`/api/candidatos`)

> Todos requieren `Bearer Token` + rol `administrador` o `lider`.

### POST `/api/candidatos/sugerir-responsabilidad`

Sugerir candidatos ideales para un responsabilidad de actividad (scoring automático).

**Request Body:**

```json
{
  "responsabilidad_id": 5,
  "fecha": "2025-03-15"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `responsabilidad_id` | number | Sí | ID del responsabilidad de actividad |
| `fecha` | string | Sí | Fecha de la actividad `YYYY-MM-DD` |

**Response 200:**

```json
{
  "success": true,
  "responseObject": [
    {
      "miembro_id": 5,
      "nombre_completo": "Juan Pérez",
      "puntuacion_total": 87,
      "desglose": {
        "experiencia": 25,
        "antiguedad": 22,
        "asistencia": 20,
        "disponibilidad": 20
      },
      "justificacion": "Alta experiencia en el rol, excelente asistencia",
      "telefono": "+56912345678",
      "email": "juan@email.com"
    },
    {
      "miembro_id": 3,
      "nombre_completo": "María López",
      "puntuacion_total": 72,
      "desglose": {
        "experiencia": 15,
        "antiguedad": 20,
        "asistencia": 18,
        "disponibilidad": 19
      },
      "justificacion": "Buena asistencia y disponibilidad",
      "telefono": "+56987654321",
      "email": "maria@email.com"
    }
  ],
  "statusCode": 200
}
```

---

### POST `/api/candidatos/sugerir-cargo`

Sugerir candidatos ideales para un cargo de grupo (scoring automático).

**Request Body:**

```json
{
  "cargo_id": 3,
  "fecha": "2025-03-15"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `cargo_id` | number | Sí | ID del rol de grupo |
| `fecha` | string | Sí | Fecha de referencia `YYYY-MM-DD` |

**Response 200:** Mismo formato que `sugerir-responsabilidad`.

---

## 12. Calendario (`/api/calendario`)

### GET `/api/calendario/publico`

Obtener calendario público de actividades.

- **Autenticación:** No requerida

**Query Params:**

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `mes` | number | Sí | Mes (1-12) |
| `anio` | number | Sí | Año (YYYY) |

**Ejemplo:** `GET /api/calendario/publico?mes=3&anio=2025`

**Response 200:**

```json
{
  "success": true,
  "responseObject": [
    {
      "id": 1,
      "nombre": "Culto dominical matutino",
      "tipo_actividad": {
        "id": 1,
        "nombre": "Culto dominical"
      },
      "fecha": "2025-03-02",
      "hora_inicio": "10:00:00",
      "hora_fin": "11:30:00",
      "lugar": "Templo principal",
      "grupo_organizador": {
        "id": 1,
        "nombre": "Alabanza"
      }
    }
  ],
  "statusCode": 200
}
```

---

### GET `/api/calendario/consolidado`

Obtener calendario consolidado con todas las actividades programadas.

- **Autenticación:** Sí
- **Roles:** Todos los autenticados

**Query Params:**

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `mes` | number | Sí | Mes (1-12) |
| `anio` | number | Sí | Año (YYYY) |

---

### GET `/api/calendario/mis-responsabilidades/:miembro_id`

Obtener responsabilidades futuras confirmadas de un miembro.

- **Autenticación:** Sí
- **Roles:** Todos los autenticados (valida que el token corresponda al miembro)

**Response 200:**

```json
{
  "success": true,
  "responseObject": [
    {
      "actividad": {
        "id": 5,
        "nombre": "Culto dominical 16 marzo",
        "fecha": "2025-03-16",
        "hora_inicio": "10:00:00",
        "hora_fin": "11:30:00",
        "lugar": "Templo principal"
      },
      "responsabilidad_asignada": {
        "id": 2,
        "nombre": "Músico"
      },
      "fecha_invitacion": "2025-03-01T10:00:00.000Z",
      "estado": "confirmado"
    }
  ],
  "statusCode": 200
}
```

---

## 13. Catálogos

### 13.1 Roles de Grupo (`/api/roles-grupo`)

> Todos requieren `Bearer Token`. Escritura solo para `administrador`.

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/roles-grupo` | Todos | Listar roles de grupo activos |
| GET | `/api/roles-grupo/:id` | Todos | Obtener rol por ID |
| POST | `/api/roles-grupo` | Admin | Crear rol de grupo |
| PUT | `/api/roles-grupo/:id` | Admin | Actualizar rol de grupo |
| DELETE | `/api/roles-grupo/:id` | Admin | Eliminación lógica |

**Schema RolGrupo:**

```json
{
  "id_rol_grupo": 1,
  "nombre": "Líder",
  "requiere_plena_comunion": true,
  "activo": true,
  "created_at": "2024-01-15T10:00:00.000Z",
  "updated_at": "2024-01-15T10:00:00.000Z"
}
```

**POST/PUT Body:**

```json
{
  "nombre": "Líder",
  "requiere_plena_comunion": true
}
```

---

### 13.2 Responsabilidades de Actividad (`/api/responsabilidades-actividad`)

> Todos requieren `Bearer Token`. Escritura solo para `administrador`.

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/responsabilidades-actividad` | Todos | Listar responsabilidades de actividad activos |
| GET | `/api/responsabilidades-actividad/:id` | Todos | Obtener rol por ID |
| POST | `/api/responsabilidades-actividad` | Admin | Crear responsabilidad de actividad |
| PUT | `/api/responsabilidades-actividad/:id` | Admin | Actualizar responsabilidad de actividad |
| DELETE | `/api/responsabilidades-actividad/:id` | Admin | Eliminación lógica |

**Schema ResponsabilidadActividad:**

```json
{
  "id_responsabilidad": 1,
  "nombre": "Coordinador",
  "descripcion": "Coordinador de la actividad",
  "activo": true,
  "created_at": "2024-01-15T10:00:00.000Z",
  "updated_at": "2024-01-15T10:00:00.000Z"
}
```

**POST/PUT Body:**

```json
{
  "nombre": "Coordinador",
  "descripcion": "Coordinador de la actividad"
}
```

---

### 13.3 Tipos de Actividad (`/api/tipos-actividad`)

> Todos requieren `Bearer Token`. Escritura solo para `administrador`.

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/tipos-actividad` | Todos | Listar tipos de actividad activos |
| GET | `/api/tipos-actividad/:id` | Todos | Obtener tipo por ID |
| POST | `/api/tipos-actividad` | Admin | Crear tipo de actividad |
| PUT | `/api/tipos-actividad/:id` | Admin | Actualizar tipo de actividad |
| DELETE | `/api/tipos-actividad/:id` | Admin | Eliminación lógica |

**Schema TipoActividad:**

```json
{
  "id_tipo": 1,
  "nombre": "Culto dominical",
  "descripcion": "Servicio principal del domingo",
  "color": "#3B82F6",
  "activo": true,
  "created_at": "2024-01-15T10:00:00.000Z",
  "updated_at": "2024-01-15T10:00:00.000Z"
}
```

**POST/PUT Body:**

```json
{
  "nombre": "Culto dominical",
  "descripcion": "Servicio principal del domingo",
  "color": "#3B82F6"
}
```

---

### 13.4 Tipos de Necesidad (`/api/tipos-necesidad`)

> Todos requieren `Bearer Token`. Escritura solo para `administrador`.

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/tipos-necesidad` | Todos | Listar tipos de necesidad activos |
| GET | `/api/tipos-necesidad/:id` | Todos | Obtener tipo por ID |
| POST | `/api/tipos-necesidad` | Admin | Crear tipo de necesidad |
| PUT | `/api/tipos-necesidad/:id` | Admin | Actualizar tipo de necesidad |
| DELETE | `/api/tipos-necesidad/:id` | Admin | Eliminación lógica |

**Schema TipoNecesidad:**

```json
{
  "id_tipo": 1,
  "nombre": "Alimentos",
  "descripcion": "Necesidades de alimentos y bebidas",
  "requiere_asignacion_beneficiarios": false,
  "activo": true,
  "created_at": "2024-01-15T10:00:00.000Z",
  "updated_at": "2024-01-15T10:00:00.000Z"
}
```

**POST/PUT Body:**

```json
{
  "nombre": "Alimentos",
  "descripcion": "Necesidades de alimentos y bebidas",
  "requiere_asignacion_beneficiarios": false
}
```

---

## 14. Historiales

### 14.1 Historial de Estado de Membresía (`/api/historial-estado`)

> Todos requieren `Bearer Token` + rol `administrador`.

### GET `/api/historial-estado`

Listar cambios de estado de membresía.

**Query Params:**

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `miembro_id` | number | No | Filtrar por miembro |

**Response 200:**

```json
{
  "success": true,
  "responseObject": [
    {
      "id": 1,
      "miembro_id": 5,
      "estado_anterior": "asistente",
      "estado_nuevo": "probando",
      "motivo": "El miembro ha completado el periodo de prueba",
      "usuario_id": 1,
      "fecha_cambio": "2024-06-15T10:00:00.000Z"
    }
  ],
  "statusCode": 200
}
```

---

### GET `/api/historial-estado/:id`

Obtener registro de historial por ID.

---

### POST `/api/historial-estado`

Registrar cambio de estado (actualiza automáticamente el miembro).

**Request Body:**

```json
{
  "miembro_id": 5,
  "estado_anterior": "asistente",
  "estado_nuevo": "probando",
  "motivo": "El miembro ha completado el periodo de prueba satisfactoriamente",
  "usuario_id": 1
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `miembro_id` | number | Sí | ID del miembro |
| `estado_anterior` | string | Sí | Estado actual del miembro |
| `estado_nuevo` | string | Sí | Nuevo estado |
| `motivo` | string | Sí | Motivo del cambio |
| `usuario_id` | number | Sí | ID del usuario que registra |

---

## 15. Flujos Comunes

### Flujo 1: Login y obtener token

```
1. POST /api/auth/login
   Body: { "email": "admin@iepsantajuana.cl", "password": "Admin123!" }
   → Obtener token del response

2. Usar en todas las peticiones siguientes:
   Header: Authorization: Bearer <token>
```

### Flujo 2: Crear miembro y vincularlo a un grupo

```
1. POST /api/miembros
   Body: {
     "rut": "12345678-9",
     "nombre": "Juan",
     "apellido": "Pérez",
     "bautizado": true,
     "estado_comunion": "plena_comunion",
     "fecha_ingreso": "2025-01-15"
   }
   → Obtener miembro.id (ej: 10)

2. GET /api/grupos
   → Obtener id_grupo del grupo deseado (ej: 2)

3. GET /api/roles-grupo
   → Obtener id_rol_grupo del rol deseado (ej: 3)

4. POST /api/comunion-grupo
   Body: {
     "miembro_id": 10,
     "grupo_id": 2,
     "rol_grupo_id": 3,
     "fecha_vinculacion": "2025-01-15T10:00:00Z"
   }
```

### Flujo 3: Crear actividad e invitar participantes

```
1. GET /api/tipos-actividad
   → Obtener id_tipo de la actividad (ej: 1)

2. POST /api/actividades
   Body: {
     "tipo_actividad_id": 1,
     "nombre": "Culto especial",
     "fecha": "2025-03-15",
     "hora_inicio": "10:00",
     "hora_fin": "12:00",
     "es_publica": true,
     "creador_id": 1
   }
   → Obtener actividad.id (ej: 20)

3. GET /api/responsabilidades-actividad
   → Obtener id_responsabilidad del rol a asignar (ej: 2)

4. POST /api/candidatos/sugerir-responsabilidad
   Body: { "responsabilidad_id": 2, "fecha": "2025-03-15" }
   → Ver candidatos sugeridos con scoring

5. POST /api/invitados
   Body: {
     "actividad_id": 20,
     "miembro_id": 5,
     "responsabilidad_id": 2
   }

6. (El miembro responde)
   PATCH /api/invitados/:id/responder
   Body: { "estado": "confirmado" }

7. (Después de la actividad, marcar asistencia)
   PATCH /api/invitados/:id/asistencia
   Body: { "asistio": true }
```

### Flujo 4: Generar instancias desde patrones

```
1. POST /api/patrones
   Body: {
     "nombre": "Culto dominical",
     "tipo_actividad_id": 1,
     "frecuencia": "semanal",
     "dia_semana": 7,
     "hora_inicio": "10:00",
     "duracion_minutos": 90,
     "lugar": "Templo principal",
     "es_publica": false
   }
   → Patrón creado

2. POST /api/patrones/generar-instancias
   Body: { "mes": 4, "anio": 2025 }
   → Se crean actividades automáticamente para cada domingo de abril

3. GET /api/actividades?mes=4&anio=2025
   → Ver todas las actividades generadas
```

### Flujo 5: Gestionar necesidades logísticas

```
1. POST /api/necesidades
   Body: {
     "actividad_id": 20,
     "tipo_necesidad_id": 1,
     "descripcion": "Pan para la santa cena",
     "cantidad_requerida": 50,
     "unidad_medida": "unidades"
   }
   → Necesidad creada (id: 5)

2. GET /api/necesidades/abiertas
   → Miembros ven necesidades disponibles

3. POST /api/colaboradores
   Body: {
     "necesidad_id": 5,
     "miembro_id": 8,
     "cantidad_ofrecida": 20,
     "observaciones": "Pan casero integral"
   }

4. PATCH /api/colaboradores/:id/decision
   Body: { "estado": "aceptada" }

5. PATCH /api/necesidades/5/estado
   Body: { "estado": "cubierta" }
```

---

## 16. Resumen de Endpoints

| Módulo | Prefijo | Endpoints | Auth |
|--------|---------|-----------|------|
| Autenticación | `/api/auth` | 4 | Mixto |
| Usuarios | `/api/usuarios` | 5 | Admin |
| Miembros | `/api/miembros` | 6 | Token + Admin(write) |
| Grupos Ministeriales | `/api/grupos` | 5 | Token + Admin(write) |
| Membresía Grupo | `/api/comunion-grupo` | 4 | Token + Admin/Líder(write) |
| Actividades | `/api/actividades` | 6 | Mixto |
| Patrones | `/api/patrones` | 6 | Token + Admin(write) |
| Invitados | `/api/invitados` | 6 | Token + Admin/Líder(write) |
| Necesidades | `/api/necesidades` | 7 | Token + Admin/Líder(write) |
| Colaboradores | `/api/colaboradores` | 5 | Token |
| Candidatos | `/api/candidatos` | 2 | Admin/Líder |
| Calendario | `/api/calendario` | 3 | Mixto |
| Roles Grupo | `/api/roles-grupo` | 5 | Token + Admin(write) |
| Roles Actividad | `/api/responsabilidades-actividad` | 5 | Token + Admin(write) |
| Tipos Actividad | `/api/tipos-actividad` | 5 | Token + Admin(write) |
| Tipos Necesidad | `/api/tipos-necesidad` | 5 | Token + Admin(write) |
| Historial Estado | `/api/historial-estado` | 3 | Admin |
| **Total** | | **86** | |

---

## 17. Endpoints Públicos (sin autenticación)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/recuperar-password` | Solicitar recuperación |
| POST | `/api/auth/reset-password` | Restablecer contraseña |
| GET | `/api/actividades/publicas` | Actividades públicas futuras |
| GET | `/api/calendario/publico` | Calendario público mensual |






