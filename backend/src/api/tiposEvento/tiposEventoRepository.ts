import { supabase } from '@/common/utils/supabaseClient';
import type { TipoEvento } from './tiposEventoModel';

export class TiposEventoRepository {
  /**
   * Obtiene todos los tipos de evento activos
   */
  async findAllAsync(): Promise<TipoEvento[]> {
    const { data, error } = await supabase
      .from('tipo_evento')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TipoEvento[];
  }

  /**
   * Obtiene un tipo de evento por ID (solo si está activo)
   */
  async findByIdAsync(id: number): Promise<TipoEvento | null> {
    const { data, error } = await supabase
      .from('tipo_evento')
      .select('*')
      .eq('id_tipo_evento', id)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as TipoEvento;
  }

  /**
   * Crea un nuevo tipo de evento
   */
  async createAsync(
    tipoEventoData: Omit<TipoEvento, 'id_tipo_evento' | 'created_at' | 'updated_at' | 'activo'>
  ): Promise<TipoEvento> {
    const { data, error } = await supabase
      .from('tipo_evento')
      .insert({ ...tipoEventoData, activo: true })
      .select()
      .single();

    if (error) throw error;
    return data as TipoEvento;
  }

  /**
   * Actualiza un tipo de evento existente
   */
  async updateAsync(id: number, tipoEventoData: Partial<TipoEvento>): Promise<TipoEvento | null> {
    const { data, error } = await supabase
      .from('tipo_evento')
      .update(tipoEventoData)
      .eq('id_tipo_evento', id)
      .eq('activo', true)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as TipoEvento;
  }

  /**
   * Soft delete: marca el tipo de evento como inactivo
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('tipo_evento')
      .update({ activo: false })
      .eq('id_tipo_evento', id);

    if (error) throw error;
    return true;
  }

  /**
   * Verifica si el tipo de evento está siendo usado en eventos activos
   */
  async checkIfUsedInActiveEvents(id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('evento')
      .select('id_evento')
      .eq('tipo_evento_id', id)
      .eq('activo', true)
      .limit(1);

    if (error) throw error;
    return (data?.length ?? 0) > 0;
  }
}
