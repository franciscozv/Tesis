import type { EstadoComunion, Miembro } from '@/api/miembros/miembrosModel';
import { supabase } from '@/common/utils/supabaseClient';

// Columnas seguras: excluye password_hash deliberadamente
const MIEMBRO_SELECT =
  'id, rut, nombre, apellido, email, telefono, fecha_nacimiento, direccion, genero, estado_comunion, fecha_ingreso, activo, created_at, updated_at, rol, fecha_creacion, ultimo_acceso';

/**
 * Repository para gestionar operaciones de base de datos de Miembros
 */
export class MiembrosRepository {
  /**
   * Obtiene todos los miembros activos (sin paginación)
   */
  async findAllAsync(): Promise<Miembro[]> {
    const { data, error } = await supabase
      .from('miembro')
      .select(MIEMBRO_SELECT)
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Miembro[]) || [];
  }

  /**
   * Obtiene miembros activos con paginación, búsqueda y filtros
   */
  async findAllPaginatedAsync(params: {
    page: number;
    limit: number;
    search?: string;
    estado_comunion?: EstadoComunion;
    incluir_inactivos?: boolean;
  }): Promise<{ data: Miembro[]; total: number }> {
    const { page, limit, search, estado_comunion, incluir_inactivos } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('miembro')
      .select(MIEMBRO_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!incluir_inactivos) {
      query = query.eq('activo', true);
    }

    if (search) {
      query = query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,rut.ilike.%${search}%`);
    }

    if (estado_comunion) {
      query = query.eq('estado_comunion', estado_comunion);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: (data as Miembro[]) || [], total: count ?? 0 };
  }

  /**
   * Busca un miembro por ID (solo activos)
   */
  async findByIdAsync(id: number): Promise<Miembro | null> {
    const { data, error } = await supabase
      .from('miembro')
      .select(MIEMBRO_SELECT)
      .eq('id', id)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Miembro;
  }

  /**
   * Busca un miembro por ID incluyendo inactivos (para gestión de cuenta)
   */
  async findByIdIncludingInactiveAsync(id: number): Promise<Miembro | null> {
    const { data, error } = await supabase
      .from('miembro')
      .select(MIEMBRO_SELECT)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Miembro;
  }

  /**
   * Verifica si un email ya está en uso (excluyendo opcionalmente un miembro)
   */
  async existsByEmailAsync(email: string, excludeId?: number): Promise<boolean> {
    let query = supabase.from('miembro').select('id').eq('email', email);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data !== null && data.length > 0;
  }

  /**
   * Crea un nuevo miembro
   */
  async createAsync(
    miembroData: Omit<Miembro, 'id' | 'created_at' | 'updated_at' | 'activo' | 'ultimo_acceso'> & {
      password_hash: string;
      fecha_creacion: string;
    },
  ): Promise<Miembro> {
    const { data, error } = await supabase
      .from('miembro')
      .insert([{ ...miembroData, activo: true }])
      .select(MIEMBRO_SELECT)
      .single();

    if (error) throw error;
    return data as Miembro;
  }

  /**
   * Actualiza un miembro existente (solo activos)
   */
  async updateAsync(id: number, miembroData: Partial<Miembro>): Promise<Miembro | null> {
    const { data, error } = await supabase
      .from('miembro')
      .update(miembroData)
      .eq('id', id)
      .eq('activo', true)
      .select(MIEMBRO_SELECT)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Miembro;
  }

  /**
   * Actualiza solo datos de contacto de un miembro (perfil propio)
   */
  async updatePerfilAsync(
    id: number,
    data: { direccion?: string | null; telefono?: string | null; email?: string | null },
  ): Promise<Miembro | null> {
    const { data: miembro, error } = await supabase
      .from('miembro')
      .update(data)
      .eq('id', id)
      .eq('activo', true)
      .select(MIEMBRO_SELECT)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return miembro as Miembro;
  }

  /**
   * Reactiva un miembro inactivo (soft delete reverso)
   */
  async reactivarAsync(id: number): Promise<Miembro | null> {
    const { data, error } = await supabase
      .from('miembro')
      .update({ activo: true })
      .eq('id', id)
      .eq('activo', false)
      .select(MIEMBRO_SELECT)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Miembro;
  }

  /**
   * Verifica si un miembro tiene registros asociados en otras tablas (dependencias)
   */
  async checkDependenciasAsync(id: number): Promise<boolean> {
    const [historialMiembro, historialUsuario, integrantes, invitados, actividades] =
      await Promise.all([
        supabase
          .from('historial_estado')
          .select('*', { count: 'exact', head: true })
          .eq('miembro_id', id),
        supabase
          .from('historial_estado')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', id),
        supabase
          .from('integrante_grupo')
          .select('*', { count: 'exact', head: true })
          .eq('miembro_id', id),
        supabase.from('invitado').select('*', { count: 'exact', head: true }).eq('miembro_id', id),
        supabase.from('actividad').select('*', { count: 'exact', head: true }).eq('creador_id', id),
      ]);

    if (historialMiembro.error) throw historialMiembro.error;
    if (historialUsuario.error) throw historialUsuario.error;
    if (integrantes.error) throw integrantes.error;
    if (invitados.error) throw invitados.error;
    if (actividades.error) throw actividades.error;

    return (
      (historialMiembro.count ?? 0) > 0 ||
      (historialUsuario.count ?? 0) > 0 ||
      (integrantes.count ?? 0) > 0 ||
      (invitados.count ?? 0) > 0 ||
      (actividades.count ?? 0) > 0
    );
  }

  /**
   * Inactiva un miembro (soft delete)
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase.from('miembro').update({ activo: false }).eq('id', id);

    if (error) throw error;
    return true;
  }

  /**
   * Elimina físicamente un miembro de la base de datos (hard delete)
   */
  async hardDeleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase.from('miembro').delete().eq('id', id);

    if (error) throw error;
    return true;
  }

  /**
   * Cambia el estado de membresía de un miembro (RF_05)
   */
  async changeEstadoComunionAsync(id: number, estado_comunion: string): Promise<Miembro | null> {
    const { data, error } = await supabase
      .from('miembro')
      .update({ estado_comunion })
      .eq('id', id)
      .eq('activo', true)
      .select(MIEMBRO_SELECT)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Miembro;
  }

  /**
   * Actualiza email y/o rol de la cuenta de un miembro
   */
  async updateCuentaAsync(
    id: number,
    data: { email?: string; rol?: 'administrador' | 'usuario' },
  ): Promise<Miembro | null> {
    const { data: miembro, error } = await supabase
      .from('miembro')
      .update(data)
      .eq('id', id)
      .eq('activo', true)
      .select(MIEMBRO_SELECT)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return miembro as Miembro;
  }

  /**
   * Actualiza la contraseÃ±a (hash) de un miembro
   */
  async updatePasswordAsync(id: number, password_hash: string): Promise<Miembro | null> {
    const { data: miembro, error } = await supabase
      .from('miembro')
      .update({ password_hash })
      .eq('id', id)
      .eq('activo', true)
      .select(MIEMBRO_SELECT)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return miembro as Miembro;
  }
}

export const miembrosRepository = new MiembrosRepository();
