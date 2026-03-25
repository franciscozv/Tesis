'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { ApiResponse } from '@/features/auth/types';
import type { Notificacion, TipoNotificacion } from '@/features/notificaciones/types';
import apiClient from '@/lib/api-client';

interface NotificacionDB {
  id: number;
  tipo: string;
  mensaje: string;
  detalle?: string | null;
  href: string;
  leida: boolean;
  timestamp: string;
}

interface RawEvent {
  id?: number;
  tipo: TipoNotificacion | 'conectado';
  mensaje?: string;
  detalle?: string;
  href?: string;
  timestamp?: number;
  flush?: boolean;
}

interface NotificacionesContextValue {
  notificaciones: Notificacion[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificacionesContext = createContext<NotificacionesContextValue>({
  notificaciones: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
});

function dbToNotificacion(n: NotificacionDB): Notificacion {
  return {
    id: n.id,
    tipo: n.tipo as TipoNotificacion,
    mensaje: n.mensaje,
    detalle: n.detalle ?? undefined,
    href: n.href,
    leida: n.leida,
    timestamp: new Date(n.timestamp),
  };
}

/** Agrega una notificación al estado sin duplicar por id */
function addUnique(prev: Notificacion[], notif: Notificacion): Notificacion[] {
  if (prev.some((n) => n.id === notif.id)) return prev;
  return [notif, ...prev].slice(0, 50);
}

export function NotificacionesProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const esRef = useRef<EventSource | null>(null);
  /** IDs ya mostrados como toast — evita duplicados sin importar cuántas veces llegue el evento */
  const toastedIds = useRef<Set<number>>(new Set());

  // Fetch inicial — carga leídas y no leídas para mostrar historial completo
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    apiClient
      .get<ApiResponse<NotificacionDB[]>>('/notificaciones')
      .then(({ data }) => {
        const fromDb = (data.responseObject ?? []).map(dbToNotificacion);
        setNotificaciones((prev) => {
          // La BD es la fuente de verdad: reemplaza por id las que ya existen,
          // y agrega las que vinieron por SSE antes de que terminara el fetch.
          const dbIds = new Set(fromDb.map((n) => n.id));
          const sseOnly = prev.filter((n) => !dbIds.has(n.id));
          return [...fromDb, ...sseOnly].slice(0, 50);
        });
      })
      .catch(() => {
        // silencioso — no crítico
      });
  }, [token, isAuthenticated]);

  // SSE para notificaciones en tiempo real
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(
      /\/+$/,
      '',
    );
    const url = `${apiBase}/notificaciones/stream?token=${encodeURIComponent(token)}`;

    esRef.current?.close();

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data as string) as RawEvent;

        if (raw.tipo === 'conectado') return;
        if (!raw.mensaje || !raw.href || !raw.timestamp) return;

        // Usar id de BD si existe, si no usar timestamp como fallback (ej. canal admin)
        const notifId = raw.id ?? raw.timestamp;

        const notif: Notificacion = {
          id: notifId,
          tipo: raw.tipo as TipoNotificacion,
          mensaje: raw.mensaje,
          detalle: raw.detalle,
          href: raw.href,
          leida: false,
          timestamp: new Date(raw.timestamp),
        };

        // Actualizar estado (el updater debe ser puro — sin side effects)
        setNotificaciones((prev) => addUnique(prev, notif));

        // Toast fuera del updater: onmessage corre una sola vez por evento SSE.
        // El Set toastedIds garantiza idempotencia ante cualquier reconexión.
        if (!raw.flush && !toastedIds.current.has(notifId)) {
          toastedIds.current.add(notifId);
          toast(raw.mensaje, {
            description: raw.detalle,
            action: {
              label: 'Ver',
              onClick: () => {
                window.location.href = raw.href!;
              },
            },
          });
        }
      } catch (err) {
        console.error('[Notificaciones] Error parseando evento:', err);
      }
    };

    es.onerror = () => {
      // EventSource reconecta automáticamente
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [token, isAuthenticated]);

  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  const markAsRead = useCallback((id: number) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );
    apiClient.patch(`/notificaciones/${id}/leida`).catch(() => {});
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    apiClient.patch('/notificaciones/leidas').catch(() => {});
  }, []);

  const clearAll = useCallback(() => {
    setNotificaciones([]);
  }, []);

  return (
    <NotificacionesContext.Provider
      value={{ notificaciones, unreadCount, markAsRead, markAllAsRead, clearAll }}
    >
      {children}
    </NotificacionesContext.Provider>
  );
}

export const useNotificaciones = () => useContext(NotificacionesContext);
