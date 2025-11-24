import { supabase } from '@/common/utils/supabaseClient';
import type { Usuario, UsuarioConMiembro } from './authModel';

export class AuthRepository {
  /**
   * Busca un usuario por email
   */
  async findByEmailAsync(email: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .eq('email', email)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Usuario;
  }

  /**
   * Busca un usuario por ID
   */
  async findByIdAsync(id_usuario: number): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .eq('id_usuario', id_usuario)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Usuario;
  }

  /**
   * Busca un usuario por ID con información del miembro
   */
  async findByIdWithMiembroAsync(id_usuario: number): Promise<UsuarioConMiembro | null> {
    const { data, error } = await supabase
      .from('usuario')
      .select(
        `
        id_usuario,
        miembro_id,
        email,
        rol,
        activo,
        ultimo_acceso,
        created_at,
        updated_at,
        miembro:miembro_id (
          id,
          nombre,
          apellido,
          rut,
          telefono
        )
      `
      )
      .eq('id_usuario', id_usuario)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as UsuarioConMiembro;
  }

  /**
   * Busca un usuario por miembro_id
   */
  async findByMiembroIdAsync(miembro_id: number): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .eq('miembro_id', miembro_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Usuario;
  }

  /**
   * Crea un nuevo usuario
   */
  async createAsync(
    userData: Omit<Usuario, 'id_usuario' | 'created_at' | 'updated_at' | 'activo' | 'ultimo_acceso'>
  ): Promise<Usuario> {
    const { data, error } = await supabase
      .from('usuario')
      .insert({ ...userData, activo: true })
      .select()
      .single();

    if (error) throw error;
    return data as Usuario;
  }

  /**
   * Actualiza el password_hash de un usuario
   */
  async updatePasswordAsync(id_usuario: number, password_hash: string): Promise<boolean> {
    const { error } = await supabase
      .from('usuario')
      .update({ password_hash })
      .eq('id_usuario', id_usuario);

    if (error) throw error;
    return true;
  }

  /**
   * Actualiza la fecha de último acceso
   */
  async updateUltimoAccesoAsync(id_usuario: number): Promise<boolean> {
    const { error } = await supabase
      .from('usuario')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id_usuario', id_usuario);

    if (error) throw error;
    return true;
  }

  /**
   * Verifica si un miembro existe y está activo
   */
  async miembroExistsAndActiveAsync(miembro_id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('miembro')
      .select('id')
      .eq('id', miembro_id)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return !!data;
  }

  /**
   * Obtiene el email de un miembro
   */
  async getMiembroEmailAsync(miembro_id: number): Promise<string | null> {
    const { data, error } = await supabase
      .from('miembro')
      .select('email')
      .eq('id', miembro_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data?.email || null;
  }
}
