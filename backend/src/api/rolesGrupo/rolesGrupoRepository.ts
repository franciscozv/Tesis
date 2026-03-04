import { supabase } from '@/common/utils/supabaseClient';
import type { RolGrupo } from './rolesGrupoModel';

/**
 * Repository para operaciones de Roles de Grupos Ministeriales
 */
export class RolesGrupoRepository {
  /**
   * Obtiene roles de grupo, opcionalmente filtrados por estado
   */
  async findAllAsync(activo?: boolean): Promise<RolGrupo[]> {
    let query = supabase.from('rol_grupo_ministerial').select('*');

    if (activo !== undefined) {
      query = query.eq('activo', activo);
    }

    const { data, error } = await query.order('nombre', { ascending: true });

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
      .from('integrante_cuerpo')
      .select('id_integrante')
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
  async createAsync(
    nombre: string,
    requierePlenaComunion: boolean,
    esUnico = false,
    esDirectiva = false,
  ): Promise<RolGrupo> {
    const { data, error } = await supabase
      .from('rol_grupo_ministerial')
      .insert({
        nombre,
        requiere_plena_comunion: requierePlenaComunion,
        es_unico: esUnico,
        es_directiva: esDirectiva,
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
    updates: {
      nombre?: string;
      requiere_plena_comunion?: boolean;
      es_unico?: boolean;
      es_directiva?: boolean;
    },
  ): Promise<RolGrupo | null> {
    const { data, error } = await supabase
      .from('rol_grupo_ministerial')
      .update(updates)
      .eq('id_rol_grupo', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as RolGrupo;
  }

  /**
   * Cambia el estado activo/inactivo de un rol de grupo
   */
  async toggleEstadoAsync(id: number): Promise<RolGrupo | null> {
    const { data: current, error: findError } = await supabase
      .from('rol_grupo_ministerial')
      .select('*')
      .eq('id_rol_grupo', id)
      .single();

    if (findError) {
      if (findError.code === 'PGRST116') return null;
      throw findError;
    }

    const { data, error } = await supabase
      .from('rol_grupo_ministerial')
      .update({ activo: !current.activo })
      .eq('id_rol_grupo', id)
      .select()
      .single();

    if (error) throw error;
    return data as RolGrupo;
  }

  /**
   * Elimina un rol permanentemente (hard delete)
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase.from('rol_grupo_ministerial').delete().eq('id_rol_grupo', id);

    if (error) throw error;
    return true;
  }
}
