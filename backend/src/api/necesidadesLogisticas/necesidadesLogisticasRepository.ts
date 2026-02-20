import { supabase } from '@/common/utils/supabaseClient';
import type { NecesidadLogistica } from './necesidadesLogisticasModel';

/**
 * Filtros para listar necesidades logísticas
 */
interface NecesidadFilters {
  estado?: string;
  actividad_id?: number;
}

/**
 * Repositorio para operaciones de datos de Necesidades Logísticas
 */
export class NecesidadesLogisticasRepository {
  /**
   * Obtiene necesidades logísticas con filtros opcionales
   */
  async findAllAsync(filters: NecesidadFilters = {}): Promise<NecesidadLogistica[]> {
    let query = supabase
      .from('necesidad_logistica')
      .select('*')
      .order('fecha_registro', { ascending: false });

    if (filters.estado) {
      query = query.eq('estado', filters.estado);
    }

    if (filters.actividad_id) {
      query = query.eq('actividad_id', filters.actividad_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as NecesidadLogistica[];
  }

  /**
   * Obtiene necesidades abiertas de actividades en los próximos 60 días
   */
  async findAbiertasProximasAsync(): Promise<NecesidadLogistica[]> {
    const hoy = new Date().toISOString().split('T')[0];
    const en60Dias = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Obtener IDs de actividades programadas en los próximos 60 días
    const { data: actividades, error: actError } = await supabase
      .from('actividad')
      .select('id')
      .eq('estado', 'programada')
      .gte('fecha', hoy)
      .lte('fecha', en60Dias);

    if (actError) throw actError;
    if (!actividades || actividades.length === 0) return [];

    const actividadIds = actividades.map((a) => a.id);

    const { data, error } = await supabase
      .from('necesidad_logistica')
      .select('*')
      .eq('estado', 'abierta')
      .in('actividad_id', actividadIds)
      .order('fecha_registro', { ascending: false });

    if (error) throw error;
    return data as NecesidadLogistica[];
  }

  /**
   * Obtiene una necesidad logística por ID
   */
  async findByIdAsync(id: number): Promise<NecesidadLogistica | null> {
    const { data, error } = await supabase
      .from('necesidad_logistica')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as NecesidadLogistica;
  }

  /**
   * Verifica si una actividad existe
   */
  async actividadExistsAsync(actividadId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('actividad')
      .select('id')
      .eq('id', actividadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Verifica si un tipo de necesidad existe y está activo
   */
  async tipoNecesidadExistsAsync(tipoNecesidadId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('tipo_necesidad_logistica')
      .select('id_tipo')
      .eq('id_tipo', tipoNecesidadId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Crea una nueva necesidad logística
   */
  async createAsync(
    necesidadData: Omit<NecesidadLogistica, 'id' | 'fecha_registro' | 'estado'>
  ): Promise<NecesidadLogistica> {
    const { data, error } = await supabase
      .from('necesidad_logistica')
      .insert({ ...necesidadData, estado: 'abierta' })
      .select()
      .single();

    if (error) throw error;
    return data as NecesidadLogistica;
  }

  /**
   * Actualiza una necesidad logística existente
   */
  async updateAsync(
    id: number,
    necesidadData: Partial<NecesidadLogistica>
  ): Promise<NecesidadLogistica | null> {
    const { data, error } = await supabase
      .from('necesidad_logistica')
      .update(necesidadData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as NecesidadLogistica;
  }

  /**
   * Cambia el estado de una necesidad logística
   */
  async updateEstadoAsync(
    id: number,
    estado: string
  ): Promise<NecesidadLogistica | null> {
    const { data, error } = await supabase
      .from('necesidad_logistica')
      .update({ estado })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as NecesidadLogistica;
  }

  /**
   * Elimina una necesidad logística
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('necesidad_logistica')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}
