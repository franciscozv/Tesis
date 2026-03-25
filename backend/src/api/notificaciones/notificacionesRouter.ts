import { type Request, type Response, Router, type IRouter } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '@/common/middleware/authMiddleware';
import { verificarToken } from '@/common/middleware/authMiddleware';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { env } from '@/common/utils/envConfig';
import { type NotificacionEvent, notificacionBus } from '@/common/utils/notificacionBus';
import { supabase } from '@/common/utils/supabaseClient';
import { logger } from '@/server';
import { notificacionesRepository } from './notificacionesRepository';

const router: IRouter = Router();

/** Mapa de sendEvent activo por miembro_id — garantiza un solo listener por usuario */
const activeSendEvents = new Map<number, (e: NotificacionEvent) => void>();

/**
 * GET /api/notificaciones/stream?token=<jwt>
 *
 * SSE endpoint de tiempo real. Al conectar, entrega inmediatamente las
 * notificaciones no leídas persistidas (soporte offline).
 */
router.get('/stream', async (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;
  if (!token) {
    res.status(401).json({ message: 'Token requerido' });
    return;
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    req.socket.setNoDelay(true);
    req.socket.setKeepAlive(true, 10_000);
  } catch {
    // ignorar si el socket ya no está disponible
  }

  const sendEvent = (event: NotificacionEvent) => {
    if (res.writableEnded) return;
    logger.info(`SSE emit → miembro=${payload.id} tipo=${event.tipo}`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  // Canal personal — eliminar listener anterior si existía (evita duplicados en reconexión)
  const userChannel = `user:${payload.id}`;
  const prevSendEvent = activeSendEvents.get(payload.id);
  if (prevSendEvent) {
    notificacionBus.off(userChannel, prevSendEvent);
  }
  notificacionBus.on(userChannel, sendEvent);
  activeSendEvents.set(payload.id, sendEvent);

  // Canal admin si corresponde (admin siempre; usuario: verificar directiva en background)
  const isAdmin = payload.rol === 'administrador';
  if (isAdmin) {
    notificacionBus.on('admin', sendEvent);
  } else {
    setImmediate(async () => {
      try {
        if (res.writableEnded) return;
        const { data } = await supabase
          .from('integrante_grupo')
          .select('rol_grupo!inner(es_directiva)')
          .eq('miembro_id', payload.id)
          .eq('rol_grupo.es_directiva', true)
          .is('fecha_desvinculacion', null)
          .limit(1);
        if (data?.length && !res.writableEnded) {
          notificacionBus.on('admin', sendEvent);
        }
      } catch (err) {
        logger.warn({ err }, 'SSE: error verificando directiva');
      }
    });
  }

  logger.info(`SSE conectado: miembro=${payload.id} rol=${payload.rol} admin=${isAdmin}`);

  // Handshake
  res.write(`data: ${JSON.stringify({ tipo: 'conectado' })}\n\n`);

  // Flush de notificaciones no leídas (soporte offline)
  setImmediate(async () => {
    try {
      if (res.writableEnded) return;
      const pending = await notificacionesRepository.findNoLeidas(payload.id);
      for (const notif of pending) {
        if (res.writableEnded) break;
        sendEvent({
          id: notif.id,
          tipo: notif.tipo as 'nueva_invitacion' | 'nueva_colaboracion',
          mensaje: notif.mensaje,
          detalle: notif.detalle ?? undefined,
          href: notif.href,
          timestamp: new Date(notif.timestamp).getTime(),
          flush: true,
        });
      }
    } catch (err) {
      logger.warn({ err }, 'SSE: error enviando notificaciones pendientes');
    }
  });

  // Heartbeat cada 25s
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) res.write(': ping\n\n');
  }, 25_000);

  req.on('close', () => {
    logger.info(`SSE desconectado: miembro=${payload.id}`);
    clearInterval(heartbeat);
    notificacionBus.off(userChannel, sendEvent);
    notificacionBus.off('admin', sendEvent);
    // Limpiar solo si este sendEvent sigue siendo el activo
    if (activeSendEvents.get(payload.id) === sendEvent) {
      activeSendEvents.delete(payload.id);
    }
  });
});

/**
 * GET /api/notificaciones
 * Retorna las notificaciones no leídas del usuario autenticado.
 */
router.get('/', verificarToken, async (req: Request, res: Response) => {
  try {
    const notifs = await notificacionesRepository.findRecent(req.usuario!.id);
    res.status(StatusCodes.OK).send(ServiceResponse.success('Notificaciones obtenidas', notifs));
  } catch {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        ServiceResponse.failure(
          'Error al obtener notificaciones',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ),
      );
  }
});

/**
 * PATCH /api/notificaciones/:id/leida
 * Marca una notificación específica como leída.
 */
router.patch('/:id/leida', verificarToken, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(StatusCodes.BAD_REQUEST).send(ServiceResponse.failure('ID inválido', null, StatusCodes.BAD_REQUEST));
    return;
  }
  try {
    await notificacionesRepository.markOneAsLeida(id, req.usuario!.id);
    res.status(StatusCodes.OK).send(ServiceResponse.success('Notificación marcada como leída', null));
  } catch {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
      ServiceResponse.failure('Error al marcar notificación', null, StatusCodes.INTERNAL_SERVER_ERROR),
    );
  }
});

/**
 * PATCH /api/notificaciones/leidas
 * Marca todas las notificaciones del usuario como leídas.
 */
router.patch('/leidas', verificarToken, async (req: Request, res: Response) => {
  try {
    await notificacionesRepository.markAllAsLeidas(req.usuario!.id);
    res
      .status(StatusCodes.OK)
      .send(ServiceResponse.success('Notificaciones marcadas como leídas', null));
  } catch {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        ServiceResponse.failure(
          'Error al marcar notificaciones',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        ),
      );
  }
});

/**
 * GET /api/notificaciones/test-self?token=<jwt>
 * Dispara una notificación de prueba (solo desarrollo).
 */
router.get('/test-self', (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;
  if (!token) {
    res.status(401).json({ message: 'Token requerido' });
    return;
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    res.status(401).json({ message: 'Token inválido' });
    return;
  }

  const channel = `user:${payload.id}`;
  const listenerCount = notificacionBus.listenerCount(channel);
  logger.info(`[notif-test] emit → ${channel} (listeners: ${listenerCount})`);

  notificacionBus.emit(channel, {
    tipo: 'nueva_invitacion',
    mensaje: 'Notificación de prueba',
    href: '/dashboard/mis-responsabilidades',
    timestamp: Date.now(),
  });

  res.json({ ok: true, channel, listenerCount });
});

export { router as notificacionesRouter };
