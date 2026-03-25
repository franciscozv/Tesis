-- ============================================================
-- Migración: unificar tabla usuario en miembro
-- Fecha: 2026-03-16
-- ============================================================

-- 1. Agregar columnas de autenticación a miembro
ALTER TABLE miembro
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS rol VARCHAR(20) CHECK (rol IN ('administrador', 'usuario')),
  ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMPTZ;

-- 2. Copiar datos de autenticación desde usuario → miembro
--    (todos los usuarios del seed tienen miembro_id, así que esto cubre el 100%)
UPDATE miembro m
SET
  email          = u.email,
  password_hash  = u.password_hash,
  rol            = u.rol,
  fecha_creacion = u.fecha_creacion,
  ultimo_acceso  = u.ultimo_acceso
FROM usuario u
WHERE u.miembro_id = m.id;

-- 3. Redirigir actividad.creador_id: usuario.id → miembro.id
UPDATE actividad a
SET creador_id = u.miembro_id
FROM usuario u
WHERE a.creador_id = u.id;

ALTER TABLE actividad
  DROP CONSTRAINT IF EXISTS actividad_creador_id_fkey;

ALTER TABLE actividad
  ADD CONSTRAINT actividad_creador_id_fkey
    FOREIGN KEY (creador_id) REFERENCES miembro(id);

-- 4. Redirigir historial_estado.usuario_id: usuario.id → miembro.id
UPDATE historial_estado he
SET usuario_id = u.miembro_id
FROM usuario u
WHERE he.usuario_id = u.id;

ALTER TABLE historial_estado
  DROP CONSTRAINT IF EXISTS historial_estado_usuario_id_fkey;

ALTER TABLE historial_estado
  ADD CONSTRAINT historial_estado_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES miembro(id);

-- 5. Eliminar tabla usuario (ya no se necesita)
DROP TABLE IF EXISTS usuario;
