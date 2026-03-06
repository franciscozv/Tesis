import { supabase } from '@/common/utils/supabaseClient';
import type { CalendarioEvento, Responsabilidad } from './calendarioModel';

/**
 * Repositorio para operaciones de datos del Calendario
 */
export class CalendarioRepository {
  /**
   * Obtiene actividades públicas programadas dentro de un mes/año
   */
  async findPublicasAsync(mes: number, anio: number): Promise<CalendarioEvento[]> {
    const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const lastDay = new Date(anio, mes, 0).getDate();
    const endDate = `${anio}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('actividad')
      .select(
        'id, nombre, fecha, hora_inicio, hora_fin, lugar, tipo_actividad:tipo_actividad_id(id_tipo, nombre), grupo_organizador:grupo_id(id_grupo, nombre)',
      )
      .eq('es_publica', true)
      .eq('estado', 'programada')
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) throw error;
    return this.mapEventos(data);
  }

  /**
   * Obtiene todas las actividades programadas dentro de un mes/año (públicas y privadas)
   */
  async findConsolidadoAsync(mes: number, anio: number): Promise<CalendarioEvento[]> {
    const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const lastDay = new Date(anio, mes, 0).getDate();
    const endDate = `${anio}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('actividad')
      .select(
        'id, nombre, fecha, hora_inicio, hora_fin, lugar, tipo_actividad:tipo_actividad_id(id_tipo, nombre), grupo_organizador:grupo_id(id_grupo, nombre)',
      )
      .eq('estado', 'programada')
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) throw error;
    return this.mapEventos(data);
  }

  /**
   * Obtiene las responsabilidades futuras confirmadas de un miembro
   */
  async findResponsabilidadesAsync(miembroId: number): Promise<Responsabilidad[]> {
    const hoy = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('invitado')
      .select(
        'estado, fecha_invitacion, actividad:actividad_id(id, nombre, fecha, hora_inicio, hora_fin, lugar, estado), responsabilidad_asignada:responsabilidad_id(id_responsabilidad, nombre)',
      )
      .eq('miembro_id', miembroId)
      .eq('estado', 'confirmado');

    if (error) throw error;

    // Filtrar actividades programadas con fecha >= hoy (post-query por limitaciones de filtro en join)
    const resultado: Responsabilidad[] = [];
    for (const row of data || []) {
      const actividad = (row as any).actividad;
      const rol = (row as any).responsabilidad_asignada;

      if (!actividad || !rol) continue;
      if (actividad.estado !== 'programada') continue;
      if ((actividad.fecha as string) < hoy) continue;

      resultado.push({
        actividad: {
          id: actividad.id as number,
          nombre: actividad.nombre as string,
          fecha: actividad.fecha as string,
          hora_inicio: actividad.hora_inicio as string,
          hora_fin: actividad.hora_fin as string,
          lugar: (actividad.lugar as string) ?? null,
        },
        responsabilidad_asignada: {
          id: rol.id_responsabilidad as number,
          nombre: rol.nombre as string,
        },
        fecha_invitacion: row.fecha_invitacion as string,
        estado: row.estado as string,
      });
    }

    // Ordenar por fecha de actividad ASC
    resultado.sort((a, b) => a.actividad.fecha.localeCompare(b.actividad.fecha));

    return resultado;
  }

  /**
   * Mapea los datos crudos de Supabase al formato CalendarioEvento
   */
  private mapEventos(data: unknown[]): CalendarioEvento[] {
    return (data || []).map((row: unknown) => {
      const r = row as Record<string, unknown>;
      const tipo = r.tipo_actividad as Record<string, unknown> | null;
      const grupo = r.grupo_organizador as Record<string, unknown> | null;

      return {
        id: r.id as number,
        nombre: r.nombre as string,
        fecha: r.fecha as string,
        hora_inicio: r.hora_inicio as string,
        hora_fin: r.hora_fin as string,
        lugar: (r.lugar as string) ?? null,
        tipo_actividad: tipo
          ? { id: tipo.id_tipo as number, nombre: tipo.nombre as string }
          : { id: 0, nombre: 'Desconocido' },
        grupo_organizador: grupo
          ? { id: grupo.id_grupo as number, nombre: grupo.nombre as string }
          : null,
      };
    });
  }
}

