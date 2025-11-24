import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Enum de ubicación tipo
 */
export const UbicacionTipoEnum = z.enum(['iglesia', 'otro']);
export type UbicacionTipo = z.infer<typeof UbicacionTipoEnum>;

/**
 * Enum de estados del evento
 */
export const EstadoEventoEnum = z.enum([
  'pendiente_aprobacion',
  'aprobado',
  'rechazado',
  'en_curso',
  'finalizado',
  'cancelado',
]);
export type EstadoEvento = z.infer<typeof EstadoEventoEnum>;

/**
 * Schema principal de Evento
 */
export const EventoSchema = z.object({
  id_evento: z.number(),
  tipo_evento_id: z.number(),
  grupo_organizador_id: z.number(),
  usuario_solicitante_id: z.number(),
  usuario_aprobador_id: z.number().nullable(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  fecha_inicio: z.string(),
  fecha_fin: z.string(),
  ubicacion_tipo: UbicacionTipoEnum,
  iglesia_id: z.number().nullable(),
  ubicacion_otra: z.string().nullable(),
  direccion_ubicacion: z.string().nullable(),
  estado: EstadoEventoEnum,
  fecha_solicitud: z.string(),
  fecha_aprobacion: z.string().nullable(),
  activo: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Evento = z.infer<typeof EventoSchema>;

/**
 * Schema de Iglesia Invitada
 */
export const IglesiaInvitadaSchema = z.object({
  id_iglesia: z.number(),
  nombre: z.string(),
  ciudad: z.string().nullable(),
});

export type IglesiaInvitada = z.infer<typeof IglesiaInvitadaSchema>;

/**
 * Schema extendido con iglesias invitadas
 */
export const EventoConIglesiasSchema = EventoSchema.extend({
  iglesias_invitadas: z.array(IglesiaInvitadaSchema),
});

export type EventoConIglesias = z.infer<typeof EventoConIglesiasSchema>;

/**
 * Schema para crear un nuevo Evento (RF_08)
 */
export const CreateEventoSchema = z
  .object({
    body: z
      .object({
        tipo_evento_id: z.number().int().positive(),
        grupo_organizador_id: z.number().int().positive(),
        usuario_solicitante_id: z.number().int().positive(),
        nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
        descripcion: z.string().optional(),
        fecha_inicio: z.string().datetime('Fecha de inicio debe ser una fecha válida'),
        fecha_fin: z.string().datetime('Fecha de fin debe ser una fecha válida'),
        ubicacion_tipo: UbicacionTipoEnum,
        iglesia_id: z.number().int().positive().optional(),
        ubicacion_otra: z.string().max(200).optional(),
        direccion_ubicacion: z.string().optional(),
        iglesias_invitadas: z.array(z.number().int().positive()).optional(),
        aprobar_automaticamente: z.boolean().optional(),
      })
      .refine(
        (data) => {
          if (data.ubicacion_tipo === 'iglesia') {
            return data.iglesia_id !== undefined;
          }
          return true;
        },
        {
          message: 'iglesia_id es obligatorio cuando ubicacion_tipo es "iglesia"',
          path: ['iglesia_id'],
        }
      )
      .refine(
        (data) => {
          if (data.ubicacion_tipo === 'otro') {
            return data.ubicacion_otra !== undefined && data.direccion_ubicacion !== undefined;
          }
          return true;
        },
        {
          message:
            'ubicacion_otra y direccion_ubicacion son obligatorios cuando ubicacion_tipo es "otro"',
          path: ['ubicacion_otra'],
        }
      )
      .refine(
        (data) => {
          return new Date(data.fecha_fin) >= new Date(data.fecha_inicio);
        },
        {
          message: 'La fecha de fin debe ser mayor o igual a la fecha de inicio',
          path: ['fecha_fin'],
        }
      ),
  });

/**
 * Schema para obtener un Evento por ID
 */
export const GetEventoSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

/**
 * Schema para aprobar un evento
 */
export const AprobarEventoSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    usuario_aprobador_id: z.number().int().positive(),
  }),
});

/**
 * Schema para rechazar un evento
 */
export const RechazarEventoSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    usuario_aprobador_id: z.number().int().positive(),
    motivo: z.string().optional(),
  }),
});

/**
 * Schema para cambiar el estado de un evento
 */
export const CambiarEstadoEventoSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    estado: z.enum(['en_curso', 'finalizado', 'cancelado']),
  }),
});
