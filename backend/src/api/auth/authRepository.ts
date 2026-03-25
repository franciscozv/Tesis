import { supabase } from '@/common/utils/supabaseClient';

/**
 * Tipo interno para miembro con password_hash (solo para auth)
 */
export interface MiembroAuth {
  id: number;
  email: string;
  password_hash: string;
  rol: 'administrador' | 'usuario';
  activo: boolean;
}

/**
 * Repositorio para operaciones de autenticación
 */
export class AuthRepository {
  /**
   * Busca un miembro por email (incluye password_hash para verificación)
   */
  async findByEmailAsync(email: string): Promise<MiembroAuth | null> {
    const { data, error } = await supabase
      .from('miembro')
      .select('id, email, password_hash, rol, activo')
      .eq('email', email)
      .not('rol', 'is', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as MiembroAuth;
  }

  /**
   * Busca un miembro por ID (incluye password_hash para cambio de contraseña)
   */
  async findByIdWithPasswordAsync(id: number): Promise<MiembroAuth | null> {
    const { data, error } = await supabase
      .from('miembro')
      .select('id, email, password_hash, rol, activo')
      .eq('id', id)
      .not('rol', 'is', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as MiembroAuth;
  }

  /**
   * Actualiza el último acceso del miembro
   */
  async updateUltimoAccesoAsync(id: number): Promise<void> {
    const { error } = await supabase
      .from('miembro')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Actualiza el password_hash de un miembro
   */
  async updatePasswordAsync(id: number, passwordHash: string): Promise<void> {
    const { error } = await supabase
      .from('miembro')
      .update({ password_hash: passwordHash })
      .eq('id', id);

    if (error) throw error;
  }
}
