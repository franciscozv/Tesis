-- Renombrar tablas para estandarizar "necesidad"
ALTER TABLE tipo_necesidad_logistica RENAME TO tipo_necesidad;
ALTER TABLE necesidad_material RENAME TO necesidad;

-- Renombrar secuencias asociadas (si existen)
ALTER SEQUENCE IF EXISTS tipo_necesidad_logistica_id_tipo_seq RENAME TO tipo_necesidad_id_tipo_seq;
ALTER SEQUENCE IF EXISTS necesidad_material_id_seq RENAME TO necesidad_id_seq;
