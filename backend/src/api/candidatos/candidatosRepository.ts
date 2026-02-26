import { supabase } from '@/common/utils/supabaseClient';

/**
 * Miembro activo con datos básicos
 */
export interface MiembroBase {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  estado_membresia: string;
  fecha_ingreso: string;
}

/**
 * Repositorio para consultas de candidatos
 */
export class CandidatosRepository {
  /**
   * Obtiene miembros activos con filtros opcionales de plena comunión y cuerpo_id.
   * Si cuerpo_id está presente, solo retorna miembros con membresía activa en ese grupo.
   */
  async findMiembrosActivosFiltradosAsync(filtros: {
    plenaComun?: boolean;
    cuerpoId?: number;
  }): Promise<MiembroBase[]> {
    if (filtros.cuerpoId !== undefined) {
      // Filtrar por grupo vía inner join con membresia_grupo
      let query = supabase
        .from('miembro')
        .select(
          'id, nombre, apellido, telefono, email, estado_membresia, fecha_ingreso, membresia_grupo!inner(grupo_id, fecha_desvinculacion)',
        )
        .eq('activo', true)
        .eq('membresia_grupo.grupo_id', filtros.cuerpoId)
        .is('membresia_grupo.fecha_desvinculacion', null);

      if (filtros.plenaComun === true) {
        query = query.eq('estado_membresia', 'plena_comunion');
      }

      const { data, error } = await query;
      if (error) throw error;

      // Extraer solo los campos de MiembroBase (descartar la relación embebida)
      return (data ?? []).map((row) => ({
        id: row.id as number,
        nombre: row.nombre as string,
        apellido: row.apellido as string,
        telefono: row.telefono as string | null,
        email: row.email as string | null,
        estado_membresia: row.estado_membresia as string,
        fecha_ingreso: row.fecha_ingreso as string,
      }));
    }

    // Sin filtro de cuerpo: búsqueda global
    let query = supabase
      .from('miembro')
      .select('id, nombre, apellido, telefono, email, estado_membresia, fecha_ingreso')
      .eq('activo', true);

    if (filtros.plenaComun === true) {
      query = query.eq('estado_membresia', 'plena_comunion');
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as MiembroBase[];
  }

  /**
   * Verifica si un rol de actividad existe y está activo
   */
  async rolActividadExistsAsync(rolId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('rol_actividad')
      .select('id_rol')
      .eq('id_rol', rolId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Obtiene el nombre de un rol de actividad
   */
  async getRolActividadNombreAsync(rolId: number): Promise<string | null> {
    const { data, error } = await supabase
      .from('rol_actividad')
      .select('nombre')
      .eq('id_rol', rolId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data?.nombre ?? null;
  }

  /**
   * Obtiene requisitos de un cargo de grupo: existencia, nombre y si requiere plena comunión.
   * Reemplaza rolGrupoExistsAsync + getRolGrupoNombreAsync en una sola query.
   */
  async getCargoRequisitosAsync(
    cargoId: number,
  ): Promise<{ existe: boolean; requiere_plena_comunion: boolean; nombre: string | null }> {
    const { data, error } = await supabase
      .from('rol_grupo_ministerial')
      .select('id_rol_grupo, nombre, requiere_plena_comunion')
      .eq('id_rol_grupo', cargoId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116')
        return { existe: false, requiere_plena_comunion: false, nombre: null };
      throw error;
    }
    return {
      existe: data !== null,
      requiere_plena_comunion: (data as any)?.requiere_plena_comunion ?? false,
      nombre: (data as any)?.nombre ?? null,
    };
  }

  /**
   * Retorna miembros con membresía vigente (fecha_desvinculacion IS NULL) en un cuerpo.
   * Si requierePlenaComunion es true, filtra solo los de estado 'plena_comunion'.
   */
  async findMiembrosVigentesEnCuerpoAsync(
    cuerpoId: number,
    requierePlenaComunion: boolean,
  ): Promise<MiembroBase[]> {
    let query = supabase
      .from('miembro')
      .select(
        'id, nombre, apellido, telefono, email, estado_membresia, fecha_ingreso, membresia_grupo!inner(grupo_id, fecha_desvinculacion)',
      )
      .eq('activo', true)
      .eq('membresia_grupo.grupo_id', cuerpoId)
      .is('membresia_grupo.fecha_desvinculacion', null);

    if (requierePlenaComunion) {
      query = query.eq('estado_membresia', 'plena_comunion');
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id as number,
      nombre: row.nombre as string,
      apellido: row.apellido as string,
      telefono: row.telefono as string | null,
      email: row.email as string | null,
      estado_membresia: row.estado_membresia as string,
      fecha_ingreso: row.fecha_ingreso as string,
    }));
  }

  // ─── Métodos BATCH para sugerirParaRol (evitan N+1) ─────────────────────────

  /**
   * BATCH: Cuenta invitaciones asistidas por rol en actividades realizadas,
   * para una lista de miembros. Retorna Map<miembro_id, count>.
   */
  async getExperienciaRolBatchAsync(
    miembroIds: number[],
    rolId: number,
  ): Promise<Map<number, number>> {
    if (miembroIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('invitado')
      .select('miembro_id, actividad!inner(estado)')
      .in('miembro_id', miembroIds)
      .eq('rol_id', rolId)
      .eq('asistio', true)
      .eq('actividad.estado', 'realizada');

    if (error) throw error;

    const result = new Map<number, number>();
    for (const row of (data ?? []) as Array<{ miembro_id: number }>) {
      result.set(row.miembro_id, (result.get(row.miembro_id) ?? 0) + 1);
    }
    return result;
  }

  /**
   * BATCH: Igual que getExperienciaRolBatchAsync, pero filtrando por tipo de actividad.
   * Retorna Map<miembro_id, count>.
   */
  async getExperienciaRolEnTipoBatchAsync(
    miembroIds: number[],
    rolId: number,
    tipoActividadId: number,
  ): Promise<Map<number, number>> {
    if (miembroIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('invitado')
      .select('miembro_id, actividad!inner(estado, tipo_actividad_id)')
      .in('miembro_id', miembroIds)
      .eq('rol_id', rolId)
      .eq('asistio', true)
      .eq('actividad.estado', 'realizada')
      .eq('actividad.tipo_actividad_id', tipoActividadId);

    if (error) throw error;

    const result = new Map<number, number>();
    for (const row of (data ?? []) as Array<{ miembro_id: number }>) {
      result.set(row.miembro_id, (result.get(row.miembro_id) ?? 0) + 1);
    }
    return result;
  }

  /**
   * BATCH: Para cada miembro, obtiene (confirmadas, asistidas) en actividades realizadas
   * dentro del rango de fechas. Retorna Map<miembro_id, {confirmadas, asistidas}>.
   */
  async getAsistenciaBatchAsync(
    miembroIds: number[],
    fechaInicio: string,
    fechaFin: string,
  ): Promise<Map<number, { confirmadas: number; asistidas: number }>> {
    if (miembroIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('invitado')
      .select('miembro_id, asistio, actividad!inner(fecha, estado)')
      .in('miembro_id', miembroIds)
      .eq('estado', 'confirmado')
      .eq('actividad.estado', 'realizada')
      .gte('actividad.fecha', fechaInicio)
      .lte('actividad.fecha', fechaFin);

    if (error) throw error;

    const result = new Map<number, { confirmadas: number; asistidas: number }>();
    for (const row of (data ?? []) as Array<{ miembro_id: number; asistio: boolean }>) {
      const cur = result.get(row.miembro_id) ?? { confirmadas: 0, asistidas: 0 };
      cur.confirmadas++;
      if (row.asistio) cur.asistidas++;
      result.set(row.miembro_id, cur);
    }
    return result;
  }

  /**
   * BATCH: Conteo histórico de un cargo en un cuerpo específico para una lista de miembros.
   * Incluye membresías pasadas y vigentes. Retorna Map<miembro_id, count>.
   */
  async getExperienciaCargoEnCuerpoBatchAsync(
    miembroIds: number[],
    cargoId: number,
    cuerpoId: number,
  ): Promise<Map<number, number>> {
    if (miembroIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('membresia_grupo')
      .select('miembro_id')
      .in('miembro_id', miembroIds)
      .eq('rol_grupo_id', cargoId)
      .eq('grupo_id', cuerpoId);

    if (error) throw error;

    const result = new Map<number, number>();
    for (const row of (data ?? []) as Array<{ miembro_id: number }>) {
      result.set(row.miembro_id, (result.get(row.miembro_id) ?? 0) + 1);
    }
    return result;
  }

  /**
   * BATCH: Conteo de membresías vigentes (fecha_desvinculacion IS NULL) en cualquier grupo,
   * para una lista de miembros. Retorna Map<miembro_id, count>.
   */
  async getGruposActivosBatchAsync(miembroIds: number[]): Promise<Map<number, number>> {
    if (miembroIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('membresia_grupo')
      .select('miembro_id')
      .in('miembro_id', miembroIds)
      .is('fecha_desvinculacion', null);

    if (error) throw error;

    const result = new Map<number, number>();
    for (const row of (data ?? []) as Array<{ miembro_id: number }>) {
      result.set(row.miembro_id, (result.get(row.miembro_id) ?? 0) + 1);
    }
    return result;
  }

  /**
   * BATCH: Cuenta invitaciones confirmadas en actividades programadas para una fecha dada,
   * por miembro. Retorna Map<miembro_id, count_conflictos>.
   */
  async getConflictosBatchAsync(miembroIds: number[], fecha: string): Promise<Map<number, number>> {
    if (miembroIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('invitado')
      .select('miembro_id, actividad!inner(fecha, estado)')
      .in('miembro_id', miembroIds)
      .eq('estado', 'confirmado')
      .eq('actividad.fecha', fecha)
      .eq('actividad.estado', 'programada');

    if (error) throw error;

    const result = new Map<number, number>();
    for (const row of (data ?? []) as Array<{ miembro_id: number }>) {
      result.set(row.miembro_id, (result.get(row.miembro_id) ?? 0) + 1);
    }
    return result;
  }
}
