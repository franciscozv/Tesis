import { supabase } from '@/common/utils/supabaseClient';
import type { MembresiaGrupo, MembresiaGrupoConNombres } from './membresiaGrupoModel';

/**
 * Repository para operaciones de Membresía en Grupos Ministeriales
 */
export class MembresiaGrupoRepository {
  /**
   * Verifica si un miembro existe y está activo
   */
  async verificarMiembroActivo(
    miembroId: number,
  ): Promise<{ existe: boolean; activo: boolean; plena_comunion: boolean }> {
    const { data, error } = await supabase
      .from('miembro')
      .select('activo, estado_membresia')
      .eq('id', miembroId)
      .single();

    if (error || !data) {
      return { existe: false, activo: false, plena_comunion: false };
    }

    return {
      existe: true,
      activo: data.activo === true,
      plena_comunion: data.estado_membresia === 'plena_comunion',
    };
  }

  /**
   * Verifica si un grupo ministerial existe y está activo
   */
  async verificarGrupoActivo(grupoId: number): Promise<{ existe: boolean; activo: boolean }> {
    const { data, error } = await supabase
      .from('grupo_ministerial')
      .select('activo')
      .eq('id_grupo', grupoId)
      .single();

    if (error || !data) {
      return { existe: false, activo: false };
    }

    return {
      existe: true,
      activo: data.activo === true,
    };
  }

  /**
   * Verifica si un rol de grupo existe y está activo
   */
  async verificarRolActivo(
    rolId: number,
  ): Promise<{ existe: boolean; activo: boolean; requiere_plena_comunion: boolean }> {
    const { data, error } = await supabase
      .from('rol_grupo_ministerial')
      .select('activo, requiere_plena_comunion')
      .eq('id_rol_grupo', rolId)
      .single();

    if (error || !data) {
      return { existe: false, activo: false, requiere_plena_comunion: false };
    }

    return {
      existe: true,
      activo: data.activo === true,
      requiere_plena_comunion: data.requiere_plena_comunion === true,
    };
  }

