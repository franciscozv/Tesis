import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Schema para tipo de actividad embebido en respuesta de calendario
 */
export const TipoActividadRefSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  nombre: z.string().openapi({ example: 'Culto' }),
});

/**
 * Schema para grupo organizador embebido en respuesta de calendario
 */
export const GrupoOrganizadorRefSchema = z.object({
  id: z.number().openapi({ example: 2 }),
  nombre: z.string().openapi({ example: 'Grupo Alabanza' }),
});

/**
 * Schema para un evento del calendario (público y consolidado)
 */
export const CalendarioEventoSchema = z.object({
  id: z.number().openapi({ example: 15 }),
  nombre: z.string().openapi({ example: 'Culto Martes 04/03/2025' }),
  tipo_actividad: TipoActividadRefSchema,
  fecha: z.string().openapi({ example: '2025-03-04' }),
  hora_inicio: z.string().openapi({ example: '19:00' }),
  hora_fin: z.string().openapi({ example: '21:00' }),
  lugar: z.string().nullable().openapi({ example: 'Templo Central' }),
  grupo_organizador: GrupoOrganizadorRefSchema.nullable(),
});

export type CalendarioEvento = z.infer<typeof CalendarioEventoSchema>;

/**
 * Schema para datos de actividad en "mis responsabilidades"
 */
export const ActividadResponsabilidadSchema = z.object({
  id: z.number().openapi({ example: 20 }),
  nombre: z.string().openapi({ example: 'Culto Domingo' }),
  fecha: z.string().openapi({ example: '2025-03-10' }),
  hora_inicio: z.string().openapi({ example: '10:00' }),
  hora_fin: z.string().openapi({ example: '12:00' }),
  lugar: z.string().nullable().openapi({ example: 'Templo Central' }),
});

/**
 * Schema para rol asignado embebido
 */
export const RolAsignadoRefSchema = z.object({
  id: z.number().openapi({ example: 3 }),
  nombre: z.string().openapi({ example: 'Predicador' }),
});

/**
 * Schema para una responsabilidad del miembro
 */
export const ResponsabilidadSchema = z.object({
  actividad: ActividadResponsabilidadSchema,
  rol_asignado: RolAsignadoRefSchema,
  fecha_invitacion: z.string().openapi({ example: '2025-02-15T10:30:00' }),
  estado: z.string().openapi({ example: 'confirmado' }),
});

export type Responsabilidad = z.infer<typeof ResponsabilidadSchema>;

/**
 * Schema de query params para calendario (mes y año requeridos)
 */
export const CalendarioQuerySchema = z.object({
  query: z.object({
    mes: z
      .string()
      .regex(/^\d{1,2}$/, 'Mes debe ser un número entre 1 y 12')
      .transform(Number)
      .pipe(z.number().min(1).max(12))
      .openapi({ example: '3' }),
    anio: z
      .string()
      .regex(/^\d{4}$/, 'Año debe ser un número de 4 dígitos')
      .transform(Number)
      .openapi({ example: '2025' }),
  }),
});

/**
 * Schema de params para mis responsabilidades
 */
export const MisResponsabilidadesSchema = z.object({
  params: z.object({ miembro_id: commonValidations.id }),
});
