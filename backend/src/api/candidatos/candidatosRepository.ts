import dayjs from 'dayjs';
import { supabase } from '@/common/utils/supabaseClient';

/**
 * Detalle de un conflicto de horario para un candidato
 */
export interface ConflictoDetalle {
  actividad: string;
  rol: string;
}

/**
 * Miembro activo con datos básicos
 */
export interface MiembroBase {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  estado_comunion: string;
  fecha_ingreso: string;
}

/**
 * Repositorio para consultas de candidatos
 */
export class CandidatosRepository {
  /**
   * Obtiene miembros activos con filtros opcionales de plena comunión, cuerpo_id o grupo_id.
   * - grupoId: filtra miembros con membresía activa en un grupo ministerial específico.
   * - cuerpoId: filtra miembros pertenecientes a una sede/cuerpo (asumiendo que cuerpo_id existe en tabla miembro).
   */
  async findMiembrosActivosFiltradosAsync(filtros: {
    plenaComun?: boolean;
    cuerpoId?: number;
    grupoId?: number;
  }): Promise<MiembroBase[]> {
    // Caso 1: Filtrar por GRUPO MINISTERIAL (requiere JOIN con integrante_cuerpo)
    if (filtros.grupoId !== undefined) {
      let query = supabase
        .from('miembro')
        .select(
          'id, nombre, apellido, telefono, email, estado_comunion, fecha_ingreso, integrante_cuerpo!inner(grupo_id, fecha_desvinculacion)',
        )
        .eq('activo', true)
        .eq('integrante_cuerpo.grupo_id', filtros.grupoId)
        .is('integrante_cuerpo.fecha_desvinculacion', null);

      if (filtros.plenaComun === true) {
        query = query.eq('estado_comunion', 'plena_comunion');
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id as number,
        nombre: row.nombre as string,
        apellido: row.apellido as string,
        telefono: row.telefono as string | null,
        email: row.email as string | null,
        estado_comunion: row.estado_comunion as string,
        fecha_ingreso: row.fecha_ingreso as string,
      }));
    }

    // Caso 2: Filtrar por CUERPO (sede física, asumiendo campo cuerpo_id en miembro)
    // Nota: Si en tu base de datos el "cuerpo" también es un grupo, este filtro es opcional.
    let query = supabase
      .from('miembro')
      .select('id, nombre, apellido, telefono, email, estado_comunion, fecha_ingreso')
      .eq('activo', true);

    if (filtros.cuerpoId !== undefined) {
      // Si tu tabla miembro tiene cuerpo_id, descomenta la siguiente línea:
      // query = query.eq('cuerpo_id', filtros.cuerpoId);
      // Si el cuerpo es un grupo ministerial especial, se debería usar la lógica del Caso 1.
    }

    if (filtros.plenaComun === true) {
      query = query.eq('estado_comunion', 'plena_comunion');
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as MiembroBase[];
  }

  /**
   * Retorna el grupo_id de una actividad, o null si no tiene grupo asignado / no existe.
   */
  async getGrupoIdDeActividadAsync(actividadId: number): Promise<number | null> {
    const { data, error } = await supabase
      .from('actividad')
      .select('grupo_id')
      .eq('id', actividadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return (data as any)?.grupo_id ?? null;
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
        'id, nombre, apellido, telefono, email, estado_comunion, fecha_ingreso, integrante_cuerpo!inner(grupo_id, fecha_desvinculacion)',
      )
      .eq('activo', true)
      .eq('integrante_cuerpo.grupo_id', cuerpoId)
      .is('integrante_cuerpo.fecha_desvinculacion', null);

    if (requierePlenaComunion) {
      query = query.eq('estado_comunion', 'plena_comunion');
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id as number,
      nombre: row.nombre as string,
      apellido: row.apellido as string,
      telefono: row.telefono as string | null,
      email: row.email as string | null,
      estado_comunion: row.estado_comunion as string,
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
    for (const row of (data ?? []) as any[]) {
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
    for (const row of (data ?? []) as any[]) {
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
      .from('integrante_cuerpo')
      .select('miembro_id')
      .in('miembro_id', miembroIds)
      .eq('rol_grupo_id', cargoId)
      .eq('grupo_id', cuerpoId);

    if (error) throw error;

    const result = new Map<number, number>();
    for (const row of (data ?? []) as any[]) {
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
      .from('integrante_cuerpo')
      .select('miembro_id')
      .in('miembro_id', miembroIds)
      .is('fecha_desvinculacion', null);

    if (error) throw error;

    const result = new Map<number, number>();
    for (const row of (data ?? []) as any[]) {
      result.set(row.miembro_id, (result.get(row.miembro_id) ?? 0) + 1);
    }
    return result;
  }

  /**
   * BATCH: Para cada miembro, obtiene la fecha más reciente en que realizó el rol dado
   * (asistio: true, actividad realizada). Retorna Map<miembro_id, fecha_string>.
   * Si un miembro no aparece en el mapa, nunca ha realizado el rol.
   */
  async getUltimoUsoRolBatchAsync(
    miembroIds: number[],
    rolId: number,
  ): Promise<Map<number, string>> {
    if (miembroIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('invitado')
      .select('miembro_id, actividad!inner(fecha, estado)')
      .in('miembro_id', miembroIds)
      .eq('rol_id', rolId)
      .eq('asistio', true)
      .eq('actividad.estado', 'realizada');

    if (error) throw error;

    const result = new Map<number, string>();
    for (const row of (data ?? []) as any[]) {
      const fechaActual = result.get(row.miembro_id);
      if (!fechaActual || row.actividad.fecha > fechaActual) {
        result.set(row.miembro_id, row.actividad.fecha);
      }
    }
    return result;
  }

  /**
   * BATCH: Para cada miembro, cuenta invitaciones confirmadas en actividades programadas
   * dentro de la semana ISO que contiene la fecha dada. Retorna Map<miembro_id, count>.
   */
  async getCargaSemanalBatchAsync(
    miembroIds: number[],
    fecha: string,
  ): Promise<Map<number, number>> {
    if (miembroIds.length === 0) return new Map();

    const inicio = dayjs(fecha).startOf('week').format('YYYY-MM-DD');
    const fin = dayjs(fecha).endOf('week').format('YYYY-MM-DD');

    const { data, error } = await supabase
      .from('invitado')
      .select('miembro_id, actividad!inner(fecha, estado)')
      .in('miembro_id', miembroIds)
      .eq('estado', 'confirmado')
      .eq('actividad.estado', 'programada')
      .gte('actividad.fecha', inicio)
      .lte('actividad.fecha', fin);

    if (error) throw error;

    const result = new Map<number, number>();
    for (const row of (data ?? []) as any[]) {
      result.set(row.miembro_id, (result.get(row.miembro_id) ?? 0) + 1);
    }
    return result;
  }

  /**
   * BATCH: Para cada miembro, devuelve la lista de conflictos de horario (actividades programadas
   * en la misma fecha con invitación confirmada), incluyendo nombre de actividad y rol.
   * Si se provee actividadIdAExcluir, esa actividad no se cuenta como conflicto (útil cuando
   * se consultan candidatos para una actividad que el miembro ya tiene asignada).
   * Retorna Map<miembro_id, ConflictoDetalle[]>.
   */
  async getConflictosBatchAsync(
    miembroIds: number[],
    fecha: string,
    actividadIdAExcluir?: number,
  ): Promise<Map<number, ConflictoDetalle[]>> {
    if (miembroIds.length === 0) return new Map();

    let query = supabase
      .from('invitado')
      .select('miembro_id, actividad!inner(nombre, fecha, estado), rol_actividad!rol_id(nombre)')
      .in('miembro_id', miembroIds)
      .eq('estado', 'confirmado')
      .eq('actividad.fecha', fecha)
      .eq('actividad.estado', 'programada');

    if (actividadIdAExcluir !== undefined) {
      query = query.neq('actividad_id', actividadIdAExcluir);
    }

    const { data, error } = await query;

    if (error) throw error;

    const result = new Map<number, ConflictoDetalle[]>();
    for (const row of (data ?? []) as any[]) {
      const arr = result.get(row.miembro_id) ?? [];
      arr.push({
        actividad: row.actividad.nombre,
        rol: row.rol_actividad?.nombre ?? 'Rol desconocido',
      });
      result.set(row.miembro_id, arr);
    }
    return result;
  }
}
