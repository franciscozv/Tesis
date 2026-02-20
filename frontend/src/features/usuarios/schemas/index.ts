import { z } from 'zod';

const rolEnum = z.enum(['administrador', 'lider', 'miembro']);

export const createUsuarioSchema = z.object({
  email: z.string().email('Email inválido').max(100),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(100),
  rol: rolEnum,
  miembro_id: z.coerce.number().int().positive().optional().or(z.literal(0)),
});

export const updateUsuarioSchema = z.object({
  email: z.string().email('Email inválido').max(100),
  rol: rolEnum,
});

export type CreateUsuarioFormData = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioFormData = z.infer<typeof updateUsuarioSchema>;
