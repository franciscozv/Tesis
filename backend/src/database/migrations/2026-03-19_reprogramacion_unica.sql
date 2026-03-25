-- Migración: Restricción de reprogramación única por actividad cancelada
-- Añade FK autorreferenciada con índice UNIQUE para garantizar que cada actividad
-- cancelada solo pueda generar una única actividad sucesora.

ALTER TABLE actividad
  ADD COLUMN IF NOT EXISTS reprogramada_en_id INTEGER REFERENCES actividad(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS actividad_reprogramada_en_id_unique
  ON actividad (reprogramada_en_id)
  WHERE reprogramada_en_id IS NOT NULL;
