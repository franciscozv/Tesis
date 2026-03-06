import { hoyCL } from '@/common/utils/dateTime';
import { isEncargadoDeGrupo } from '@/common/utils/grupoPermissions';
import { supabase } from '@/common/utils/supabaseClient';
import type { Actividad } from './actividadesModel';

/**
 * Filtros para listar actividades
 */
interface ActividadFilters {
  mes?: number;
  anio?: number;
  estado?: string;
  es_publica?: boolean;
}

/**
 * Repositorio para operaciones de datos de Actividades
 */
export class ActividadesRepository {
  /**
   * Obtiene actividades con filtros opcionales
   */
  async findAllAsync(filters: ActividadFilters = {}): Promise<Actividad[]> {
    let query = supabase
      .from('actividad')
      .select('*, tipo_actividad(nombre, color)')
      .order('fecha', { ascending: false });

    if (filters.estado) {
      query = query.eq('estado', filters.estado);
    }

    if (filters.es_publica !== undefined) {
      query = query.eq('es_publica', filters.es_publica);
    }

    if (filters.anio && filters.mes) {
      const startDate = `${filters.anio}-${String(filters.mes).padStart(2, '0')}-01`;
      const lastDay = new Date(filters.anio, filters.mes, 0).getDate();
      const endDate = `${filters.anio}-${String(filters.mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      query = query.gte('fecha', startDate).lte('fecha', endDate);
    } else if (filters.anio) {
      query = query.gte('fecha', `${filters.anio}-01-01`).lte('fecha', `${filters.anio}-12-31`);
    } else if (filters.mes) {
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-${String(filters.mes).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, filters.mes, 0).getDate();
      const endDate = `${currentYear}-${String(filters.mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      query = query.gte('fecha', startDate).lte('fecha', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Actividad[];
  }

  /**
   * Obtiene id, fecha y hora_fin de todas las actividades en estado 'programada'
   */
  async findProgramadasAsync(): Promise<Pick<Actividad, 'id' | 'fecha' | 'hora_fin'>[]> {
    const { data, error } = await supabase
      .from('actividad')
      .select('id, fecha, hora_fin')
      .eq('estado', 'programada');

    if (error) throw error;
    return data as Pick<Actividad, 'id' | 'fecha' | 'hora_fin'>[];
  }

  /**
   * Actualiza en bloque el estado a 'realizada' para los IDs indicados
   */
  async markManyAsRealizadaAsync(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await supabase
      .from('actividad')
      .update({ estado: 'realizada' })
      .in('id', ids);

    if (error) throw error;
  }

  /**
   * Obtiene solo actividades públicas
   */
  async findPublicasAsync(): Promise<Actividad[]> {
    const { data, error } = await supabase
      .from('actividad')
      .select('*, tipo_actividad(nombre, color)')
      .eq('es_publica', true)
      .eq('estado', 'programada')
      .gte('fecha', hoyCL())
      .order('fecha', { ascending: true });

    if (error) throw error;
    return data as Actividad[];
  }

  /**
   * Obtiene una actividad por ID
   */
  async findByIdAsync(id: number): Promise<Actividad | null> {
    const { data, error } = await supabase
      .from('actividad')
      .select('*, tipo_actividad(nombre, color)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Actividad;
  }

  /**
   * Verifica si un tipo de actividad existe y está activo
   */
  async tipoActividadExistsAsync(tipoActividadId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('tipo_actividad')
      .select('id_tipo')
      .eq('id_tipo', tipoActividadId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Verifica si un patrón de actividad existe y está activo
   */
  async patronExistsAsync(patronId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('patron_actividad')
      .select('id')
      .eq('id', patronId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Verifica si un grupo ministerial existe y está activo
   */
  async grupoExistsAsync(grupoId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('grupo')
      .select('id_grupo')
      .eq('id_grupo', grupoId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Verifica si un miembro es encargado vigente de un grupo
   * (integrante_grupo con rol ROL_ENCARGADO_ID y fecha_desvinculacion IS NULL).
   */
  async isEncargadoDeGrupoAsync(grupoId: number, miembroId: number): Promise<boolean> {
    return isEncargadoDeGrupo(miembroId, grupoId);
  }

  /**
   * Verifica si un usuario existe y está activo
   */
  async creadorExistsAsync(creadorId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('usuario')
      .select('id')
      .eq('id', creadorId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Crea una nueva actividad
   */
  async createAsync(
    actividadData: Omit<Actividad, 'id' | 'fecha_creacion' | 'estado' | 'motivo_cancelacion'>,
  ): Promise<Actividad> {
    const { data, error } = await supabase
      .from('actividad')
      .insert({ ...actividadData, estado: 'programada' })
      .select()
      .single();

    if (error) throw error;
    return data as Actividad;
  }

  /**
   * Crea múltiples actividades en una sola operación (bulk insert)
   */
  async createManyAsync(
    actividadesData: Omit<Actividad, 'id' | 'fecha_creacion' | 'estado' | 'motivo_cancelacion'>[],
  ): Promise<Actividad[]> {
    const inserts = actividadesData.map((a) => ({ ...a, estado: 'programada' as const }));

    const { data, error } = await supabase.from('actividad').insert(inserts).select();

    if (error) throw error;
    return data as Actividad[];
  }

  /**
   * Actualiza una actividad existente
   */
  async updateAsync(id: number, actividadData: Partial<Actividad>): Promise<Actividad | null> {
    const { data, error } = await supabase
      .from('actividad')
      .update(actividadData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Actividad;
  }

  /**
   * Cambia el estado de una actividad
   */
  async updateEstadoAsync(
    id: number,
    estado: string,
    motivo_cancelacion?: string,
  ): Promise<Actividad | null> {
    const updateData: Partial<Actividad> = { estado: estado as Actividad['estado'] };

    if (estado === 'cancelada' && motivo_cancelacion) {
      updateData.motivo_cancelacion = motivo_cancelacion;
    }

    // Limpiar motivo si se cambia a un estado diferente de cancelada
    if (estado !== 'cancelada') {
      updateData.motivo_cancelacion = null;
    }

    const { data, error } = await supabase
      .from('actividad')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Actividad;
  }
}
