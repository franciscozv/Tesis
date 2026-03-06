import { supabase } from '@/common/utils/supabaseClient';
import type { PatronActividad } from './patronesActividadModel';

/**
 * Repositorio para operaciones de datos de Patrones de Actividad
 */
export class PatronesActividadRepository {
  /**
   * Obtiene todos los patrones de actividad activos
   */
  async findAllAsync(): Promise<PatronActividad[]> {
    const { data, error } = await supabase
      .from('patron_actividad')
      .select('*')
      .eq('activo', true)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data as PatronActividad[];
  }

  /**
   * Obtiene un patrón de actividad por ID
   */
  async findByIdAsync(id: number): Promise<PatronActividad | null> {
    const { data, error } = await supabase
      .from('patron_actividad')
      .select('*')
      .eq('id', id)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as PatronActividad;
  }

  /**
   * Obtiene un patrón por ID sin filtrar por activo (para PATCH estado)
   */
  async findByIdIncludingInactiveAsync(id: number): Promise<PatronActividad | null> {
    const { data, error } = await supabase
      .from('patron_actividad')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as PatronActividad;
  }

  /**
   * Verifica si un nombre de patrón ya existe
   */
  async existsByNombreAsync(nombre: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('patron_actividad')
      .select('id')
      .eq('nombre', nombre)
      .eq('activo', true);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data !== null && data.length > 0;
  }

  /**
   * Verifica si un tipo de actividad existe y está activo
   */
  async tipoActividadExistsAsync(tipoActividadId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('tipo_actividad')
      .select('id_tipo')
      .eq('id_tipo', tipoActividadId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Verifica si un grupo ministerial existe y está activo
   */
  async grupoExistsAsync(grupoId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('grupo')
      .select('id_grupo')
      .eq('id_grupo', grupoId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Crea un nuevo patrón de actividad
   */
  async createAsync(
    patronData: Omit<PatronActividad, 'id' | 'fecha_creacion' | 'activo'>,
  ): Promise<PatronActividad> {
    const { data, error } = await supabase
      .from('patron_actividad')
      .insert({ ...patronData, activo: true })
      .select()
      .single();

    if (error) throw error;
    return data as PatronActividad;
  }

  /**
   * Actualiza un patrón de actividad existente
   */
  async updateAsync(
    id: number,
    patronData: Partial<PatronActividad>,
  ): Promise<PatronActividad | null> {
    const { data, error } = await supabase
      .from('patron_actividad')
      .update(patronData)
      .eq('id', id)
      .eq('activo', true)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as PatronActividad;
  }

  /**
   * Cambia el estado activo/inactivo de un patrón
   */
  async updateEstadoAsync(id: number, activo: boolean): Promise<PatronActividad | null> {
    const { data, error } = await supabase
      .from('patron_actividad')
      .update({ activo })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as PatronActividad;
  }
}
