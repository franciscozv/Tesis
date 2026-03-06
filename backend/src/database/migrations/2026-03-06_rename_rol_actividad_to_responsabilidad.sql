-- Migración: rol_actividad -> responsabilidad_actividad
-- Fecha: 2026-03-06

BEGIN;

ALTER TABLE IF EXISTS rol_actividad RENAME TO responsabilidad_actividad;

ALTER TABLE IF EXISTS responsabilidad_actividad
  RENAME COLUMN id_rol TO id_responsabilidad;

ALTER TABLE IF EXISTS invitado
  RENAME COLUMN rol_id TO responsabilidad_id;

-- Índice único típico por nombre (si existe)
ALTER INDEX IF EXISTS rol_actividad_nombre_key RENAME TO responsabilidad_actividad_nombre_key;

-- Foreign key típica invitado.rol_id -> rol_actividad.id_rol (si existe)
ALTER TABLE IF EXISTS invitado
  RENAME CONSTRAINT invitado_rol_id_fkey TO invitado_responsabilidad_id_fkey;

COMMIT;
