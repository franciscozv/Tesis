import { z } from 'zod';

export const responderInvitacionSchema = z
  .object({
    estado: z.enum(['confirmado', 'rechazado']),
    motivo_rechazo: z.string().max(500).optional(),
  })
  .refine(
    (data) =>
      data.estado !== 'rechazado' || (!!data.motivo_rechazo && data.motivo_rechazo.length >= 10),
    {
      message: 'El motivo es requerido al rechazar (mínimo 10 caracteres)',
      path: ['motivo_rechazo'],
    },
  );

export type ResponderInvitacionFormData = z.infer<typeof responderInvitacionSchema>;
