import { supabase } from '@/common/utils/supabaseClient';
import type { IntegranteCuerpo, IntegranteCuerpoConNombres } from './integranteCuerpoModel';

/**
 * Repository para operaciones de Integrantes en Cuerpo
 */
export class IntegranteCuerpoRepository {
  /**
   * Verifica si un miembro existe y está activo
   */
  async verificarMiembroActivo(
    miembroId: number,
  ): Promise<{ existe: boolean; activo: boolean; plena_comunion: boolean }> {
    const { data, error } = await supabase
      .from('miembro')
      .select('activo, estado_comunion')
      .eq('id', miembroId)
      .single();

    if (error || !data) {
      return { existe: false, activo: false, plena_comunion: false };
    }

    return {
      existe: true,
      activo: data.activo === true,
      plena_comunion: data.estado_comunion === 'plena_comunion',
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
  async verificarRolActivo(rolId: number): Promise<{
    existe: boolean;
    activo: boolean;
    requiere_plena_comunion: boolean;
    es_unico: boolean;
    es_directiva: boolean;
  }> {
    const { data, error } = await supabase
      .from('rol_grupo_ministerial')
      .select('activo, requiere_plena_comunion, es_unico, es_directiva')
      .eq('id_rol_grupo', rolId)
      .single();

    if (error || !data) {
      return {
        existe: false,
        activo: false,
        requiere_plena_comunion: false,
        es_unico: false,
        es_directiva: false,
      };
    }

    return {
      existe: true,
      activo: data.activo === true,
      requiere_plena_comunion: data.requiere_plena_comunion === true,
      es_unico: data.es_unico === true,
      es_directiva: data.es_directiva === true,
    };
  }

  /**
   * Verifica si ya existe una integración activa para el rol en el grupo.
   * Usado para validar cargos únicos (es_unico: true).
   */
  async estaRolOcupadoEnGrupo(grupoId: number, rolId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('integrante_cuerpo')
      .select('id_integrante')
      .eq('grupo_id', grupoId)
      .eq('rol_grupo_id', rolId)
      .is('fecha_desvinculacion', null)
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  /**
   * Verifica si ya existe cualquier integración activa para el miembro en el grupo,
   * independiente del rol. Regla 1: 1 rol vigente por miembro por grupo.
   */
  async existeIntegranteActivoEnGrupo(
    miembroId: number,
    grupoId: number,
    excludeIntegranteId?: number,
  ): Promise<boolean> {
    let query = supabase
      .from('integrante_cuerpo')
      .select('id_integrante')
      .eq('miembro_id', miembroId)
      .eq('grupo_id', grupoId)
      .is('fecha_desvinculacion', null);

    if (excludeIntegranteId !== undefined) {
      query = query.neq('id_integrante', excludeIntegranteId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data !== null;
  }

  /**
   * Verifica si ya existe una integración activa para el miembro en el grupo con el rol
   */
  async verificarDuplicado(miembroId: number, grupoId: number, rolId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('integrante_cuerpo')
      .select('id_integrante')
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
  ): Promise<IntegranteCuerpo> {
    const { data, error } = await supabase
      .from('integrante_cuerpo')
      .insert({
        miembro_id: miembroId,
        grupo_id: grupoId,
        rol_grupo_id: rolId,
        fecha_vinculacion: fechaVinculacion || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as IntegranteCuerpo;
  }

  /**
   * Obtiene una integración por ID
   */
  async findByIdAsync(id: number): Promise<IntegranteCuerpo | null> {
    const { data, error } = await supabase
      .from('integrante_cuerpo')
      .select('*')
      .eq('id_integrante', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as IntegranteCuerpo;
  }

  /**
   * Desvincula un miembro de un grupo (RF_07)
   */
  async desvincularMiembroAsync(
    id: number,
    fechaDesvinculacion?: string,
  ): Promise<IntegranteCuerpo | null> {
    const { data, error } = await supabase
      .from('integrante_cuerpo')
      .update({
        fecha_desvinculacion: fechaDesvinculacion || new Date().toISOString(),
      })
      .eq('id_integrante', id)
      .is('fecha_desvinculacion', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as IntegranteCuerpo;
  }

  /**
   * Cambia el rol de una integración activa mediante rotación:
   * cierra la fila actual e inserta una nueva fila activa con el nuevo rol.
   */
  async rotarRolAsync(
    id: number,
    miembroId: number,
    grupoId: number,
    nuevoRolId: number,
    fecha?: string,
  ): Promise<IntegranteCuerpo> {
    const hoy = fecha || new Date().toISOString();

    // 1. Cerrar fila activa
    const { error: errorCierre } = await supabase
      .from('integrante_cuerpo')
      .update({ fecha_desvinculacion: hoy })
      .eq('id_integrante', id)
      .is('fecha_desvinculacion', null);

    if (errorCierre) throw errorCierre;

    // 2. Insertar nueva fila activa con el nuevo rol
    const { data, error: errorInsert } = await supabase
      .from('integrante_cuerpo')
      .insert({
        miembro_id: miembroId,
        grupo_id: grupoId,
        rol_grupo_id: nuevoRolId,
        fecha_vinculacion: hoy,
      })
      .select()
      .single();

    if (errorInsert) throw errorInsert;
    return data as IntegranteCuerpo;
  }

  /**
   * Obtiene todas las integraciones de un miembro (activas + históricas) con nombres de grupo y rol
   */
  async findByMiembroIdAsync(miembroId: number): Promise<IntegranteCuerpoConNombres[]> {
    const { data, error } = await supabase
      .from('integrante_cuerpo')
      .select(`
        id_integrante,
        miembro_id,
        grupo_id,
        rol_grupo_id,
        fecha_vinculacion,
        fecha_desvinculacion,
        grupo_ministerial!inner(id_grupo, nombre),
        rol_grupo_ministerial!inner(id_rol_grupo, nombre, es_directiva)
      `)
      .eq('miembro_id', miembroId)
      .order('fecha_vinculacion', { ascending: false });

    if (error) throw error;

    return (data as any[]).map((row) => {
      const grupoObj = Array.isArray(row.grupo_ministerial)
        ? row.grupo_ministerial[0]
        : row.grupo_ministerial;
      const rolObj = Array.isArray(row.rol_grupo_ministerial)
        ? row.rol_grupo_ministerial[0]
        : row.rol_grupo_ministerial;

      return {
        id: row.id_integrante,
        miembro_id: row.miembro_id,
        grupo: {
          id: grupoObj.id_grupo,
          nombre: grupoObj.nombre,
        },
        rol: {
          id: rolObj.id_rol_grupo,
          nombre: rolObj.nombre,
          es_directiva: rolObj.es_directiva === true,
        },
        fecha_vinculacion: row.fecha_vinculacion,
        fecha_desvinculacion: row.fecha_desvinculacion,
      };
    });
  }

  /**
   * Obtiene todas las integraciones activas de un grupo con nombres de rol y miembro
   */
  async findByGrupoIdAsync(grupoId: number): Promise<IntegranteCuerpoConNombres[]> {
    const { data, error } = await supabase
      .from('integrante_cuerpo')
      .select(`
        id_integrante,
        miembro_id,
        grupo_id,
        rol_grupo_id,
        fecha_vinculacion,
        fecha_desvinculacion,
        grupo_ministerial!inner(id_grupo, nombre),
        rol_grupo_ministerial!inner(id_rol_grupo, nombre, es_directiva),
        miembro!inner(id, nombre, apellido, rut)
      `)
      .eq('grupo_id', grupoId)
      .is('fecha_desvinculacion', null)
      .order('fecha_vinculacion', { ascending: false });

    if (error) throw error;

    return (data as any[]).map((row) => {
      // PostgREST/Supabase joins usually return an object for many-to-one,
      // but we handle both cases to be safer.
      const miembroObj = Array.isArray(row.miembro) ? row.miembro[0] : row.miembro;
      const grupoObj = Array.isArray(row.grupo_ministerial)
        ? row.grupo_ministerial[0]
        : row.grupo_ministerial;
      const rolObj = Array.isArray(row.rol_grupo_ministerial)
        ? row.rol_grupo_ministerial[0]
        : row.rol_grupo_ministerial;

      return {
        id: row.id_integrante,
        miembro_id: row.miembro_id,
        miembro: miembroObj
          ? {
              id: miembroObj.id,
              nombre: miembroObj.nombre,
              apellido: miembroObj.apellido,
              rut: miembroObj.rut,
            }
          : undefined,
        grupo: {
          id: grupoObj.id_grupo,
          nombre: grupoObj.nombre,
        },
        rol: {
          id: rolObj.id_rol_grupo,
          nombre: rolObj.nombre,
          es_directiva: rolObj.es_directiva === true,
        },
        fecha_vinculacion: row.fecha_vinculacion,
        fecha_desvinculacion: row.fecha_desvinculacion,
      };
    });
  }
}
