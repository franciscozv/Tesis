import { supabase } from '@/common/utils/supabaseClient';
import type { RolGrupo } from './rolesGrupoModel';

/**
 * Repository para operaciones de Roles de Grupos Ministeriales
 */
export class RolesGrupoRepository {
  /**
   * Obtiene todos los roles activos
   */
  async findAllAsync(): Promise<RolGrupo[]> {
    const { data, error } = await supabase
      .from('rol_grupo_ministerial')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data as RolGrupo[];
  }

  /**
   * Obtiene un rol por ID
   */
  async findByIdAsync(id: number): Promise<RolGrupo | null> {
    const { data, error } = await supabase
      .from('rol_grupo_ministerial')
      .select('*')
      .eq('id_rol_grupo', id)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as RolGrupo;
  }

  /**
   * Verifica si un rol con el nombre ya existe (para validar unicidad)
   */
  async existeNombre(nombre: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('rol_grupo_ministerial')
      .select('id_rol_grupo')
      .eq('nombre', nombre)
      .eq('activo', true);

    if (excludeId) {
      query = query.neq('id_rol_grupo', excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  /**
   * Verifica si el rol está siendo usado en membresías activas
   */
  async estaEnUso(id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('membresia_grupo')
      .select('id_membresia')
      .eq('rol_grupo_id', id)
      .is('fecha_desvinculacion', null)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  /**
   * Crea un nuevo rol de grupo
   */
  async createAsync(nombre: string, requierePlenaComunion: boolean): Promise<RolGrupo> {
    const { data, error } = await supabase
      .from('rol_grupo_ministerial')
      .insert({
        nombre,
        requiere_plena_comunion: requierePlenaComunion,
        activo: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as RolGrupo;
  }

  /**
   * Actualiza un rol de grupo
   */
  async updateAsync(
    id: number,
    updates: { nombre?: string; requiere_plena_comunion?: boolean },
  ): Promise<RolGrupo | null> {
    const { data, error } = await supabase
      .from('rol_grupo_ministerial')
      .update(updates)
      .eq('id_rol_grupo', id)
      .eq('activo', true)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as RolGrupo;
  }

  /**
   * Elimina un rol (soft delete)
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('rol_grupo_ministerial')
      .update({ activo: false })
      .eq('id_rol_grupo', id)
      .eq('activo', true);

    if (error) throw error;
    return true;
  }
}
