import { supabase } from '@/common/utils/supabaseClient';
import type { Usuario, UsuarioConPassword } from './usuariosModel';

/**
 * Repositorio para operaciones de datos de Usuarios
 */
export class UsuariosRepository {
  /**
   * Obtiene todos los usuarios (sin password_hash)
   */
  async findAllAsync(): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('usuario')
      .select('id, miembro_id, email, rol, activo, fecha_creacion, ultimo_acceso')
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data as Usuario[];
  }

  /**
   * Obtiene un usuario por ID (sin password_hash)
   */
  async findByIdAsync(id: number): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuario')
      .select('id, miembro_id, email, rol, activo, fecha_creacion, ultimo_acceso')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Usuario;
  }

  /**
   * Obtiene un usuario por ID sin filtrar por activo (para PATCH estado)
   */
  async findByIdIncludingInactiveAsync(id: number): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuario')
      .select('id, miembro_id, email, rol, activo, fecha_creacion, ultimo_acceso')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Usuario;
  }

  /**
   * Verifica si un email ya existe
   */
  async existsByEmailAsync(email: string, excludeId?: number): Promise<boolean> {
    let query = supabase.from('usuario').select('id').eq('email', email);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data !== null && data.length > 0;
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
   * Verifica si un miembro ya tiene un usuario asociado
   */
  async miembroHasUsuarioAsync(miembroId: number, excludeId?: number): Promise<boolean> {
    let query = supabase.from('usuario').select('id').eq('miembro_id', miembroId);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data !== null && data.length > 0;
  }

  /**
   * Crea un nuevo usuario
   */
  async createAsync(
    usuarioData: Pick<UsuarioConPassword, 'email' | 'password_hash' | 'rol'> & {
      miembro_id: number;
    },
  ): Promise<Usuario> {
    const { data, error } = await supabase
      .from('usuario')
      .insert({ ...usuarioData, activo: true })
      .select('id, miembro_id, email, rol, activo, fecha_creacion, ultimo_acceso')
      .single();

    if (error) throw error;
    return data as Usuario;
  }

  /**
   * Actualiza un usuario existente (email y/o rol)
   */
  async updateAsync(id: number, usuarioData: Partial<Usuario>): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuario')
      .update(usuarioData)
      .eq('id', id)
      .select('id, miembro_id, email, rol, activo, fecha_creacion, ultimo_acceso')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Usuario;
  }

  /**
   * Cambia el estado activo/inactivo de un usuario
   */
  async updateEstadoAsync(id: number, activo: boolean): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuario')
      .update({ activo })
      .eq('id', id)
      .select('id, miembro_id, email, rol, activo, fecha_creacion, ultimo_acceso')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Usuario;
  }
}