  /**
   * Verifica si ya existe cualquier membresía activa para el miembro en el grupo,
   * independiente del rol. Regla 1: 1 rol vigente por miembro por grupo.
   */
  async existeMembresiaActivaEnGrupo(
    miembroId: number,
    grupoId: number,
    excludeMembresiaId?: number,
  ): Promise<boolean> {
    let query = supabase
      .from('membresia_grupo')
      .select('id_membresia')
      .eq('miembro_id', miembroId)
      .eq('grupo_id', grupoId)
      .is('fecha_desvinculacion', null);

    if (excludeMembresiaId !== undefined) {
      query = query.neq('id_membresia', excludeMembresiaId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data !== null;
  }

  /**
   * Verifica si ya existe una membresía activa para el miembro en el grupo con el rol
   */
  async verificarDuplicado(miembroId: number, grupoId: number, rolId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('membresia_grupo')
      .select('id_membresia')
      .eq('miembro_id', miembroId)
      .eq('grupo_id', grupoId)
      .eq('rol_grupo_id', rolId)
      .is('fecha_desvinculacion', null)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  /**
   * Vincula un miembro a un grupo ministerial (RF_06)
   */
  async vincularMiembroAsync(
    miembroId: number,
    grupoId: number,
    rolId: number,
    fechaVinculacion?: string,
  ): Promise<MembresiaGrupo> {
    const { data, error } = await supabase
      .from('membresia_grupo')
      .insert({
        miembro_id: miembroId,
        grupo_id: grupoId,
        rol_grupo_id: rolId,
        fecha_vinculacion: fechaVinculacion || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as MembresiaGrupo;
  }

  /**
   * Obtiene una membresía por ID
   */
  async findByIdAsync(id: number): Promise<MembresiaGrupo | null> {
    const { data, error } = await supabase
      .from('membresia_grupo')
      .select('*')
      .eq('id_membresia', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as MembresiaGrupo;
  }

  /**
   * Desvincula un miembro de un grupo (RF_07)
   */
  async desvincularMiembroAsync(
    id: number,
    fechaDesvinculacion?: string,
  ): Promise<MembresiaGrupo | null> {
    const { data, error } = await supabase
      .from('membresia_grupo')
      .update({
        fecha_desvinculacion: fechaDesvinculacion || new Date().toISOString(),
      })
      .eq('id_membresia', id)
      .is('fecha_desvinculacion', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as MembresiaGrupo;
  }

  /**
   * Cambia el rol de una membresía activa mediante rotación:
   * cierra la fila actual e inserta una nueva fila activa con el nuevo rol.
   */
  async rotarRolAsync(
    id: number,
    miembroId: number,
    grupoId: number,
    nuevoRolId: number,
    fecha?: string,
  ): Promise<MembresiaGrupo> {
    const hoy = fecha || new Date().toISOString();

    // 1. Cerrar fila activa
    const { error: errorCierre } = await supabase
      .from('membresia_grupo')
      .update({ fecha_desvinculacion: hoy })
      .eq('id_membresia', id)
      .is('fecha_desvinculacion', null);

    if (errorCierre) throw errorCierre;

    // 2. Insertar nueva fila activa con el nuevo rol
    const { data, error: errorInsert } = await supabase
      .from('membresia_grupo')
      .insert({
        miembro_id: miembroId,
        grupo_id: grupoId,
        rol_grupo_id: nuevoRolId,
        fecha_vinculacion: hoy,
      })
      .select()
      .single();

    if (errorInsert) throw errorInsert;
    return data as MembresiaGrupo;
  }

  /**
   * Obtiene todas las membresías de un miembro (activas + históricas) con nombres de grupo y rol
   */
  async findByMiembroIdAsync(miembroId: number): Promise<MembresiaGrupoConNombres[]> {
    const { data, error } = await supabase
      .from('membresia_grupo')
      .select(`
        id_membresia,
        miembro_id,
        grupo_id,
        rol_grupo_id,
        fecha_vinculacion,
        fecha_desvinculacion,
        grupo_ministerial!inner(id_grupo, nombre),
        rol_grupo_ministerial!inner(id_rol_grupo, nombre)
      `)
      .eq('miembro_id', miembroId)
      .order('fecha_vinculacion', { ascending: false });

    if (error) throw error;

    return (data as any[]).map((row) => ({
      id: row.id_membresia,
      grupo: {
        id: row.grupo_ministerial.id_grupo,
        nombre: row.grupo_ministerial.nombre,
      },
      rol: {
        id: row.rol_grupo_ministerial.id_rol_grupo,
        nombre: row.rol_grupo_ministerial.nombre,
      },
      fecha_vinculacion: row.fecha_vinculacion,
      fecha_desvinculacion: row.fecha_desvinculacion,
    }));
  }

  /**
   * Obtiene todas las membresías activas de un grupo con nombres de rol y miembro
   */
  async findByGrupoIdAsync(grupoId: number): Promise<MembresiaGrupoConNombres[]> {
    const { data, error } = await supabase
      .from('membresia_grupo')
      .select(`
        id_membresia,
        miembro_id,
        grupo_id,
        rol_grupo_id,
        fecha_vinculacion,
        fecha_desvinculacion,
        grupo_ministerial!inner(id_grupo, nombre),
        rol_grupo_ministerial!inner(id_rol_grupo, nombre),
        miembro!inner(id, nombre, apellido)
      `)
      .eq('grupo_id', grupoId)
      .is('fecha_desvinculacion', null)
      .order('fecha_vinculacion', { ascending: false });

    if (error) throw error;

    return (data as any[]).map((row) => ({
      id: row.id_membresia,
      miembro_id: row.miembro_id,
      miembro: {
        id: row.miembro.id,
        nombre: row.miembro.nombre,
        apellido: row.miembro.apellido,
      },
      grupo: {
        id: row.grupo_ministerial.id_grupo,
        nombre: row.grupo_ministerial.nombre,
      },
      rol: {
        id: row.rol_grupo_ministerial.id_rol_grupo,
        nombre: row.rol_grupo_ministerial.nombre,
      },
      fecha_vinculacion: row.fecha_vinculacion,
      fecha_desvinculacion: row.fecha_desvinculacion,
    }));
  }
}
