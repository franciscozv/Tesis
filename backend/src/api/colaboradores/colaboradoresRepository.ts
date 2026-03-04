import { isEncargadoDeGrupo } from '@/common/utils/grupoPermissions';
import { supabase } from '@/common/utils/supabaseClient';
import type { Colaborador } from './colaboradoresModel';

/**
 * Filtros para listar colaboradores
 */
export interface ColaboradorFilters {
  necesidad_id?: number;
  miembro_id?: number;
  estado?: string;
}

/**
 * Datos de necesidad logística relevantes para validaciones
 */
interface NecesidadInfo {
  id: number;
  cantidad_requerida: number;
  cantidad_cubierta: number;
  estado: string;
}

/**
 * Necesidad logística con datos temporales de su actividad para validaciones en create
 */
interface NecesidadConActividadInfo extends NecesidadInfo {
  actividad: {
    id: number;
    fecha: string;
    hora_fin: string;
    estado: string;
  };
}

/**
 * Repositorio para operaciones de datos de Colaboradores
 */
export class ColaboradoresRepository {
  /**
   * Obtiene colaboradores con filtros opcionales
   */
  async findAllAsync(filters: ColaboradorFilters = {}): Promise<Colaborador[]> {
    let query = supabase
      .from('colaborador')
      .select(
        '*, miembro(id, nombre, apellido), necesidad:necesidad_id(id, descripcion, actividad:actividad_id(id, nombre, fecha, hora_fin, estado))',
      )
      .order('fecha_oferta', { ascending: false });

    if (filters.necesidad_id) {
      query = query.eq('necesidad_id', filters.necesidad_id);
    }

    if (filters.miembro_id) {
      query = query.eq('miembro_id', filters.miembro_id);
    }

    if (filters.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Colaborador[];
  }

  /**
   * Obtiene un colaborador por ID
   */
  async findByIdAsync(id: number): Promise<Colaborador | null> {
    const { data, error } = await supabase
      .from('colaborador')
      .select(
        '*, miembro(id, nombre, apellido), necesidad:necesidad_id(id, descripcion, actividad:actividad_id(id, nombre, fecha, hora_fin, estado))',
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Colaborador;
  }

  /**
   * Verifica si una necesidad logística existe y retorna sus datos
   */
  async getNecesidadInfoAsync(necesidadId: number): Promise<NecesidadInfo | null> {
    const { data, error } = await supabase
      .from('necesidad_logistica')
      .select('id, cantidad_requerida, cantidad_cubierta, estado')
      .eq('id', necesidadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as NecesidadInfo;
  }

  /**
   * Carga necesidad + actividad asociada en una sola consulta para validaciones temporales
   */
  async getNecesidadConActividadAsync(
    necesidadId: number,
  ): Promise<NecesidadConActividadInfo | null> {
    const { data, error } = await supabase
      .from('necesidad_logistica')
      .select(
        'id, cantidad_requerida, cantidad_cubierta, estado, actividad:actividad_id(id, fecha, hora_fin, estado)',
      )
      .eq('id', necesidadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as any as NecesidadConActividadInfo;
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
   * Busca una colaboración existente por miembro y necesidad (cualquier estado)
   */
  async findByMiembroAndNecesidad(
    miembroId: number,
    necesidadId: number,
  ): Promise<Colaborador | null> {
    const { data, error } = await supabase
      .from('colaborador')
      .select('*')
      .eq('miembro_id', miembroId)
      .eq('necesidad_id', necesidadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Colaborador;
  }

  /**
   * Verifica si un miembro ya tiene una oferta pendiente para la misma necesidad
   */
  async existsOfertaPendienteAsync(necesidadId: number, miembroId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('colaborador')
      .select('id')
      .eq('necesidad_id', necesidadId)
      .eq('miembro_id', miembroId)
      .eq('estado', 'pendiente');

    if (error) throw error;
    return data !== null && data.length > 0;
  }

  /**
   * Crea un nuevo colaborador
   */
  async createAsync(
    colaboradorData: Omit<Colaborador, 'id' | 'fecha_oferta' | 'fecha_decision' | 'estado'>,
  ): Promise<Colaborador> {
    const { data, error } = await supabase
      .from('colaborador')
      .insert({ ...colaboradorData, estado: 'pendiente' })
      .select()
      .single();

    if (error) throw error;
    return data as Colaborador;
  }

  /**
   * Actualiza el estado de un colaborador (aceptar/rechazar)
   */
  async updateDecisionAsync(id: number, estado: string): Promise<Colaborador | null> {
    const { data, error } = await supabase
      .from('colaborador')
      .update({
        estado,
        fecha_decision: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Colaborador;
  }

  /**
   * Actualiza la cantidad_cubierta de una necesidad logística
   * y si queda completamente cubierta, cambia el estado a 'cubierta'
   */
  async updateCantidadCubiertaAsync(
    necesidadId: number,
    nuevaCantidadCubierta: number,
    cantidadRequerida: number,
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      cantidad_cubierta: nuevaCantidadCubierta,
    };

    if (nuevaCantidadCubierta >= cantidadRequerida) {
      updateData.estado = 'cubierta';
    }

    const { error } = await supabase
      .from('necesidad_logistica')
      .update(updateData)
      .eq('id', necesidadId);

    if (error) throw error;
  }

  /**
   * Obtiene colaboradores cuya cadena necesidad→actividad→grupo pertenece a la directiva
   * (miembro con membresía vigente con rol es_directiva = true en integrante_cuerpo).
   */
  async findAllForEncargadoAsync(
    filters: ColaboradorFilters,
    liderMiembroId: number,
  ): Promise<Colaborador[]> {
    // 1. Grupos donde el miembro tiene rol de directiva vigente
    const { data: comunions, error: gruposError } = await supabase
      .from('integrante_cuerpo')
      .select('grupo_id, rol_grupo_ministerial!inner(es_directiva)')
      .eq('miembro_id', liderMiembroId)
      .eq('rol_grupo_ministerial.es_directiva', true)
      .is('fecha_desvinculacion', null);

    if (gruposError) throw gruposError;
    if (!comunions || comunions.length === 0) return [];

    const grupoIds = comunions.map((m: { grupo_id: number }) => m.grupo_id);

    // 2. Actividades de esos grupos
    const { data: actividades, error: actError } = await supabase
      .from('actividad')
      .select('id')
      .in('grupo_id', grupoIds);

    if (actError) throw actError;
    if (!actividades || actividades.length === 0) return [];

    const actividadIds = actividades.map((a: { id: number }) => a.id);

    // 3. Necesidades de esas actividades
    const { data: necesidades, error: necError } = await supabase
      .from('necesidad_logistica')
      .select('id')
      .in('actividad_id', actividadIds);

    if (necError) throw necError;
    if (!necesidades || necesidades.length === 0) return [];

    const necesidadIds = necesidades.map((n: { id: number }) => n.id);

    // 4. Colaboradores de esas necesidades con filtros adicionales
    let query = supabase
      .from('colaborador')
      .select(
        '*, miembro(id, nombre, apellido), necesidad:necesidad_id(id, descripcion, actividad:actividad_id(id, nombre, fecha, hora_fin, estado))',
      )
      .in('necesidad_id', necesidadIds)
      .order('fecha_oferta', { ascending: false });

    if (filters.necesidad_id) {
      query = query.eq('necesidad_id', filters.necesidad_id);
    }
    if (filters.miembro_id) {
      query = query.eq('miembro_id', filters.miembro_id);
    }
    if (filters.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Colaborador[];
  }

  /**
   * Verifica si una necesidad pertenece a un grupo donde el miembro es encargado vigente
   * (integrante_cuerpo con ROL_ENCARGADO_ID y fecha_desvinculacion IS NULL).
   */
  async perteneceEncargadoAsync(necesidadId: number, liderMiembroId: number): Promise<boolean> {
    const { data: necesidad, error: necError } = await supabase
      .from('necesidad_logistica')
      .select('actividad_id')
      .eq('id', necesidadId)
      .single();

    if (necError || !necesidad) return false;

    const { data: actividad, error: actError } = await supabase
      .from('actividad')
      .select('grupo_id')
      .eq('id', necesidad.actividad_id)
      .single();

    if (actError || !actividad || actividad.grupo_id === null) return false;

    return isEncargadoDeGrupo(liderMiembroId, actividad.grupo_id);
  }

  /**
   * Rechaza masivamente todas las ofertas 'pendiente' o 'aceptada' vinculadas
   * a una lista de necesidades. Se usa en la cascada de cancelación de actividad.
   * Concatena en 'observaciones' el motivo automático y establece fecha_decision.
   * Retorna la cantidad de filas afectadas.
   */
  async rejectAllByNecesidadesAsync(necesidadIds: number[]): Promise<number> {
    if (necesidadIds.length === 0) return 0;

    // 1. Obtener los colaboradores afectados para conservar sus observaciones originales
    const { data: colaboradores, error: fetchError } = await supabase
      .from('colaborador')
      .select('id, observaciones')
      .in('necesidad_id', necesidadIds)
      .in('estado', ['pendiente', 'aceptada']);

    if (fetchError) throw fetchError;
    if (!colaboradores || colaboradores.length === 0) return 0;

    // 2. Actualizar cada uno individualmente concatenando la observación
    const now = new Date().toISOString();
    let affectedCount = 0;

    for (const col of colaboradores) {
      const originalObs = col.observaciones ? `${col.observaciones} | ` : '';
      const { error: updateError } = await supabase
        .from('colaborador')
        .update({
          estado: 'rechazada',
          fecha_decision: now,
          observaciones: `${originalObs}Cancelación de actividad`,
        })
        .eq('id', col.id);

      if (!updateError) affectedCount++;
    }

    return affectedCount;
  }

  /**
   * Elimina un colaborador
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase.from('colaborador').delete().eq('id', id);

    if (error) throw error;
    return true;
  }
}
