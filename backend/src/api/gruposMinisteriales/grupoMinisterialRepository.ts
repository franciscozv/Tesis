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
      .from('grupo')
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
      .from('grupo')
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
      .from('grupo')
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
      .from('grupo')
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
    const { error } = await supabase.from('grupo').update({ activo: false }).eq('id_grupo', id);

    if (error) throw error;
    return true;
  }

  /**
   * Verifica si un grupo ministerial tiene miembros activos
   * (miembros con fecha_desvinculacion IS NULL en integrante_grupo)
   */
  async hasActiveMembersAsync(grupo_id: number): Promise<boolean> {
    const { count, error } = await supabase
      .from('integrante_grupo')
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
      .select('id, activo, estado_comunion')
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
      isPlenaComunion: data.estado_comunion === 'plena_comunion',
    };
  }

  /**
   * Verifica si un miembro tiene membresía activa en un grupo específico.
   */
  async isMemberOfGrupoAsync(miembro_id: number, grupo_id: number): Promise<boolean> {
    const { count, error } = await supabase
      .from('integrante_grupo')
      .select('*', { count: 'exact', head: true })
      .eq('miembro_id', miembro_id)
      .eq('grupo_id', grupo_id)
      .is('fecha_desvinculacion', null);

    if (error) throw error;
    return (count ?? 0) > 0;
  }

  /**
   * Obtiene todos los grupos donde el miembro tiene una membresía activa (cualquier rol),
   * incluyendo un flag `es_directiva_miembro` que indica si tiene rol directivo en ese grupo.
   */
  async findTodosGruposByMiembroAsync(
    miembro_id: number,
  ): Promise<(GrupoMinisterial & { es_directiva_miembro: boolean })[]> {
    const { data: memberships, error: memError } = await supabase
      .from('integrante_grupo')
      .select('grupo_id, rol_grupo!inner(es_directiva)')
      .eq('miembro_id', miembro_id)
      .is('fecha_desvinculacion', null);

    if (memError) throw memError;
    if (!memberships || memberships.length === 0) return [];

    // Un miembro puede aparecer con múltiples roles en el mismo grupo;
    // es directiva si ALGUNO de sus roles activos lo es.
    const directivaMap = new Map<number, boolean>();
    for (const m of memberships as unknown as { grupo_id: number; rol_grupo: { es_directiva: boolean } }[]) {
      const prev = directivaMap.get(m.grupo_id) ?? false;
      directivaMap.set(m.grupo_id, prev || m.rol_grupo.es_directiva);
    }

    const grupoIds = [...directivaMap.keys()];

    const { data, error } = await supabase
      .from('grupo')
      .select('*')
      .in('id_grupo', grupoIds)
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ((data as GrupoMinisterial[]) || []).map((g) => ({
      ...g,
      es_directiva_miembro: directivaMap.get(g.id_grupo) ?? false,
    }));
  }
}

export const grupoMinisterialRepository = new GrupoMinisterialRepository();
