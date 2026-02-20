import { supabase } from '@/common/utils/supabaseClient';

/**
 * Tipo interno para usuario con password_hash (solo para auth)
 */
export interface UsuarioAuth {
  id: number;
  email: string;
  password_hash: string;
  rol: 'administrador' | 'lider' | 'miembro';
  miembro_id: number | null;
  activo: boolean;
}

/**
 * Repositorio para operaciones de autenticación
 */
export class AuthRepository {
  /**
   * Busca un usuario por email (incluye password_hash para verificación)
   */
  async findByEmailAsync(email: string): Promise<UsuarioAuth | null> {
    const { data, error } = await supabase
      .from('usuario')
      .select('id, email, password_hash, rol, miembro_id, activo')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as UsuarioAuth;
  }

  /**
   * Busca un usuario por ID (incluye password_hash para cambio de contraseña)
   */
  async findByIdWithPasswordAsync(id: number): Promise<UsuarioAuth | null> {
    const { data, error } = await supabase
      .from('usuario')
      .select('id, email, password_hash, rol, miembro_id, activo')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as UsuarioAuth;
  }

  /**
   * Actualiza el último acceso del usuario
   */
  async updateUltimoAccesoAsync(id: number): Promise<void> {
    const { error } = await supabase
      .from('usuario')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Actualiza el password_hash de un usuario
   */
  async updatePasswordAsync(id: number, passwordHash: string): Promise<void> {
    const { error } = await supabase
      .from('usuario')
      .update({ password_hash: passwordHash })
      .eq('id', id);

    if (error) throw error;
  }
}
