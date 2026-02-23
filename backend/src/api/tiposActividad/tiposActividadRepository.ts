import { supabase } from '@/common/utils/supabaseClient';
import type { TipoActividad } from './tiposActividadModel';

/**
 * Repositorio para operaciones de datos de Tipos de Actividad
 */
export class TiposActividadRepository {
  /**
   * Obtiene tipos de actividad, opcionalmente filtrados por estado
   */
  async findAllAsync(activo?: boolean): Promise<TipoActividad[]> {
    let query = supabase.from('tipo_actividad').select('*');

    if (activo !== undefined) {
      query = query.eq('activo', activo);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as TipoActividad[];
  }

  /**
   * Obtiene un tipo de actividad por ID
   */
  async findByIdAsync(id: number): Promise<TipoActividad | null> {
    const { data, error } = await supabase
      .from('tipo_actividad')
      .select('*')
      .eq('id_tipo', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as TipoActividad;
  }

  /**
   * Verifica si un nombre de tipo ya existe
   */
  async existsByNombreAsync(nombre: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('tipo_actividad')
      .select('id_tipo')
      .eq('nombre', nombre)
      .eq('activo', true);

    if (excludeId) {
      query = query.neq('id_tipo', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data !== null && data.length > 0;
  }

  /**
   * Verifica si el tipo está siendo usado en actividades activas
   */
  async isBeingUsedAsync(idTipo: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('actividad')
      .select('id')
      .eq('tipo_actividad_id', idTipo)
      .limit(1);

    if (error) throw error;
    return data !== null && data.length > 0;
  }

  /**
   * Crea un nuevo tipo de actividad
   */
  async createAsync(
    tipoData: Omit<TipoActividad, 'id_tipo' | 'created_at' | 'updated_at' | 'activo'>,
  ): Promise<TipoActividad> {
    const { data, error } = await supabase
      .from('tipo_actividad')
      .insert({ ...tipoData, activo: true })
      .select()
      .single();

    if (error) throw error;
    return data as TipoActividad;
  }

  /**
   * Actualiza un tipo de actividad existente
   */
  async updateAsync(id: number, tipoData: Partial<TipoActividad>): Promise<TipoActividad | null> {
    const { data, error } = await supabase
      .from('tipo_actividad')
      .update(tipoData)
      .eq('id_tipo', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as TipoActividad;
  }

  /**
   * Cambia el estado activo/inactivo de un tipo de actividad
   */
  async toggleEstadoAsync(id: number): Promise<TipoActividad | null> {
    const { data: current, error: findError } = await supabase
      .from('tipo_actividad')
      .select('*')
      .eq('id_tipo', id)
      .single();

    if (findError) {
      if (findError.code === 'PGRST116') return null;
      throw findError;
    }

    const { data, error } = await supabase
      .from('tipo_actividad')
      .update({ activo: !current.activo })
      .eq('id_tipo', id)
      .select()
      .single();

    if (error) throw error;
    return data as TipoActividad;
  }

  /**
   * Elimina un tipo de actividad permanentemente (hard delete)
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase.from('tipo_actividad').delete().eq('id_tipo', id);

    if (error) throw error;
    return true;
  }
}
