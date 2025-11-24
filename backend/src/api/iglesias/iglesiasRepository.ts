import { supabase } from '@/common/utils/supabaseClient';
import type { Iglesia, IglesiaConPadre } from './iglesiasModel';

export class IglesiasRepository {
  /**
   * Obtiene todas las iglesias activas
   */
  async findAllAsync(): Promise<Iglesia[]> {
    const { data, error } = await supabase
      .from('iglesia')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Iglesia[];
  }

  /**
   * Obtiene solo los templos centrales (iglesia_padre_id IS NULL)
   */
  async findTemplosAsync(): Promise<Iglesia[]> {
    const { data, error } = await supabase
      .from('iglesia')
      .select('*')
      .is('iglesia_padre_id', null)
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Iglesia[];
  }

  /**
   * Obtiene los locales de un templo específico
   */
  async findLocalesByTemploAsync(iglesia_id: number): Promise<Iglesia[]> {
    const { data, error } = await supabase
      .from('iglesia')
      .select('*')
      .eq('iglesia_padre_id', iglesia_id)
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Iglesia[];
  }

  /**
   * Obtiene una iglesia por ID (solo si está activa)
   * Incluye información del templo padre si aplica
   */
  async findByIdAsync(id: number): Promise<IglesiaConPadre | null> {
    const { data, error } = await supabase
      .from('iglesia')
      .select(
        `
        *,
        templo_padre:iglesia_padre_id (
          id_iglesia,
          nombre
        )
      `
      )
      .eq('id_iglesia', id)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as IglesiaConPadre;
  }

  /**
   * Crea una nueva iglesia
   */
  async createAsync(
    iglesiaData: Omit<Iglesia, 'id_iglesia' | 'created_at' | 'updated_at' | 'activo'>
  ): Promise<Iglesia> {
    const { data, error } = await supabase
      .from('iglesia')
      .insert({ ...iglesiaData, activo: true })
      .select()
      .single();

    if (error) throw error;
    return data as Iglesia;
  }

  /**
   * Actualiza una iglesia existente
   */
  async updateAsync(id: number, iglesiaData: Partial<Iglesia>): Promise<Iglesia | null> {
    const { data, error } = await supabase
      .from('iglesia')
      .update(iglesiaData)
      .eq('id_iglesia', id)
      .eq('activo', true)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Iglesia;
  }

  /**
   * Soft delete: marca la iglesia como inactiva
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase.from('iglesia').update({ activo: false }).eq('id_iglesia', id);

    if (error) throw error;
    return true;
  }

  /**
   * Verifica si una iglesia existe y está activa
   */
  async existsAndActiveAsync(id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('iglesia')
      .select('id_iglesia')
      .eq('id_iglesia', id)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return !!data;
  }

  /**
   * Verifica si la iglesia tiene locales activos
   */
  async hasActiveLocalesAsync(id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('iglesia')
      .select('id_iglesia')
      .eq('iglesia_padre_id', id)
      .eq('activo', true)
      .limit(1);

    if (error) throw error;
    return (data?.length ?? 0) > 0;
  }

  /**
   * Verifica si la iglesia está siendo usada en eventos activos
   */
  async hasActiveEventosAsync(id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('evento')
      .select('id_evento')
      .eq('iglesia_id', id)
      .eq('activo', true)
      .limit(1);

    if (error) throw error;
    return (data?.length ?? 0) > 0;
  }
}
