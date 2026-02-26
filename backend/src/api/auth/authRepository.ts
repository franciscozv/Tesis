import { ROL_ENCARGADO_ID } from '@/common/utils/grupoPermissions';
import { supabase } from '@/common/utils/supabaseClient';

/**
 * Tipo interno para usuario con password_hash (solo para auth)
 */
export interface UsuarioAuth {
  id: number;
  email: string;
  password_hash: string;
  rol: 'administrador' | 'usuario';
  miembro_id: number | null;
  activo: boolean;
}

/**
 * Repositorio para operaciones de autenticaciÃ³n
 */
export class AuthRepository {
  /**
   * Busca un usuario por email (incluye password_hash para verificaciÃ³n)
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
   * Busca un usuario por ID (incluye password_hash para cambio de contraseÃ±a)
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
   * Actualiza el Ãºltimo acceso del usuario
   */
  async updateUltimoAccesoAsync(id: number): Promise<void> {
    const { error } = await supabase
      .from('usuario')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Retorna el grupo_id donde el miembro es encargado activo, o null si no lo es.
   * Usado durante el login para incluir cuerpo_id en el JWT.
   */
  async findCuerpoIdByMiembroAsync(miembroId: number): Promise<number | null> {
    const { data, error } = await supabase
      .from('membresia_grupo')
      .select('grupo_id')
      .eq('miembro_id', miembroId)
      .eq('rol_grupo_id', ROL_ENCARGADO_ID)
      .is('fecha_desvinculacion', null)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.grupo_id ?? null;
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
