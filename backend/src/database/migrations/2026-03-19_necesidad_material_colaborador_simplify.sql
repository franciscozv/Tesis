-- Renombrar tabla necesidad_logistica a necesidad_material
ALTER TABLE necesidad_logistica RENAME TO necesidad_material;

-- Renombrar columna cantidad_ofrecida a cantidad_comprometida en colaborador
ALTER TABLE colaborador RENAME COLUMN cantidad_ofrecida TO cantidad_comprometida;

-- Eliminar campo estado (flujo de aprobación) y fecha_decision de colaborador
ALTER TABLE colaborador DROP COLUMN IF EXISTS estado;
ALTER TABLE colaborador DROP COLUMN IF EXISTS fecha_decision;

-- Agregar campo cumplio para verificación post-actividad
ALTER TABLE colaborador ADD COLUMN IF NOT EXISTS cumplio BOOLEAN NOT NULL DEFAULT false;
