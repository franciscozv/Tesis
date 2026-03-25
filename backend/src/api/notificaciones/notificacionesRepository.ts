import { supabase } from '@/common/utils/supabaseClient';

export interface NotificacionDB {
  id: number;
  miembro_id: number;
  tipo: string;
  mensaje: string;
  detalle?: string | null;
  href: string;
  leida: boolean;
  timestamp: string;
}

export class NotificacionesRepository {
  async save(data: {
    miembro_id: number;
    tipo: string;
    mensaje: string;
    detalle?: string;
    href: string;
  }): Promise<NotificacionDB | null> {
    const { data: row, error } = await supabase.from('notificacion').insert(data).select().single();
    if (error) return null;
    return row as NotificacionDB;
  }

  async findNoLeidas(miembro_id: number): Promise<NotificacionDB[]> {
    const { data } = await supabase
      .from('notificacion')
      .select('*')
      .eq('miembro_id', miembro_id)
      .eq('leida', false)
      .order('timestamp', { ascending: false })
      .limit(50);
    return (data ?? []) as NotificacionDB[];
  }

  async findRecent(miembro_id: number): Promise<NotificacionDB[]> {
    const { data } = await supabase
      .from('notificacion')
      .select('*')
      .eq('miembro_id', miembro_id)
      .order('timestamp', { ascending: false })
      .limit(30);
    return (data ?? []) as NotificacionDB[];
  }

  /**
   * Retorna los miembro_id de todos los administradores y directiva activos.
   * Son los destinatarios del canal 'admin' del bus de notificaciones.
   */
  async findAdminMiembroIds(): Promise<number[]> {
    const [{ data: admins }, { data: directiva }] = await Promise.all([
      supabase.from('miembro').select('id').eq('rol', 'administrador').eq('activo', true),
      supabase
        .from('integrante_grupo')
        .select('miembro_id, rol_grupo!inner(es_directiva)')
        .eq('rol_grupo.es_directiva', true)
        .is('fecha_desvinculacion', null),
    ]);

    const ids = new Set<number>();
    for (const a of admins ?? []) ids.add(a.id);
    for (const d of directiva ?? []) ids.add((d as any).miembro_id);
    return [...ids];
  }

  async markOneAsLeida(id: number, miembro_id: number): Promise<void> {
    await supabase
      .from('notificacion')
      .update({ leida: true })
      .eq('id', id)
      .eq('miembro_id', miembro_id);
  }

  async markAllAsLeidas(miembro_id: number): Promise<void> {
    await supabase
      .from('notificacion')
      .update({ leida: true })
      .eq('miembro_id', miembro_id)
      .eq('leida', false);
  }
}

export const notificacionesRepository = new NotificacionesRepository();
