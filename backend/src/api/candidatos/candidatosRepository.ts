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
 * Detalle de un servicio confirmado esta semana para un candidato
 */
export interface ServicioSemanaDetalle {
  actividad: string;
  rol: string;
  fecha: string;
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
  fecha_vinculacion_grupo?: string;
}

/**
 * Repositorio para consultas de candidatos
 */
export class CandidatosRepository {
  /**
   * Obtiene miembros activos con filtros opcionales de plena comunión, grupo_id o grupo_id.
   * - grupoId: filtra miembros con membresía activa en un grupo ministerial específico.
   * - grupoId: filtra miembros pertenecientes a una sede/grupo (asumiendo que grupo_id existe en tabla miembro).
   */
  async findMiembrosActivosFiltradosAsync(filtros: {
    plenaComun?: boolean;
    grupoId?: number;
  }): Promise<MiembroBase[]> {
    // Caso 1: Filtrar por GRUPO MINISTERIAL (requiere JOIN con integrante_grupo)
    if (filtros.grupoId !== undefined) {
      let query = supabase
        .from('miembro')
        .select(
          'id, nombre, apellido, telefono, email, estado_comunion, fecha_ingreso, integrante_grupo!inner(grupo_id, fecha_vinculacion, fecha_desvinculacion)',
        )
        .eq('activo', true)
        .eq('integrante_grupo.grupo_id', filtros.grupoId)
        .is('integrante_grupo.fecha_desvinculacion', null);

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
        fecha_vinculacion_grupo: row.integrante_grupo?.[0]?.fecha_vinculacion as string | undefined,
      }));
    }

    // Caso 2: Filtrar por CUERPO (sede física, asumiendo campo grupo_id en miembro)
    // Nota: Si en tu base de datos el "grupo" también es un grupo, este filtro es opcional.
    let query = supabase
      .from('miembro')
      .select('id, nombre, apellido, telefono, email, estado_comunion, fecha_ingreso')
      .eq('activo', true);

    if (filtros.grupoId !== undefined) {
      // Si tu tabla miembro tiene grupo_id, descomenta la siguiente línea:
      // query = query.eq('grupo_id', filtros.grupoId);
      // Si el grupo es un grupo ministerial especial, se debería usar la lógica del Caso 1.
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
   * Verifica si un responsabilidad de actividad existe y está activo
   */
  async responsabilidadActividadExistsAsync(rolId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('responsabilidad_actividad')
      .select('id_responsabilidad')
      .eq('id_responsabilidad', rolId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Obtiene el nombre de un responsabilidad de actividad
   */
  async getResponsabilidadActividadNombreAsync(rolId: number): Promise<string | null> {
    const { data, error } = await supabase
      .from('responsabilidad_actividad')
      .select('nombre')
      .eq('id_responsabilidad', rolId)
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
      .from('rol_grupo')
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
   * Retorna miembros con membresía vigente (fecha_desvinculacion IS NULL).
   * Si se provee grupoId, filtra por ese grupo.
   * Si requierePlenaComunion es true, filtra solo los de estado 'plena_comunion'.
   */
  async findMiembrosVigentesEnGrupoAsync(
    _requierePlenaComunion: boolean,
    grupoId?: number,
  ): Promise<MiembroBase[]> {
    let query = supabase
      .from('miembro')
      .select(
        'id, nombre, apellido, telefono, email, estado_comunion, fecha_ingreso, integrante_grupo!inner(grupo_id, fecha_desvinculacion)',
      )
      .eq('activo', true)
      .is('integrante_grupo.fecha_desvinculacion', null);

    if (grupoId !== undefined) {
      query = query.eq('integrante_grupo.grupo_id', grupoId);
    }

    // Se elimina el filtro duro de estado_comunion para permitir que el administrador 
    // vea a todos los candidatos y tome la decisión final.

    const { data, error } = await query;
    if (error) throw error;

    // Usar un Map para asegurar unicidad de miembros (un miembro puede estar en varios grupos)
    const miembrosMap = new Map<number, MiembroBase>();
    for (const row of (data ?? []) as any[]) {
      if (!miembrosMap.has(row.id)) {
        miembrosMap.set(row.id, {
          id: row.id as number,
          nombre: row.nombre as string,
          apellido: row.apellido as string,
          telefono: row.telefono as string | null,
          email: row.email as string | null,
          estado_comunion: row.estado_comunion as string,
          fecha_ingreso: row.fecha_ingreso as string,
          fecha_vinculacion_grupo: row.integrante_grupo?.[0]?.fecha_vinculacion as string | undefined,
        });
      }
    }

    return Array.from(miembrosMap.values());
  }

  // ─── Métodos BATCH para sugerirParaResponsabilidad (evitan N+1) ─────────────────────────

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
      .eq('responsabilidad_id', rolId)
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
      .eq('responsabilidad_id', rolId)
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
   * BATCH: Historial de un cargo en un grupo específico para una lista de miembros.
   * Incluye membresías pasadas y vigentes. Retorna Map<miembro_id, historial[]>.
   */
  async getExperienciaCargoEnGrupoBatchAsync(
    miembroIds: number[],
    cargoId: number,
    grupoId: number,
  ): Promise<Map<number, Array<{ grupo_nombre: string; fecha_inicio: string; fecha_fin: string | null }>>> {
    if (miembroIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('integrante_grupo')
      .select('miembro_id, fecha_vinculacion, fecha_desvinculacion, grupo(nombre)')
      .in('miembro_id', miembroIds)
      .eq('rol_grupo_id', cargoId)
      .eq('grupo_id', grupoId);

    if (error) throw error;

    const result = new Map<number, Array<{ grupo_nombre: string; fecha_inicio: string; fecha_fin: string | null }>>();
    for (const row of (data ?? []) as any[]) {
      const arr = result.get(row.miembro_id) ?? [];
      arr.push({
        grupo_nombre: row.grupo?.nombre ?? 'Desconocido',
        fecha_inicio: row.fecha_vinculacion,
        fecha_fin: row.fecha_desvinculacion,
      });
      result.set(row.miembro_id, arr);
    }
    return result;
  }

  /**
   * BATCH: Historial de un cargo en CUALQUIER grupo para una lista de miembros.
   * Retorna Map<miembro_id, historial[]>.
   */
  async getExperienciaCargoGlobalBatchAsync(
    miembroIds: number[],
    cargoId: number,
  ): Promise<Map<number, Array<{ grupo_nombre: string; fecha_inicio: string; fecha_fin: string | null }>>> {
    if (miembroIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('integrante_grupo')
      .select('miembro_id, fecha_vinculacion, fecha_desvinculacion, grupo(nombre)')
      .in('miembro_id', miembroIds)
      .eq('rol_grupo_id', cargoId);

    if (error) throw error;

    const result = new Map<number, Array<{ grupo_nombre: string; fecha_inicio: string; fecha_fin: string | null }>>();
    for (const row of (data ?? []) as any[]) {
      const arr = result.get(row.miembro_id) ?? [];
      arr.push({
        grupo_nombre: row.grupo?.nombre ?? 'Desconocido',
        fecha_inicio: row.fecha_vinculacion,
        fecha_fin: row.fecha_desvinculacion,
      });
      result.set(row.miembro_id, arr);
    }
    return result;
  }

  /**
   * BATCH: Obtiene el detalle de membresías vigentes (grupo y rol) para una lista de miembros.
   * Retorna Map<miembro_id, Array<{ grupo: string; rol: string }>>.
   */
  async getGruposActivosBatchAsync(
    miembroIds: number[],
  ): Promise<Map<number, Array<{ grupo: string; rol: string }>>> {
    if (miembroIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('integrante_grupo')
      .select('miembro_id, grupo(nombre), rol_grupo(nombre)')
      .in('miembro_id', miembroIds)
      .is('fecha_desvinculacion', null);

    if (error) throw error;

    const result = new Map<number, Array<{ grupo: string; rol: string }>>();
    for (const row of (data ?? []) as any[]) {
      const arr = result.get(row.miembro_id) ?? [];
      const nombreGrupo = row.grupo?.nombre;
      const nombreRol = row.rol_grupo?.nombre;

      if (nombreGrupo && nombreRol) {
        arr.push({ grupo: nombreGrupo, rol: nombreRol });
      }
      result.set(row.miembro_id, arr);
    }
    return result;
  }

  /**
   * BATCH: Para cada miembro, obtiene la fecha y nombre de actividad más reciente en que
   * realizó el rol dado (asistio: true, actividad realizada).
   * Retorna Map<miembro_id, { fecha: string; nombre_actividad: string }>.
   * Si un miembro no aparece en el mapa, nunca ha realizado el rol.
   */
  async getUltimoUsoRolBatchAsync(
    miembroIds: number[],
    rolId: number,
  ): Promise<Map<number, { fecha: string; nombre_actividad: string; tipo_actividad: string | null }>> {
    if (miembroIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('invitado')
      .select('miembro_id, actividad!inner(fecha, nombre, estado, tipo_actividad(nombre))')
      .in('miembro_id', miembroIds)
      .eq('responsabilidad_id', rolId)
      .eq('asistio', true)
      .eq('actividad.estado', 'realizada');

    if (error) throw error;

    const result = new Map<number, { fecha: string; nombre_actividad: string; tipo_actividad: string | null }>();
    for (const row of (data ?? []) as any[]) {
      const actual = result.get(row.miembro_id);
      if (!actual || row.actividad.fecha > actual.fecha) {
        result.set(row.miembro_id, {
          fecha: row.actividad.fecha,
          nombre_actividad: row.actividad.nombre ?? 'Actividad desconocida',
          tipo_actividad: row.actividad.tipo_actividad?.nombre ?? null,
        });
      }
    }
    return result;
  }

  /**
   * BATCH: Para cada miembro, obtiene las invitaciones confirmadas en actividades programadas
   * dentro de la semana que contiene la fecha dada, incluyendo nombre de actividad y rol.
   * Retorna Map<miembro_id, { actividad: string; rol: string }[]>.
   */
  async getCargaSemanalBatchAsync(
    miembroIds: number[],
    fecha: string,
  ): Promise<Map<number, ServicioSemanaDetalle[]>> {
    if (miembroIds.length === 0) return new Map();

    const inicio = dayjs(fecha).startOf('week').format('YYYY-MM-DD');
    const fin = dayjs(fecha).endOf('week').format('YYYY-MM-DD');

    const { data, error } = await supabase
      .from('invitado')
      .select('miembro_id, actividad!inner(nombre, fecha, estado), responsabilidad_actividad!responsabilidad_id(nombre)')
      .in('miembro_id', miembroIds)
      .eq('estado', 'confirmado')
      .eq('actividad.estado', 'programada')
      .gte('actividad.fecha', inicio)
      .lte('actividad.fecha', fin);

    if (error) throw error;

    const result = new Map<number, ServicioSemanaDetalle[]>();
    for (const row of (data ?? []) as any[]) {
      const arr = result.get(row.miembro_id) ?? [];
      arr.push({
        actividad: row.actividad?.nombre ?? 'Actividad desconocida',
        rol: row.responsabilidad_actividad?.nombre ?? 'Rol desconocido',
        fecha: row.actividad?.fecha ?? '',
      });
      result.set(row.miembro_id, arr);
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
      .select('miembro_id, actividad!inner(nombre, fecha, estado), responsabilidad_actividad!responsabilidad_id(nombre)')
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
        rol: row.responsabilidad_actividad?.nombre ?? 'Rol desconocido',
      });
      result.set(row.miembro_id, arr);
    }
    return result;
  }

  /**
   * BATCH: Obtiene el historial COMPLETO de membresías en grupos de una lista de miembros.
   * Incluye tanto membresías pasadas como vigentes, con cualquier rol.
   * Retorna Map<miembro_id, Array<{ cargo: string; grupo: string; inicio: string; fin: string | null }>>.
   */
  async getHistorialGruposCompletoBatchAsync(
    miembroIds: number[],
  ): Promise<
    Map<
      number,
      Array<{ cargo: string; grupo: string; inicio: string; fin: string | null; es_directiva: boolean }>
    >
  > {
    if (miembroIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('integrante_grupo')
      .select(`
        miembro_id,
        fecha_vinculacion,
        fecha_desvinculacion,
        grupo!inner(nombre),
        rol_grupo!inner(nombre, es_directiva)
      `)
      .in('miembro_id', miembroIds);

    if (error) throw error;

    const result = new Map<
      number,
      Array<{ cargo: string; grupo: string; inicio: string; fin: string | null; es_directiva: boolean }>
    >();
    for (const row of (data ?? []) as any[]) {
      const arr = result.get(row.miembro_id) ?? [];
      
      // Manejo ultra-robusto de objetos anidados de Supabase
      const rolObj = Array.isArray(row.rol_grupo) ? row.rol_grupo[0] : row.rol_grupo;
      const grupoObj = Array.isArray(row.grupo) ? row.grupo[0] : row.grupo;

      arr.push({
        cargo: rolObj?.nombre ?? 'Desconocido',
        grupo: grupoObj?.nombre ?? 'Desconocido',
        inicio: row.fecha_vinculacion,
        fin: row.fecha_desvinculacion,
        es_directiva: !!(rolObj?.es_directiva), // Forzar a booleano
      });
      result.set(row.miembro_id, arr);
    }
    return result;
  }

  /**
   * BATCH: Obtiene un resumen de los servicios realizados (asistidos) por los miembros.
   * Agrupa por tipo de actividad y rol desempeñado.
   * Retorna Map<miembro_id, Array<{ tipo: string; rol: string; cantidad: number }>>.
   */
  async getResumenServiciosBatchAsync(
    miembroIds: number[],
    inicio: string,
    fin: string,
  ): Promise<Map<number, Array<{ tipo: string; rol: string; cantidad: number }>>> {
    if (miembroIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('invitado')
      .select('miembro_id, actividad!inner(tipo_actividad(nombre)), responsabilidad_actividad!responsabilidad_id(nombre)')
      .in('miembro_id', miembroIds)
      .eq('asistio', true)
      .gte('actividad.fecha', inicio)
      .lte('actividad.fecha', fin);

    if (error) throw error;

    const result = new Map<number, Array<{ tipo: string; rol: string; cantidad: number }>>();
    const rawRows = (data ?? []) as any[];
    const counts = new Map<string, number>();

    for (const row of rawRows) {
      const tipo = row.actividad?.tipo_actividad?.nombre ?? 'General';
      const rol = row.responsabilidad_actividad?.nombre ?? 'Colaborador';
      const key = `${row.miembro_id}|${tipo}|${rol}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    for (const [key, cantidad] of counts.entries()) {
      const [miembroIdStr, tipo, rol] = key.split('|');
      const miembroId = Number(miembroIdStr);
      const arr = result.get(miembroId) ?? [];
      arr.push({ tipo, rol, cantidad });
      result.set(miembroId, arr);
    }

    return result;
  }
}


