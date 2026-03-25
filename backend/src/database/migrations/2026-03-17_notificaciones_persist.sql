-- ============================================================
-- Migración: persistencia de notificaciones offline
-- Fecha: 2026-03-17
-- ============================================================

CREATE TABLE IF NOT EXISTS notificacion (
  id         SERIAL PRIMARY KEY,
  miembro_id INT NOT NULL REFERENCES miembro(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL,
  mensaje    TEXT NOT NULL,
  detalle    TEXT,
  href       TEXT NOT NULL,
  leida      BOOLEAN NOT NULL DEFAULT false,
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificacion_miembro_leida
  ON notificacion(miembro_id, leida);
