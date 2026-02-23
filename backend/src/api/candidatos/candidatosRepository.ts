import { supabase } from '@/common/utils/supabaseClient';

/**
 * Miembro activo con datos para scoring
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
   * Obtiene todos los miembros activos con datos básicos para scoring
   */
  async findMiembrosActivosAsync(): Promise<MiembroBase[]> {
    const { data, error } = await supabase
      .from('miembro')
      .select('id, nombre, apellido, telefono, email, estado_membresia, fecha_ingreso')
      .eq('activo', true);

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
   * Verifica si un rol de grupo (cargo) existe y está activo
   */
  async rolGrupoExistsAsync(cargoId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('rol_grupo_ministerial')
      .select('id_rol_grupo')
      .eq('id_rol_grupo', cargoId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Obtiene el nombre de un rol de grupo (cargo)
   */
  async getRolGrupoNombreAsync(cargoId: number): Promise<string | null> {
    const { data, error } = await supabase
      .from('rol_grupo_ministerial')
      .select('nombre')
      .eq('id_rol_grupo', cargoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data?.nombre ?? null;
  }

  /**
   * Cuenta cuántas veces un miembro ha tenido un rol específico en invitaciones
   */
  async countExperienciaRolAsync(miembroId: number, rolId: number): Promise<number> {
    const { count, error } = await supabase
      .from('invitado')
      .select('*, actividad!inner(estado)', { count: 'exact', head: true })
      .eq('miembro_id', miembroId)
      .eq('rol_id', rolId)
      .eq('asistio', true)
      .eq('actividad.estado', 'realizada');

    if (error) throw error;
    return count ?? 0;
  }

  /**
   * Cuenta cuántas veces un miembro ha tenido un cargo específico en grupos
   * Busca en membresia_grupo (cargo actual) + historial_rol_grupo (cargos anteriores)
   */
  async countExperienciaCargoAsync(miembroId: number, cargoId: number): Promise<number> {
    // Contar membresías activas con ese cargo
    const { count: membresiaCount, error: error1 } = await supabase
      .from('membresia_grupo')
      .select('*', { count: 'exact', head: true })
      .eq('miembro_id', miembroId)
      .eq('rol_grupo_id', cargoId);

    if (error1) throw error1;

    // Contar en historial donde el cargo fue asignado (rol_grupo_nuevo)
    // Necesitamos unir con membresia_grupo para filtrar por miembro_id
    const { data: membresias, error: error2 } = await supabase
      .from('membresia_grupo')
      .select('id_membresia')
      .eq('miembro_id', miembroId);

    if (error2) throw error2;

    let historialCount = 0;
    if (membresias && membresias.length > 0) {
      const membresiaIds = membresias.map((m) => m.id_membresia);

      const { count, error: error3 } = await supabase
        .from('historial_rol_grupo')
        .select('*', { count: 'exact', head: true })
        .in('miembro_grupo_id', membresiaIds)
        .eq('rol_grupo_nuevo', cargoId);

      if (error3) throw error3;
      historialCount = count ?? 0;
    }

    return (membresiaCount ?? 0) + historialCount;
  }

  /**
   * Obtiene datos de asistencia de un miembro en los últimos 12 meses
   * Retorna { totalConfirmadas, asistioReal }
   */
  async getAsistenciaUltimoAnioAsync(
    miembroId: number,
    fechaReferencia: string,
  ): Promise<{ totalConfirmadas: number; asistioReal: number }> {
    // Calcular fecha de hace 12 meses
    const fechaRef = new Date(fechaReferencia);
    const fechaInicio = new Date(fechaRef);
    fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
    const fechaInicioStr = fechaInicio.toISOString().split('T')[0];

    // Total confirmadas en el último año (solo actividades realizadas)
    const { count: totalConfirmadas, error: error1 } = await supabase
      .from('invitado')
      .select('*, actividad!inner(fecha, estado)', { count: 'exact', head: true })
      .eq('miembro_id', miembroId)
      .eq('estado', 'confirmado')
      .eq('actividad.estado', 'realizada')
      .gte('actividad.fecha', fechaInicioStr)
      .lte('actividad.fecha', fechaReferencia);

    if (error1) throw error1;

    // Confirmadas Y asistió (solo actividades realizadas)
    const { count: asistioReal, error: error2 } = await supabase
      .from('invitado')
      .select('*, actividad!inner(fecha, estado)', { count: 'exact', head: true })
      .eq('miembro_id', miembroId)
      .eq('estado', 'confirmado')
      .eq('asistio', true)
      .eq('actividad.estado', 'realizada')
      .gte('actividad.fecha', fechaInicioStr)
      .lte('actividad.fecha', fechaReferencia);

    if (error2) throw error2;

    return {
      totalConfirmadas: totalConfirmadas ?? 0,
      asistioReal: asistioReal ?? 0,
    };
  }

  /**
   * Cuenta cuántos grupos activos tiene un miembro (membresías sin fecha_desvinculacion)
   */
  async countGruposActivosAsync(miembroId: number): Promise<number> {
    const { count, error } = await supabase
      .from('membresia_grupo')
      .select('*', { count: 'exact', head: true })
      .eq('miembro_id', miembroId)
      .is('fecha_desvinculacion', null);

    if (error) throw error;
    return count ?? 0;
  }

  /**
   * Verifica si un miembro tiene conflictos de horario en una fecha dada
   * (actividades programadas donde está confirmado)
   */
  async tieneConflictoHorarioAsync(miembroId: number, fecha: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('invitado')
      .select('*, actividad!inner(fecha, estado)', { count: 'exact', head: true })
      .eq('miembro_id', miembroId)
      .eq('estado', 'confirmado')
      .eq('actividad.fecha', fecha)
      .eq('actividad.estado', 'programada');

    if (error) throw error;
    return (count ?? 0) > 0;
  }
}
