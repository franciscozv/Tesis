import { supabase } from '@/common/utils/supabaseClient';
import type { Colaborador } from './colaboradoresModel';

/**
 * Filtros para listar colaboradores
 */
interface ColaboradorFilters {
  necesidad_id?: number;
  miembro_id?: number;
  estado?: string;
}

/**
 * Datos de necesidad logística relevantes para validaciones
 */
interface NecesidadInfo {
  id: number;
  cantidad_requerida: number;
  cantidad_cubierta: number;
  estado: string;
}

/**
 * Repositorio para operaciones de datos de Colaboradores
 */
export class ColaboradoresRepository {
  /**
   * Obtiene colaboradores con filtros opcionales
   */
  async findAllAsync(filters: ColaboradorFilters = {}): Promise<Colaborador[]> {
    let query = supabase
      .from('colaborador')
      .select('*')
      .order('fecha_oferta', { ascending: false });

    if (filters.necesidad_id) {
      query = query.eq('necesidad_id', filters.necesidad_id);
    }

    if (filters.miembro_id) {
      query = query.eq('miembro_id', filters.miembro_id);
    }

    if (filters.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Colaborador[];
  }

  /**
   * Obtiene un colaborador por ID
   */
  async findByIdAsync(id: number): Promise<Colaborador | null> {
    const { data, error } = await supabase
      .from('colaborador')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Colaborador;
  }

  /**
   * Verifica si una necesidad logística existe y retorna sus datos
   */
  async getNecesidadInfoAsync(necesidadId: number): Promise<NecesidadInfo | null> {
    const { data, error } = await supabase
      .from('necesidad_logistica')
      .select('id, cantidad_requerida, cantidad_cubierta, estado')
      .eq('id', necesidadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as NecesidadInfo;
  }

  /**
   * Verifica si un miembro existe y está activo
   */
  async miembroExistsAsync(miembroId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('miembro')
      .select('id')
      .eq('id', miembroId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Verifica si un miembro ya tiene una oferta pendiente para la misma necesidad
   */
  async existsOfertaPendienteAsync(necesidadId: number, miembroId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('colaborador')
      .select('id')
      .eq('necesidad_id', necesidadId)
      .eq('miembro_id', miembroId)
      .eq('estado', 'pendiente');

    if (error) throw error;
    return data !== null && data.length > 0;
  }

  /**
   * Crea un nuevo colaborador
   */
  async createAsync(
    colaboradorData: Omit<Colaborador, 'id' | 'fecha_oferta' | 'fecha_decision' | 'estado'>
  ): Promise<Colaborador> {
    const { data, error } = await supabase
      .from('colaborador')
      .insert({ ...colaboradorData, estado: 'pendiente' })
      .select()
      .single();

    if (error) throw error;
    return data as Colaborador;
  }

  /**
   * Actualiza el estado de un colaborador (aceptar/rechazar)
   */
  async updateDecisionAsync(
    id: number,
    estado: string
  ): Promise<Colaborador | null> {
    const { data, error } = await supabase
      .from('colaborador')
      .update({
        estado,
        fecha_decision: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Colaborador;
  }

  /**
   * Actualiza la cantidad_cubierta de una necesidad logística
   * y si queda completamente cubierta, cambia el estado a 'cubierta'
   */
  async updateCantidadCubiertaAsync(
    necesidadId: number,
    nuevaCantidadCubierta: number,
    cantidadRequerida: number
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      cantidad_cubierta: nuevaCantidadCubierta,
    };

    if (nuevaCantidadCubierta >= cantidadRequerida) {
      updateData.estado = 'cubierta';
    }

    const { error } = await supabase
      .from('necesidad_logistica')
      .update(updateData)
      .eq('id', necesidadId);

    if (error) throw error;
  }

  /**
   * Elimina un colaborador
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('colaborador')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}
