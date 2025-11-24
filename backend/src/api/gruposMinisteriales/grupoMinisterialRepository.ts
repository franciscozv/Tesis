import type { GrupoMinisterial } from '@/api/gruposMinisteriales/grupoMinisterialModel';
import { supabase } from '@/common/utils/supabaseClient';

/**
 * Repository para gestionar operaciones de base de datos de Grupos Ministeriales
 */
export class GrupoMinisterialRepository {
  /**
   * Obtiene todos los grupos ministeriales activos
   */
  async findAllAsync(): Promise<GrupoMinisterial[]> {
    const { data, error } = await supabase
      .from('grupo_ministerial')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as GrupoMinisterial[]) || [];
  }

  /**
   * Busca un grupo ministerial por ID (solo activos)
   */
  async findByIdAsync(id: number): Promise<GrupoMinisterial | null> {
    const { data, error } = await supabase
      .from('grupo_ministerial')
      .select('*')
      .eq('id_grupo', id)
      .eq('activo', true)
      .single();

    if (error) {
      // PGRST116 = No rows found
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as GrupoMinisterial;
  }

  /**
   * Crea un nuevo grupo ministerial
   */
  async createAsync(
    grupoData: Omit<GrupoMinisterial, 'id_grupo' | 'created_at' | 'updated_at' | 'activo'>,
  ): Promise<GrupoMinisterial> {
    const { data, error } = await supabase
      .from('grupo_ministerial')
      .insert([{ ...grupoData, activo: true }])
      .select()
      .single();

    if (error) throw error;
    return data as GrupoMinisterial;
  }

  /**
   * Actualiza un grupo ministerial existente (solo activos)
   */
  async updateAsync(
    id: number,
    grupoData: Partial<GrupoMinisterial>,
  ): Promise<GrupoMinisterial | null> {
    const { data, error } = await supabase
      .from('grupo_ministerial')
      .update(grupoData)
      .eq('id_grupo', id)
      .eq('activo', true)
      .select()
      .single();

    if (error) {
      // PGRST116 = No rows found
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as GrupoMinisterial;
  }

  /**
   * Elimina lógicamente un grupo ministerial (soft delete)
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('grupo_ministerial')
      .update({ activo: false })
      .eq('id_grupo', id);

    if (error) throw error;
    return true;
  }

  /**
   * Verifica si un grupo ministerial tiene miembros activos
   * (miembros con fecha_desvinculacion IS NULL en membresia_grupo)
   */
  async hasActiveMembersAsync(grupo_id: number): Promise<boolean> {
    const { count, error } = await supabase
      .from('membresia_grupo')
      .select('*', { count: 'exact', head: true })
      .eq('grupo_id', grupo_id)
      .is('fecha_desvinculacion', null);

    if (error) throw error;

    // Si count es mayor a 0, tiene miembros activos
    return (count ?? 0) > 0;
  }

  /**
   * Verifica que un miembro exista, esté activo y en estado plena_comunion
   * (para validación de líder principal)
   */
  async validateLiderAsync(miembro_id: number): Promise<{
    exists: boolean;
    isActive: boolean;
    isPlenaComunion: boolean;
  }> {
    const { data, error } = await supabase
      .from('miembro')
      .select('id, activo, estado_membresia')
      .eq('id', miembro_id)
      .single();

    if (error) {
      // PGRST116 = No rows found
      if (error.code === 'PGRST116') {
        return { exists: false, isActive: false, isPlenaComunion: false };
      }
      throw error;
    }

    return {
      exists: true,
      isActive: data.activo === true,
      isPlenaComunion: data.estado_membresia === 'plena_comunion',
    };
  }
}

export const grupoMinisterialRepository = new GrupoMinisterialRepository();
