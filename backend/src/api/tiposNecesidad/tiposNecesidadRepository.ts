import { supabase } from '@/common/utils/supabaseClient';
import type { TipoNecesidad } from './tiposNecesidadModel';

/**
 * Repositorio para operaciones de datos de Tipos de Necesidad Logística
 */
export class TiposNecesidadRepository {
  /**
   * Obtiene tipos de necesidad, opcionalmente filtrados por estado
   */
  async findAllAsync(activo?: boolean): Promise<TipoNecesidad[]> {
    let query = supabase.from('tipo_necesidad_logistica').select('*');

    if (activo !== undefined) {
      query = query.eq('activo', activo);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as TipoNecesidad[];
  }

  /**
   * Obtiene un tipo de necesidad por ID (sin filtrar por activo)
   */
  async findByIdAsync(id: number): Promise<TipoNecesidad | null> {
    const { data, error } = await supabase
      .from('tipo_necesidad_logistica')
      .select('*')
      .eq('id_tipo', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as TipoNecesidad;
  }

  /**
   * Verifica si un nombre de tipo ya existe
   */
  async existsByNombreAsync(nombre: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('tipo_necesidad_logistica')
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
   * Verifica si el tipo está siendo usado en necesidades logísticas
   */
  async isBeingUsedAsync(idTipo: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('necesidad_logistica')
      .select('id')
      .eq('tipo_necesidad_id', idTipo)
      .limit(1);

    if (error) throw error;
    return data.length > 0;
  }

  /**
   * Crea un nuevo tipo de necesidad
   */
  async createAsync(
    tipoData: Omit<TipoNecesidad, 'id_tipo' | 'created_at' | 'updated_at' | 'activo'>,
  ): Promise<TipoNecesidad> {
    const { data, error } = await supabase
      .from('tipo_necesidad_logistica')
      .insert({ ...tipoData, activo: true })
      .select()
      .single();

    if (error) throw error;
    return data as TipoNecesidad;
  }

  /**
   * Actualiza un tipo de necesidad existente
   */
  async updateAsync(id: number, tipoData: Partial<TipoNecesidad>): Promise<TipoNecesidad | null> {
    const { data, error } = await supabase
      .from('tipo_necesidad_logistica')
      .update(tipoData)
      .eq('id_tipo', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as TipoNecesidad;
  }

  /**
   * Cambia el estado activo/inactivo de un tipo de necesidad
   */
  async toggleEstadoAsync(id: number): Promise<TipoNecesidad | null> {
    // Obtener el registro sin filtrar por activo
    const { data: current, error: findError } = await supabase
      .from('tipo_necesidad_logistica')
      .select('*')
      .eq('id_tipo', id)
      .single();

    if (findError) {
      if (findError.code === 'PGRST116') return null;
      throw findError;
    }

    const { data, error } = await supabase
      .from('tipo_necesidad_logistica')
      .update({ activo: !current.activo })
      .eq('id_tipo', id)
      .select()
      .single();

    if (error) throw error;
    return data as TipoNecesidad;
  }

  /**
   * Elimina un tipo de necesidad permanentemente (hard delete)
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase.from('tipo_necesidad_logistica').delete().eq('id_tipo', id);

    if (error) throw error;
    return true;
  }
}
