import { supabase } from '@/common/utils/supabaseClient';
import type { RolGrupo } from '@/api/rolesGrupo/rolesGrupoModel';
import type { GrupoRol } from './grupoRolModel';

export class GrupoRolRepository {
  /**
   * Obtiene todos los roles habilitados para un grupo como objetos RolGrupo completos
   */
  async findRolesByGrupoAsync(grupoId: number): Promise<RolGrupo[]> {
    const { data, error } = await supabase
      .from('grupo_rol')
      .select(`
        rol_grupo!inner(
          id_rol_grupo,
          nombre,
          requiere_plena_comunion,
          es_unico,
          es_directiva,
          activo,
          created_at,
          updated_at
        )
      `)
      .eq('grupo_id', grupoId);

    if (error) throw error;

    return (data as any[]).map((row) => {
      const rol = Array.isArray(row.rol_grupo) ? row.rol_grupo[0] : row.rol_grupo;
      return rol as RolGrupo;
    });
  }

  /**
   * Verifica si un rol está habilitado para un grupo
   */
  async existeAsync(grupoId: number, rolId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('grupo_rol')
      .select('grupo_id')
      .eq('grupo_id', grupoId)
      .eq('rol_grupo_id', rolId)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  /**
   * Habilita un rol en un grupo
   */
  async habilitarAsync(grupoId: number, rolId: number): Promise<GrupoRol> {
    const { data, error } = await supabase
      .from('grupo_rol')
      .insert({ grupo_id: grupoId, rol_grupo_id: rolId })
      .select()
      .single();

    if (error) throw error;
    return data as GrupoRol;
  }

  /**
   * Deshabilita un rol en un grupo
   */
  async deshabilitarAsync(grupoId: number, rolId: number): Promise<boolean> {
    const { error } = await supabase
      .from('grupo_rol')
      .delete()
      .eq('grupo_id', grupoId)
      .eq('rol_grupo_id', rolId);

    if (error) throw error;
    return true;
  }

  /**
   * Verifica si el rol está siendo usado actualmente en el grupo
   */
  async estaEnUsoAsync(grupoId: number, rolId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('integrante_grupo')
      .select('id_integrante')
      .eq('grupo_id', grupoId)
      .eq('rol_grupo_id', rolId)
      .is('fecha_desvinculacion', null)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }
}
