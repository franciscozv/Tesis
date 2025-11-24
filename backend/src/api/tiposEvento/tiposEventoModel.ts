import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Schema principal de Tipo de Evento
 */
export const TipoEventoSchema = z.object({
  id_tipo_evento: z.number(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  color: z.string().nullable(),
  visible_publicamente: z.boolean(),
  activo: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type TipoEvento = z.infer<typeof TipoEventoSchema>;

/**
 * Schema para crear un nuevo Tipo de Evento
 */
export const CreateTipoEventoSchema = z.object({
  body: z.object({
    nombre: z
      .string()
      .min(1, 'El nombre es obligatorio')
      .max(100, 'El nombre no puede superar los 100 caracteres'),
    descripcion: z.string().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'El color debe estar en formato hexadecimal (ejemplo: #FF5733)')
      .optional(),
    visible_publicamente: z.boolean().default(false),
  }),
});

/**
 * Schema para obtener un Tipo de Evento por ID
 */
export const GetTipoEventoSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para actualizar un Tipo de Evento
 */
export const UpdateTipoEventoSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    nombre: z
      .string()
      .min(1, 'El nombre es obligatorio')
      .max(100, 'El nombre no puede superar los 100 caracteres')
      .optional(),
    descripcion: z.string().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, 'El color debe estar en formato hexadecimal (ejemplo: #FF5733)')
      .optional(),
    visible_publicamente: z.boolean().optional(),
  }),
});
