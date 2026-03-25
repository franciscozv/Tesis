import { isEncargadoDeGrupo } from '@/common/utils/grupoPermissions';
import { supabase } from '@/common/utils/supabaseClient';
import { logger } from '@/server';
import type { NecesidadAbierta, NecesidadLogistica } from './necesidadesLogisticasModel';

/**
 * Filtros para listar necesidades logísticas
 */
interface NecesidadFilters {
  estado?: string;
  actividad_id?: number;
}

/**
 * Repositorio para operaciones de datos de Necesidades Logísticas
 */
export class NecesidadesLogisticasRepository {
  /**
   * Obtiene necesidades logísticas con filtros opcionales
   */
  async findAllAsync(filters: NecesidadFilters = {}): Promise<NecesidadLogistica[]> {
    let query = supabase
      .from('necesidad')
      .select('*')
      .order('fecha_registro', { ascending: false });

    if (filters.estado) {
      query = query.eq('estado', filters.estado);
    }

    if (filters.actividad_id) {
      query = query.eq('actividad_id', filters.actividad_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as NecesidadLogistica[];
  }

  /**
   * Obtiene necesidades logísticas que pertenecen a actividades de grupos
   * donde el miembro tiene membresía vigente con rol de directiva (es_directiva = true).
   */
  async findAllForEncargadoAsync(
    filters: NecesidadFilters = {},
    liderMiembroId: number,
  ): Promise<NecesidadLogistica[]> {
    const { data: comunions, error: gruposError } = await supabase
      .from('integrante_grupo')
      .select('grupo_id, rol_grupo!inner(es_directiva)')
      .eq('miembro_id', liderMiembroId)
      .eq('rol_grupo.es_directiva', true)
      .is('fecha_desvinculacion', null);

    if (gruposError) throw gruposError;
    if (!comunions || comunions.length === 0) return [];

    const grupoIds = comunions.map((m: { grupo_id: number }) => m.grupo_id);

    const { data: actividades, error: actividadesError } = await supabase
      .from('actividad')
      .select('id')
      .in('grupo_id', grupoIds);

    if (actividadesError) throw actividadesError;
    if (!actividades || actividades.length === 0) return [];

    const actividadIds = actividades.map((a: { id: number }) => a.id);

    let query = supabase
      .from('necesidad')
      .select('*')
      .in('actividad_id', actividadIds)
      .order('fecha_registro', { ascending: false });

    if (filters.estado) {
      query = query.eq('estado', filters.estado);
    }

    if (filters.actividad_id) {
      query = query.eq('actividad_id', filters.actividad_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as NecesidadLogistica[];
  }

  /**
   * Obtiene necesidades abiertas de actividades en los próximos 60 días,
   * incluyendo datos de actividad y tipo de necesidad.
   */
  async findAbiertasProximasAsync(): Promise<NecesidadAbierta[]> {
    const hoy = new Date().toISOString().split('T')[0];
    const en60Dias = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Paso 1: obtener IDs de actividades programadas en los próximos 60 días
    const { data: actividades, error: actError } = await supabase
      .from('actividad')
      .select('id')
      .eq('estado', 'programada')
      .gte('fecha', hoy)
      .lte('fecha', en60Dias);

    if (actError) throw actError;
    if (!actividades || actividades.length === 0) return [];

    const actividadIds = actividades.map((a) => a.id);

    // Paso 2: obtener necesidades con datos de actividad y tipo embebidos
    const { data, error } = await supabase
      .from('necesidad')
      .select(
        `id, actividad_id, tipo_necesidad_id, descripcion,
         cantidad_requerida, unidad_medida, cantidad_cubierta, estado, fecha_registro,
         actividad:actividad(id, nombre, fecha, hora_inicio, hora_fin, lugar),
         tipo_necesidad:tipo_necesidad(id_tipo, nombre)`,
      )
      .eq('estado', 'abierta')
      .in('actividad_id', actividadIds)
      .order('fecha_registro', { ascending: false });

    if (error) {
      logger.error({ err: error }, 'findAbiertasProximasAsync error');
      return [];
    }
    return (data ?? []) as unknown as NecesidadAbierta[];
  }

  /**
   * Obtiene una necesidad logística por ID
   */
  async findByIdAsync(id: number): Promise<NecesidadLogistica | null> {
    const { data, error } = await supabase
      .from('necesidad')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as NecesidadLogistica;
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
   * Verifica si un tipo de necesidad existe y está activo
   */
  async tipoNecesidadExistsAsync(tipoNecesidadId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('tipo_necesidad')
      .select('id_tipo')
      .eq('id_tipo', tipoNecesidadId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Crea una nueva necesidad logística
   */
  async createAsync(
    necesidadData: Omit<NecesidadLogistica, 'id' | 'fecha_registro' | 'estado'>,
  ): Promise<NecesidadLogistica> {
    const { data, error } = await supabase
      .from('necesidad')
      .insert({ ...necesidadData, estado: 'abierta' })
      .select()
      .single();

    if (error) throw error;
    return data as NecesidadLogistica;
  }

  /**
   * Actualiza una necesidad logística existente
   */
  async updateAsync(
    id: number,
    necesidadData: Partial<NecesidadLogistica>,
  ): Promise<NecesidadLogistica | null> {
    const { data, error } = await supabase
      .from('necesidad')
      .update(necesidadData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as NecesidadLogistica;
  }

  /**
   * Cambia el estado de una necesidad logística
   */
  async updateEstadoAsync(id: number, estado: string): Promise<NecesidadLogistica | null> {
    const { data, error } = await supabase
      .from('necesidad')
      .update({ estado })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as NecesidadLogistica;
  }

  /**
   * Suma la cantidad_comprometida de colaboradores para una necesidad
   */
  async sumCantidadCompromisosAsync(necesidadId: number): Promise<number> {
    const { data, error } = await supabase
      .from('colaborador')
      .select('cantidad_comprometida')
      .eq('necesidad_id', necesidadId);

    if (error) throw error;
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, c) => sum + (c.cantidad_comprometida as number), 0);
  }

  /**
   * Indica si existe al menos una colaboración para una necesidad
   */
  async hasColaboracionesAsync(necesidadId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('colaborador')
      .select('id')
      .eq('necesidad_id', necesidadId)
      .limit(1);

    if (error) throw error;
    return !!data && data.length > 0;
  }

  /**
   * Cierra masivamente todas las necesidades no-cerradas de una actividad.
   * Se usa cuando una actividad pasa a estado 'cancelada'.
   * Retorna los IDs de las filas afectadas (y su conteo) para cascada hacia colaboradores.
   */
  async closeAllByActividadAsync(actividadId: number): Promise<{ count: number; ids: number[] }> {
    const { data, error } = await supabase
      .from('necesidad')
      .update({ estado: 'cancelada' })
      .eq('actividad_id', actividadId)
      .neq('estado', 'cerrada')
      .neq('estado', 'cancelada')
      .select('id');

    if (error) throw error;
    const ids = (data ?? []).map((row: { id: number }) => row.id);
    return { count: ids.length, ids };
  }

  /**
   * Elimina una necesidad logística
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase.from('necesidad').delete().eq('id', id);

    if (error) throw error;
    return true;
  }
}
