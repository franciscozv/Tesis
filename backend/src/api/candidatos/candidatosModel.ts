import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

/**
 * Schema de desglose de puntuación
 */
export const DesglosePuntuacionSchema = z.object({
  experiencia: z.number().openapi({ example: 30 }),
  antiguedad: z.number().openapi({ example: 20 }),
  asistencia: z.number().openapi({ example: 25 }),
  disponibilidad: z.number().openapi({ example: 10 }),
});

/**
 * Schema de candidato sugerido
 */
export const CandidatoSchema = z.object({
  miembro_id: z.number().openapi({ example: 15 }),
  nombre_completo: z.string().openapi({ example: 'Juan Pérez López' }),
  puntuacion_total: z.number().openapi({ example: 85 }),
  desglose: DesglosePuntuacionSchema,
  justificacion: z.string().openapi({
    example: 'Ha asumido Predicador 12 veces, 15 años en plena comunión, 88% asistencia',
  }),
  telefono: z.string().nullable().openapi({ example: '+56912345678' }),
  email: z.string().nullable().openapi({ example: 'juan@email.com' }),
});

export type Candidato = z.infer<typeof CandidatoSchema>;

/**
 * Schema para sugerir candidatos para un rol en actividad
 */
export const SugerirRolSchema = z.object({
  body: z.object({
    rol_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .openapi({ example: 5 }),
    fecha: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
      .openapi({ example: '2025-03-15' }),
  }),
});

/**
 * Schema para sugerir candidatos para un cargo en grupo
 */
export const SugerirCargoSchema = z.object({
  body: z.object({
    cargo_id: z
      .number()
      .int('Debe ser un número entero')
      .positive('Debe ser un ID válido')
      .openapi({ example: 3 }),
  }),
});
