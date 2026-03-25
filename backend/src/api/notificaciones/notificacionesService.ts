import { type NotificacionEvent, notificacionBus } from '@/common/utils/notificacionBus';
import { logger } from '@/server';
import { notificacionesRepository } from './notificacionesRepository';

type EventInput = Omit<NotificacionEvent, 'id' | 'flush'>;

/**
 * Persiste la notificación en BD y la emite por SSE al usuario indicado.
 * Si está offline, queda guardada y se entregará al reconectar.
 */
export async function emitAndPersist(miembro_id: number, event: EventInput): Promise<void> {
  let savedId: number | undefined;

  try {
    const saved = await notificacionesRepository.save({
      miembro_id,
      tipo: event.tipo,
      mensaje: event.mensaje,
      detalle: event.detalle,
      href: event.href,
    });
    savedId = saved?.id;
  } catch (err) {
    logger.warn({ err }, '[notif] error al persistir notificación');
  }

  notificacionBus.emit(`user:${miembro_id}`, { ...event, id: savedId });
}

/**
 * Persiste la notificación en BD para cada admin/directiva activo y la emite
 * por el canal 'admin' del bus. Los destinatarios offline la recibirán al reconectar.
 */
export async function emitAndPersistAdmin(event: EventInput): Promise<void> {
  try {
    const miembroIds = await notificacionesRepository.findAdminMiembroIds();
    await Promise.all(
      miembroIds.map((id) =>
        notificacionesRepository.save({
          miembro_id: id,
          tipo: event.tipo,
          mensaje: event.mensaje,
          detalle: event.detalle,
          href: event.href,
        }),
      ),
    );
  } catch (err) {
    logger.warn({ err }, '[notif] error al persistir notificación admin');
  }

  notificacionBus.emit('admin', event);
}
