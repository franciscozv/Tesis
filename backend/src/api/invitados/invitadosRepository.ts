import { isEncargadoDeGrupo } from '@/common/utils/grupoPermissions';
import { supabase } from '@/common/utils/supabaseClient';
import type { Invitado } from './invitadosModel';

/**
 * Filtros para listar invitados
 */
interface InvitadoFilters {
  actividad_id?: number;
  miembro_id?: number;
  estado?: string;
}

/**
 * Repositorio para operaciones de datos de Invitados
 */
export class InvitadosRepository {
  /**
   * Obtiene invitados con filtros opcionales
   */
  async findAllAsync(filters: InvitadoFilters = {}): Promise<Invitado[]> {
    let query = supabase
      .from('invitado')
      .select('*, miembro:miembro_id(id, nombre, apellido), rol:responsabilidad_id(id_responsabilidad, nombre)')
      .order('fecha_invitacion', { ascending: false });

    if (filters.actividad_id) {
      query = query.eq('actividad_id', filters.actividad_id);
    }

    if (filters.miembro_id) {
      query = query.eq('miembro_id', filters.miembro_id);
    }

    if (filters.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Invitado[];
  }

  /**
   * Obtiene un invitado por ID
   */
  async findByIdAsync(id: number): Promise<Invitado | null> {
    const { data, error } = await supabase
      .from('invitado')
      .select('*, miembro:miembro_id(id, nombre, apellido), rol:responsabilidad_id(id_responsabilidad, nombre)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Invitado;
  }

  /**
   * Verifica si una actividad existe
   */
  async actividadExistsAsync(actividadId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('actividad')
      .select('id')
      .eq('id', actividadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Carga estado, fecha y hora_fin de una actividad para validaciones temporales
   */
  async findActividadDatosAsync(
    actividadId: number,
  ): Promise<{ estado: string; fecha: string; hora_fin: string } | null> {
    const { data, error } = await supabase
      .from('actividad')
      .select('estado, fecha, hora_fin')
      .eq('id', actividadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as { estado: string; fecha: string; hora_fin: string };
  }

  /**
   * Verifica si un miembro existe y está activo
   */
  async miembroExistsAsync(miembroId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('miembro')
      .select('id')
      .eq('id', miembroId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Verifica si un miembro es encargado vigente del grupo al que pertenece una actividad
   * (integrante_grupo con ROL_ENCARGADO_ID y fecha_desvinculacion IS NULL).
   */
  async isEncargadoDeActividadAsync(actividadId: number, miembroId: number): Promise<boolean> {
    const { data: actividad, error: actError } = await supabase
      .from('actividad')
      .select('grupo_id')
      .eq('id', actividadId)
      .single();

    if (actError) {
      if (actError.code === 'PGRST116') return false;
      throw actError;
    }
    if (!actividad || actividad.grupo_id === null) return false;

    return isEncargadoDeGrupo(miembroId, actividad.grupo_id);
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
   * Verifica si un miembro ya está invitado a la misma actividad con el mismo rol
   */
  async existsInvitacionDuplicadaAsync(
    actividadId: number,
    miembroId: number,
    rolId: number,
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('invitado')
      .select('id')
      .eq('actividad_id', actividadId)
      .eq('miembro_id', miembroId)
      .eq('responsabilidad_id', rolId);

    if (error) throw error;
    return data !== null && data.length > 0;
  }

  /**
   * Crea una nueva invitación
   */
  async createAsync(
    invitadoData: Omit<
      Invitado,
      'id' | 'estado' | 'motivo_rechazo' | 'asistio' | 'fecha_invitacion' | 'fecha_respuesta'
    >,
    confirmado = false,
  ): Promise<Invitado> {
    const estado = confirmado ? 'confirmado' : 'pendiente';
    const insertData: Record<string, unknown> = {
      ...invitadoData,
      estado,
      asistio: false,
    };

    if (confirmado) {
      insertData.fecha_respuesta = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('invitado')
      .insert(insertData)
      .select('*, miembro:miembro_id(id, nombre, apellido), rol:responsabilidad_id(id_responsabilidad, nombre)')
      .single();

    if (error) throw error;
    return data as Invitado;
  }

  /**
   * Actualiza la respuesta de un invitado (confirmar/rechazar)
   */
  async updateRespuestaAsync(
    id: number,
    estado: string,
    motivo_rechazo?: string,
  ): Promise<Invitado | null> {
    const updateData: Record<string, unknown> = {
      estado,
      fecha_respuesta: new Date().toISOString(),
    };

    if (estado === 'rechazado' && motivo_rechazo) {
      updateData.motivo_rechazo = motivo_rechazo;
    }

    if (estado === 'confirmado') {
      updateData.motivo_rechazo = null;
    }

    const { data, error } = await supabase
      .from('invitado')
      .update(updateData)
      .eq('id', id)
      .select('*, miembro:miembro_id(id, nombre, apellido), rol:responsabilidad_id(id_responsabilidad, nombre)')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Invitado;
  }

  /**
   * Actualiza el campo asistio de un invitado
   */
  async updateAsistenciaAsync(id: number, asistio: boolean): Promise<Invitado | null> {
    const { data, error } = await supabase
      .from('invitado')
      .update({ asistio })
      .eq('id', id)
      .select('*, miembro:miembro_id(id, nombre, apellido), rol:responsabilidad_id(id_responsabilidad, nombre)')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Invitado;
  }

  /**
   * Elimina un invitado
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase.from('invitado').delete().eq('id', id);

    if (error) throw error;
    return true;
  }
}

