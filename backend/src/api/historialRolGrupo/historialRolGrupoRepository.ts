import { supabase } from '@/common/utils/supabaseClient';
import type { HistorialRolGrupo } from './historialRolGrupoModel';

/**
 * Filtros para listar historial
 */
interface HistorialFilters {
  miembro_grupo_id?: number;
}

/**
 * Repositorio para operaciones de datos del Historial de Rol en Grupo
 */
export class HistorialRolGrupoRepository {
  /**
   * Obtiene registros de historial con filtros opcionales
   */
  async findAllAsync(filters: HistorialFilters = {}): Promise<HistorialRolGrupo[]> {
    let query = supabase
      .from('historial_rol_grupo')
      .select('*')
      .order('fecha_cambio', { ascending: false });

    if (filters.miembro_grupo_id) {
      query = query.eq('miembro_grupo_id', filters.miembro_grupo_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as HistorialRolGrupo[];
  }

  /**
   * Obtiene un registro de historial por ID
   */
  async findByIdAsync(id: number): Promise<HistorialRolGrupo | null> {
    const { data, error } = await supabase
      .from('historial_rol_grupo')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as HistorialRolGrupo;
  }

  /**
   * Verifica si una membresía de grupo existe y está activa (sin fecha_desvinculacion)
   */
  async miembroGrupoExistsAsync(
    miembroGrupoId: number
  ): Promise<{ exists: boolean; rol_grupo_id: number | null }> {
    const { data, error } = await supabase
      .from('membresia_grupo')
      .select('id_membresia, rol_grupo_id')
      .eq('id_membresia', miembroGrupoId)
      .is('fecha_desvinculacion', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return { exists: false, rol_grupo_id: null };
      throw error;
    }
    return { exists: true, rol_grupo_id: data.rol_grupo_id };
  }

  /**
   * Verifica si un rol de grupo ministerial existe y está activo
   */
  async rolGrupoExistsAsync(rolId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('rol_grupo_ministerial')
      .select('id_rol_grupo')
      .eq('id_rol_grupo', rolId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Verifica si un usuario existe y está activo
   */
  async usuarioExistsAsync(usuarioId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('usuario')
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
    historialData: Omit<HistorialRolGrupo, 'id' | 'fecha_cambio'>
  ): Promise<HistorialRolGrupo> {
    const { data, error } = await supabase
      .from('historial_rol_grupo')
      .insert(historialData)
      .select()
      .single();

    if (error) throw error;
    return data as HistorialRolGrupo;
  }

  /**
   * Actualiza el rol_grupo_id en la tabla membresia_grupo
   */
  async updateRolMembresiaAsync(miembroGrupoId: number, nuevoRolId: number): Promise<void> {
    const { error } = await supabase
      .from('membresia_grupo')
      .update({ rol_grupo_id: nuevoRolId })
      .eq('id_membresia', miembroGrupoId);

    if (error) throw error;
  }
}
