import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Schema principal de Iglesia
 */
export const IglesiaSchema = z.object({
  id_iglesia: z.number(),
  iglesia_padre_id: z.number().nullable(),
  nombre: z.string(),
  ciudad: z.string().nullable(),
  direccion: z.string().nullable(),
  pastor_responsable: z.string().nullable(),
  telefono: z.string().nullable(),
  activo: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Iglesia = z.infer<typeof IglesiaSchema>;

/**
 * Schema extendido con información del templo padre (para GET con join)
 */
export const IglesiaConPadreSchema = IglesiaSchema.extend({
  templo_padre: z
    .object({
      id_iglesia: z.number(),
      nombre: z.string(),
    })
    .nullable(),
});

export type IglesiaConPadre = z.infer<typeof IglesiaConPadreSchema>;

/**
 * Schema para crear una nueva Iglesia
 */
export const CreateIglesiaSchema = z.object({
  body: z.object({
    nombre: z
      .string()
      .min(1, 'El nombre es obligatorio')
      .max(200, 'El nombre no puede superar los 200 caracteres'),
    iglesia_padre_id: z.number().int().positive().optional(),
    ciudad: z.string().max(100, 'La ciudad no puede superar los 100 caracteres').optional(),
    direccion: z.string().optional(),
    pastor_responsable: z
      .string()
      .max(200, 'El nombre del pastor no puede superar los 200 caracteres')
      .optional(),
    telefono: z.string().max(20, 'El teléfono no puede superar los 20 caracteres').optional(),
  }),
});

/**
 * Schema para obtener una Iglesia por ID
 */
export const GetIglesiaSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para obtener locales de un templo
 */
export const GetLocalesByTemploSchema = z.object({
  params: z.object({ iglesia_id: commonValidations.id }),
});

/**
 * Schema para actualizar una Iglesia
 */
export const UpdateIglesiaSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    nombre: z
      .string()
      .min(1, 'El nombre es obligatorio')
      .max(200, 'El nombre no puede superar los 200 caracteres')
      .optional(),
    iglesia_padre_id: z.number().int().positive().nullable().optional(),
    ciudad: z.string().max(100, 'La ciudad no puede superar los 100 caracteres').optional(),
    direccion: z.string().optional(),
    pastor_responsable: z
      .string()
      .max(200, 'El nombre del pastor no puede superar los 200 caracteres')
      .optional(),
    telefono: z.string().max(20, 'El teléfono no puede superar los 20 caracteres').optional(),
  }),
});
