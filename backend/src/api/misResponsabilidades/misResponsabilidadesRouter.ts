import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { verificarToken } from '@/common/middleware/authMiddleware';
import { misResponsabilidadesController } from './misResponsabilidadesController';

export const misResponsabilidadesRegistry = new OpenAPIRegistry();
export const misResponsabilidadesRouter: Router = express.Router();

// Schema para la respuesta
const ResponsabilidadSchema = z.object({
  id: z.number(),
  tipo: z.enum(['invitacion', 'colaboracion']),
  actividad: z.object({
    id: z.number(),
    nombre: z.string(),
    fecha: z.string(),
    hora_inicio: z.string(),
    hora_fin: z.string(),
    estado: z.string(),
  }),
  grupo: z.object({ id: z.number(), nombre: z.string() }).nullable(),
  tipo_actividad: z.object({ id: z.number(), nombre: z.string() }),
  rol: z.object({ id: z.number(), nombre: z.string() }).optional(),
  estado_invitacion: z.string().optional(),
  necesidad: z.object({ id: z.number(), descripcion: z.string() }).optional(),
  tipo_necesidad: z.object({ id: z.number(), nombre: z.string() }).optional(),
  cantidad_ofrecida: z.number().optional(),
  invitado_id: z.number().optional(),
});

misResponsabilidadesRegistry.register('Responsabilidad', ResponsabilidadSchema);

// Todas las rutas requieren autenticación
misResponsabilidadesRouter.use(verificarToken);

/**
 * GET /api/mis-responsabilidades
 */
misResponsabilidadesRegistry.registerPath({
  method: 'get',
  path: '/api/mis-responsabilidades',
  tags: ['Mis Responsabilidades'],
  summary: 'Obtiene invitaciones y colaboraciones aceptadas del usuario autenticado',
  responses: createApiResponse(z.array(ResponsabilidadSchema), 'Success'),
});
misResponsabilidadesRouter.get('/', misResponsabilidadesController.getAll);
