import { supabase } from '@/common/utils/supabaseClient';
import type { RolActividad } from './rolesActividadModel';

/**
 * Repositorio para operaciones de datos de Roles de Actividad
 */
export class RolesActividadRepository {
  /**
   * Obtiene roles de actividad, opcionalmente filtrados por estado
   */
  async findAllAsync(activo?: boolean): Promise<RolActividad[]> {
    let query = supabase
      .from('rol_actividad')
      .select('*');

    if (activo !== undefined) {
      query = query.eq('activo', activo);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as RolActividad[];
  }

  /**
   * Obtiene un rol por ID
   */
  async findByIdAsync(id: number): Promise<RolActividad | null> {
    const { data, error } = await supabase
      .from('rol_actividad')
      .select('*')
      .eq('id_rol', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as RolActividad;
  }

  /**
   * Verifica si un nombre de rol ya existe
   */
  async existsByNombreAsync(nombre: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('rol_actividad')
      .select('id_rol')
      .eq('nombre', nombre)
      .eq('activo', true);

    if (excludeId) {
      query = query.neq('id_rol', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data !== null && data.length > 0;
  }

  /**
   * Crea un nuevo rol
   */
  async createAsync(
    rolData: Omit<RolActividad, 'id_rol' | 'created_at' | 'updated_at' | 'activo'>,
  ): Promise<RolActividad> {
    const { data, error } = await supabase
      .from('rol_actividad')
      .insert({ ...rolData, activo: true })
      .select()
      .single();

    if (error) throw error;
    return data as RolActividad;
  }

  /**
   * Actualiza un rol existente
   */
  async updateAsync(id: number, rolData: Partial<RolActividad>): Promise<RolActividad | null> {
    const { data, error } = await supabase
      .from('rol_actividad')
      .update(rolData)
      .eq('id_rol', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as RolActividad;
  }

  /**
   * Verifica si el rol está siendo usado en invitado
   */
  async isRolInUseAsync(idRol: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('invitado') // ✅ tabla correcta
      .select('id') // o la PK real de invitado
      .eq('rol_id', idRol)
      .limit(1);

    if (error) throw error;
    return data !== null && data.length > 0;
  }

  /**
   * Cambia el estado activo/inactivo de un rol de actividad
   */
  async toggleEstadoAsync(id: number): Promise<RolActividad | null> {
    const { data: current, error: findError } = await supabase
      .from('rol_actividad')
      .select('*')
      .eq('id_rol', id)
      .single();

    if (findError) {
      if (findError.code === 'PGRST116') return null;
      throw findError;
    }

    const { data, error } = await supabase
      .from('rol_actividad')
      .update({ activo: !current.activo })
      .eq('id_rol', id)
      .select()
      .single();

    if (error) throw error;
    return data as RolActividad;
  }

  /**
   * Elimina un rol permanentemente (hard delete)
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('rol_actividad')
      .delete()
      .eq('id_rol', id);

    if (error) throw error;
    return true;
  }
}
