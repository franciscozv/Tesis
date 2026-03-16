-- Migración: Agregar tabla grupo_rol para restringir roles válidos por grupo
-- Fecha: 2026-03-13

-- 1. Crear tabla grupo_rol
CREATE TABLE IF NOT EXISTS grupo_rol (
  grupo_id     integer     NOT NULL REFERENCES grupo(id_grupo)         ON DELETE CASCADE,
  rol_grupo_id integer     NOT NULL REFERENCES rol_grupo(id_rol_grupo) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grupo_id, rol_grupo_id)
);

-- 2. Poblar con combinaciones ya existentes (evita violación FK al agregar constraint)
INSERT INTO grupo_rol (grupo_id, rol_grupo_id)
SELECT DISTINCT grupo_id, rol_grupo_id
FROM integrante_grupo
ON CONFLICT DO NOTHING;

-- 3. Agregar FK compuesta en integrante_grupo referenciando grupo_rol
ALTER TABLE integrante_grupo
  ADD CONSTRAINT fk_integrante_grupo_rol
  FOREIGN KEY (grupo_id, rol_grupo_id)
  REFERENCES grupo_rol(grupo_id, rol_grupo_id);
