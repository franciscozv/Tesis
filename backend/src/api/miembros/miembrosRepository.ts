import type { EstadoComunion, Miembro } from '@/api/miembros/miembrosModel';
import { supabase } from '@/common/utils/supabaseClient';

/**
 * Repository para gestionar operaciones de base de datos de Miembros
 */
export class MiembrosRepository {
  /**
   * Obtiene todos los miembros activos (sin paginación)
   */
  async findAllAsync(): Promise<Miembro[]> {
    const { data, error } = await supabase
      .from('miembro')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Miembro[]) || [];
  }

  /**
   * Obtiene miembros activos con paginación, búsqueda y filtros
   */
  async findAllPaginatedAsync(params: {
    page: number;
    limit: number;
    search?: string;
    estado_comunion?: EstadoComunion;
  }): Promise<{ data: Miembro[]; total: number }> {
    const { page, limit, search, estado_comunion } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('miembro')
      .select('*', { count: 'exact' })
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,rut.ilike.%${search}%`);
    }

    if (estado_comunion) {
      query = query.eq('estado_comunion', estado_comunion);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: (data as Miembro[]) || [], total: count ?? 0 };
  }

  /**
   * Busca un miembro por ID (solo activos)
   */
  async findByIdAsync(id: number): Promise<Miembro | null> {
    const { data, error } = await supabase
      .from('miembro')
      .select('*')
      .eq('id', id)
      .eq('activo', true)
      .single();

    if (error) {
      // PGRST116 = No rows found
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Miembro;
  }

  /**
   * Crea un nuevo miembro
   */
  async createAsync(
    miembroData: Omit<Miembro, 'id' | 'created_at' | 'updated_at' | 'activo'>,
  ): Promise<Miembro> {
    const { data, error } = await supabase
      .from('miembro')
      .insert([{ ...miembroData, activo: true }])
      .select()
      .single();

    if (error) throw error;
    return data as Miembro;
  }

  /**
   * Actualiza un miembro existente (solo activos)
   */
  async updateAsync(id: number, miembroData: Partial<Miembro>): Promise<Miembro | null> {
    const { data, error } = await supabase
      .from('miembro')
      .update(miembroData)
      .eq('id', id)
      .eq('activo', true)
      .select()
      .single();

    if (error) {
      // PGRST116 = No rows found
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Miembro;
  }

  /**
   * Actualiza solo datos de contacto de un miembro (perfil propio)
   */
  async updatePerfilAsync(
    id: number,
    data: { direccion?: string | null; telefono?: string | null; email?: string | null },
  ): Promise<Miembro | null> {
    const { data: miembro, error } = await supabase
      .from('miembro')
      .update(data)
      .eq('id', id)
      .eq('activo', true)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return miembro as Miembro;
  }

  /**
   * Elimina lógicamente un miembro (soft delete)
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase.from('miembro').update({ activo: false }).eq('id', id);

    if (error) throw error;
    return true;
  }

  /**
   * Cambia el estado de membresía de un miembro (RF_05)
   */
  async changeEstadoComunionAsync(id: number, estado_comunion: string): Promise<Miembro | null> {
    const { data, error } = await supabase
      .from('miembro')
      .update({ estado_comunion })
      .eq('id', id)
      .eq('activo', true)
      .select()
      .single();

    if (error) {
      // PGRST116 = No rows found
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Miembro;
  }
}

export const miembrosRepository = new MiembrosRepository();
