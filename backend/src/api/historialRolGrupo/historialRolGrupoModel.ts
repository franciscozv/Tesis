import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Schema para Historial de Cambio de Rol en Grupo
 */
export const HistorialRolGrupoSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  miembro_grupo_id: z.number().openapi({ example: 3 }),
  rol_grupo_anterior: z.number().openapi({ example: 1 }),
  rol_grupo_nuevo: z.number().openapi({ example: 2 }),
  motivo: z.string().openapi({ example: 'Ascenso por buen desempeño en el ministerio' }),
  usuario_id: z.number().openapi({ example: 1 }),
  fecha_cambio: z.string().openapi({ example: '2024-01-15T10:00:00Z' }),
});

export type HistorialRolGrupo = z.infer<typeof HistorialRolGrupoSchema>;

/**
 * Schema para crear un registro de cambio de rol
 */
export const CreateHistorialRolGrupoSchema = z.object({
  body: z
    .object({
      miembro_grupo_id: z
        .number()
        .int('Debe ser un número entero')
        .positive('Debe ser un ID válido')
        .openapi({ example: 3 }),
      rol_grupo_anterior: z
        .number()
        .int('Debe ser un número entero')
        .positive('Debe ser un ID válido')
        .openapi({ example: 1 }),
      rol_grupo_nuevo: z
        .number()
        .int('Debe ser un número entero')
        .positive('Debe ser un ID válido')
        .openapi({ example: 2 }),
      motivo: z
        .string()
        .min(10, 'El motivo debe tener al menos 10 caracteres')
        .max(1000, 'El motivo no puede exceder 1000 caracteres')
        .openapi({ example: 'Ascenso por buen desempeño en el ministerio' }),
      usuario_id: z
        .number()
        .int('Debe ser un número entero')
        .positive('Debe ser un ID válido')
        .openapi({ example: 1 }),
    })
    .refine((data) => data.rol_grupo_anterior !== data.rol_grupo_nuevo, {
      message: 'El rol nuevo debe ser diferente al rol anterior',
      path: ['rol_grupo_nuevo'],
    }),
});

/**
 * Schema para obtener un registro por ID
 */
export const GetHistorialRolGrupoSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para filtros de listado (query params)
 */
export const ListHistorialRolGrupoQuerySchema = z.object({
  query: z.object({
    miembro_grupo_id: z
      .string()
      .regex(/^\d+$/, 'miembro_grupo_id debe ser un número')
      .transform(Number)
      .pipe(z.number().positive())
      .optional(),
  }),
});
