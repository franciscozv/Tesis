import { supabase } from '@/common/utils/supabaseClient';
import type { ResponsabilidadActividad } from './rolesActividadModel';

/**
 * Repositorio para operaciones de datos de Responsabilidades de Actividad
 */
export class ResponsabilidadesActividadRepository {
  /**
   * Obtiene responsabilidades de actividad, opcionalmente filtrados por estado
   */
  async findAllAsync(activo?: boolean): Promise<ResponsabilidadActividad[]> {
    let query = supabase.from('responsabilidad_actividad').select('*');

    if (activo !== undefined) {
      query = query.eq('activo', activo);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as ResponsabilidadActividad[];
  }

  /**
   * Obtiene un rol por ID
   */
  async findByIdAsync(id: number): Promise<ResponsabilidadActividad | null> {
    const { data, error } = await supabase
      .from('responsabilidad_actividad')
      .select('*')
      .eq('id_responsabilidad', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as ResponsabilidadActividad;
  }

  /**
   * Verifica si un nombre de rol ya existe
   */
  async existsByNombreAsync(nombre: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('responsabilidad_actividad')
      .select('id_responsabilidad')
      .eq('nombre', nombre)
      .eq('activo', true);

    if (excludeId) {
      query = query.neq('id_responsabilidad', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data !== null && data.length > 0;
  }

  /**
   * Crea un nuevo rol
   */
  async createAsync(
    rolData: Omit<
      ResponsabilidadActividad,
      'id_responsabilidad' | 'created_at' | 'updated_at' | 'activo'
    >,
  ): Promise<ResponsabilidadActividad> {
    const { data, error } = await supabase
      .from('responsabilidad_actividad')
      .insert({ ...rolData, activo: true })
      .select()
      .single();

    if (error) throw error;
    return data as ResponsabilidadActividad;
  }

  /**
   * Actualiza un rol existente
   */
  async updateAsync(
    id: number,
    rolData: Partial<ResponsabilidadActividad>,
  ): Promise<ResponsabilidadActividad | null> {
    const { data, error } = await supabase
      .from('responsabilidad_actividad')
      .update(rolData)
      .eq('id_responsabilidad', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as ResponsabilidadActividad;
  }

  /**
   * Verifica si el rol está siendo usado en invitado
   */
  async isRolInUseAsync(idRol: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('invitado') // ✅ tabla correcta
      .select('id') // o la PK real de invitado
      .eq('responsabilidad_id', idRol)
      .limit(1);

    if (error) throw error;
    return data !== null && data.length > 0;
  }

  /**
   * Cambia el estado activo/inactivo de un responsabilidad de actividad
   */
  async toggleEstadoAsync(id: number): Promise<ResponsabilidadActividad | null> {
    const { data: current, error: findError } = await supabase
      .from('responsabilidad_actividad')
      .select('*')
      .eq('id_responsabilidad', id)
      .single();

    if (findError) {
      if (findError.code === 'PGRST116') return null;
      throw findError;
    }

    const { data, error } = await supabase
      .from('responsabilidad_actividad')
      .update({ activo: !current.activo })
      .eq('id_responsabilidad', id)
      .select()
      .single();

    if (error) throw error;
    return data as ResponsabilidadActividad;
  }

  /**
   * Elimina un rol permanentemente (hard delete)
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('responsabilidad_actividad')
      .delete()
      .eq('id_responsabilidad', id);

    if (error) throw error;
    return true;
  }
}
