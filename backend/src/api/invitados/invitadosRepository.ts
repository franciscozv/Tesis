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
      .select('*')
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
      .select('*')
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
   * Verifica si un miembro ya está invitado a la misma actividad con el mismo rol
   */
  async existsInvitacionDuplicadaAsync(
    actividadId: number,
    miembroId: number,
    rolId: number
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('invitado')
      .select('id')
      .eq('actividad_id', actividadId)
      .eq('miembro_id', miembroId)
      .eq('rol_id', rolId);

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
      .select()
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
    motivo_rechazo?: string
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
      .select()
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
      .select()
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
    const { error } = await supabase
      .from('invitado')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}
