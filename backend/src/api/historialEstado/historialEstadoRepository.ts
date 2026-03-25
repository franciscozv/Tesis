import { supabase } from '@/common/utils/supabaseClient';
import type { HistorialEstado, HistorialEstadoConUsuario } from './historialEstadoModel';

/**
 * Filtros para listar historial
 */
interface HistorialEstadoFilters {
  miembro_id?: number;
}

/**
 * Repositorio para operaciones de datos del Historial de Estado de Membresía
 */
export class HistorialEstadoRepository {
  /**
   * Obtiene registros de historial con filtros opcionales
   */
  async findAllAsync(filters: HistorialEstadoFilters = {}): Promise<HistorialEstado[]> {
    let query = supabase
      .from('historial_estado')
      .select('*')
      .order('fecha_cambio', { ascending: false });

    if (filters.miembro_id) {
      query = query.eq('miembro_id', filters.miembro_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as HistorialEstado[];
  }

  /**
   * Obtiene registros de historial por miembro_id con datos del usuario que hizo el cambio
   */
  async findByMiembroAsync(miembroId: number): Promise<HistorialEstadoConUsuario[]> {
    const { data, error } = await supabase
      .from('historial_estado')
      .select(
        'id, miembro_id, estado_anterior, estado_nuevo, motivo, fecha_cambio, usuario:usuario_id(id, email)',
      )
      .eq('miembro_id', miembroId)
      .order('fecha_cambio', { ascending: false });

    if (error) throw error;
    return data as unknown as HistorialEstadoConUsuario[];
  }

  /**
   * Obtiene un registro de historial por ID
   */
  async findByIdAsync(id: number): Promise<HistorialEstado | null> {
    const { data, error } = await supabase
      .from('historial_estado')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as HistorialEstado;
  }

  /**
   * Verifica si un miembro existe, está activo, y retorna su estado actual
   */
  async getMiembroInfoAsync(
    miembroId: number,
  ): Promise<{ exists: boolean; estado_comunion: string | null }> {
    const { data, error } = await supabase
      .from('miembro')
      .select('id, estado_comunion')
      .eq('id', miembroId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return { exists: false, estado_comunion: null };
      throw error;
    }
    return { exists: true, estado_comunion: data.estado_comunion };
  }

  /**
   * Verifica si un usuario existe y está activo
   */
  async usuarioExistsAsync(usuarioId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('miembro')
      .select('id')
      .eq('id', usuarioId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Crea un nuevo registro de historial
   */
  async createAsync(
    historialData: Omit<HistorialEstado, 'id' | 'fecha_cambio'>,
  ): Promise<HistorialEstado> {
    const { data, error } = await supabase
      .from('historial_estado')
      .insert(historialData)
      .select()
      .single();

    if (error) throw error;
    return data as HistorialEstado;
  }

  /**
   * Actualiza el estado_comunion en la tabla miembro
   */
  async updateEstadoMiembroAsync(miembroId: number, nuevoEstado: string): Promise<void> {
    const { error } = await supabase
      .from('miembro')
      .update({ estado_comunion: nuevoEstado })
      .eq('id', miembroId);

    if (error) throw error;
  }
}
