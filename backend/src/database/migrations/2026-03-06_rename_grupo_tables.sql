-- Migración: renombrar tablas de grupos
-- grupo_ministerial -> grupo
-- rol_grupo_ministerial -> rol_grupo
-- Fecha: 2026-03-06

BEGIN;

ALTER TABLE IF EXISTS rol_grupo_ministerial
  RENAME TO rol_grupo;

ALTER TABLE IF EXISTS grupo_ministerial
  RENAME TO grupo;

-- Índices/constraints comunes (opcionales)
ALTER INDEX IF EXISTS rol_grupo_ministerial_nombre_key
  RENAME TO rol_grupo_nombre_key;

ALTER INDEX IF EXISTS grupo_ministerial_nombre_key
  RENAME TO grupo_nombre_key;

COMMIT;
