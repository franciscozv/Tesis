import { hoyCL } from '@/common/utils/dateTime';
import { isEncargadoDeGrupo } from '@/common/utils/grupoPermissions';
import { supabase } from '@/common/utils/supabaseClient';
import type { Actividad, PaginatedActividadesResponse } from './actividadesModel';

/**
 * Filtros para listar actividades
 */
interface ActividadFilters {
  page?: number;
  limit?: number;
  mes?: number;
  anio?: number;
  estado?: string;
  es_publica?: boolean;
  search?: string;
  grupo_id?: number;
}

/**
 * Repositorio para operaciones de datos de Actividades
 */
export class ActividadesRepository {
  /**
   * Obtiene actividades con filtros opcionales
   */
  async findAllAsync(filters: ActividadFilters = {}): Promise<Actividad[]> {
    let query = supabase
      .from('actividad')
      .select('*, tipo_actividad(nombre, color)')
      .order('fecha', { ascending: false });

    if (filters.estado) {
      query = query.eq('estado', filters.estado);
    }

    if (filters.es_publica !== undefined) {
      query = query.eq('es_publica', filters.es_publica);
    }

    if (filters.anio && filters.mes) {
      const startDate = `${filters.anio}-${String(filters.mes).padStart(2, '0')}-01`;
      const lastDay = new Date(filters.anio, filters.mes, 0).getDate();
      const endDate = `${filters.anio}-${String(filters.mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      query = query.gte('fecha', startDate).lte('fecha', endDate);
    } else if (filters.anio) {
      query = query.gte('fecha', `${filters.anio}-01-01`).lte('fecha', `${filters.anio}-12-31`);
    } else if (filters.mes) {
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-${String(filters.mes).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, filters.mes, 0).getDate();
      const endDate = `${currentYear}-${String(filters.mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      query = query.gte('fecha', startDate).lte('fecha', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Actividad[];
  }

  /**
   * Obtiene actividades paginadas con búsqueda y filtros
   */
  async findAllPaginatedAsync(filters: ActividadFilters): Promise<PaginatedActividadesResponse> {
    const { page = 1, limit = 10, search, estado, es_publica, anio, mes, grupo_id } = filters;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('actividad')
      .select('*, tipo_actividad(nombre, color)', { count: 'exact' });

    if (estado) {
      query = query.eq('estado', estado);
    }

    if (es_publica !== undefined) {
      query = query.eq('es_publica', es_publica);
    }

    if (search) {
      query = query.ilike('nombre', `%${search}%`);
    }

    if (grupo_id) {
      query = query.eq('grupo_id', grupo_id);
    }

    if (anio && mes) {
      const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`;
      const lastDay = new Date(anio, mes, 0).getDate();
      const endDate = `${anio}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      query = query.gte('fecha', startDate).lte('fecha', endDate);
    } else if (anio) {
      query = query.gte('fecha', `${anio}-01-01`).lte('fecha', `${anio}-12-31`);
    } else if (mes) {
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-${String(mes).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, mes, 0).getDate();
      const endDate = `${currentYear}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      query = query.gte('fecha', startDate).lte('fecha', endDate);
    }

    const { data, error, count } = await query
      .order('fecha', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: (data as any[]) || [],
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Obtiene id, fecha y hora_fin de todas las actividades en estado 'programada'
   */
  async findProgramadasAsync(): Promise<Pick<Actividad, 'id' | 'fecha' | 'hora_fin'>[]> {
    const { data, error } = await supabase
      .from('actividad')
      .select('id, fecha, hora_fin')
      .eq('estado', 'programada');

    if (error) throw error;
    return data as Pick<Actividad, 'id' | 'fecha' | 'hora_fin'>[];
  }

  /**
   * Actualiza en bloque el estado a 'realizada' para los IDs indicados
   */
  async markManyAsRealizadaAsync(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await supabase
      .from('actividad')
      .update({ estado: 'realizada' })
      .in('id', ids);

    if (error) throw error;
  }

  /**
   * Obtiene solo actividades públicas
   */
  async findPublicasAsync(): Promise<Actividad[]> {
    const { data, error } = await supabase
      .from('actividad')
      .select('*, tipo_actividad(nombre, color), grupo(nombre)')
      .eq('es_publica', true)
      .eq('estado', 'programada')
      .gte('fecha', hoyCL())
      .order('fecha', { ascending: true });

    if (error) throw error;
    return data as Actividad[];
  }

  /**
   * Obtiene una actividad por ID, incluyendo `reprogramacion_de_id` (lookup inverso)
   */
  async findByIdAsync(id: number): Promise<Actividad | null> {
    const [actividadResult, origenResult] = await Promise.all([
      supabase.from('actividad').select('*, tipo_actividad(nombre, color)').eq('id', id).single(),
      supabase.from('actividad').select('id').eq('reprogramada_en_id', id).maybeSingle(),
    ]);

    if (actividadResult.error) {
      if (actividadResult.error.code === 'PGRST116') return null;
      throw actividadResult.error;
    }
    if (origenResult.error) throw origenResult.error;

    return {
      ...(actividadResult.data as Actividad),
      reprogramacion_de_id: origenResult.data?.id ?? null,
    };
  }

  /**
   * Verifica si un tipo de actividad existe y está activo
   */
  async tipoActividadExistsAsync(tipoActividadId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('tipo_actividad')
      .select('id_tipo')
      .eq('id_tipo', tipoActividadId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Verifica si un patrón de actividad existe y está activo
   */
  async patronExistsAsync(patronId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('patron_actividad')
      .select('id')
      .eq('id', patronId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Verifica si un grupo ministerial existe y está activo
   */
  async grupoExistsAsync(grupoId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('grupo')
      .select('id_grupo')
      .eq('id_grupo', grupoId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Verifica si un miembro es encargado vigente de un grupo
   * (integrante_grupo con rol ROL_ENCARGADO_ID y fecha_desvinculacion IS NULL).
   */
  async isEncargadoDeGrupoAsync(grupoId: number, miembroId: number): Promise<boolean> {
    return isEncargadoDeGrupo(miembroId, grupoId);
  }

  /**
   * Verifica si un usuario existe y está activo
   */
  async creadorExistsAsync(creadorId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('miembro')
      .select('id')
      .eq('id', creadorId)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return data !== null;
  }

  /**
   * Crea una nueva actividad
   */
  async createAsync(
    actividadData: Omit<Actividad, 'id' | 'fecha_creacion' | 'estado' | 'motivo_cancelacion'>,
  ): Promise<Actividad> {
    const { data, error } = await supabase
      .from('actividad')
      .insert({ ...actividadData, estado: 'programada' })
      .select()
      .single();

    if (error) throw error;
    return data as Actividad;
  }

  /**
   * Crea múltiples actividades en una sola operación (bulk insert)
   */
  async createManyAsync(
    actividadesData: Omit<Actividad, 'id' | 'fecha_creacion' | 'estado' | 'motivo_cancelacion'>[],
  ): Promise<Actividad[]> {
    const inserts = actividadesData.map((a) => ({ ...a, estado: 'programada' as const }));

    const { data, error } = await supabase.from('actividad').insert(inserts).select();

    if (error) throw error;
    return data as Actividad[];
  }

  /**
   * Actualiza una actividad existente
   */
  async updateAsync(id: number, actividadData: Partial<Actividad>): Promise<Actividad | null> {
    const { data, error } = await supabase
      .from('actividad')
      .update(actividadData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Actividad;
  }

  /**
   * Vincula la actividad original con su sucesora (reprogramación única)
   */
  async setReprogramadaEnAsync(originalId: number, nuevaActividadId: number): Promise<void> {
    const { error } = await supabase
      .from('actividad')
      .update({ reprogramada_en_id: nuevaActividadId })
      .eq('id', originalId);

    if (error) throw error;
  }

  /**
   * Cambia el estado de una actividad
   */
  async updateEstadoAsync(
    id: number,
    estado: string,
    motivo_cancelacion?: string,
  ): Promise<Actividad | null> {
    const updateData: Partial<Actividad> = { estado: estado as Actividad['estado'] };

    if (estado === 'cancelada' && motivo_cancelacion) {
      updateData.motivo_cancelacion = motivo_cancelacion;
    }

    // Limpiar motivo si se cambia a un estado diferente de cancelada
    if (estado !== 'cancelada') {
      updateData.motivo_cancelacion = null;
    }

    const { data, error } = await supabase
      .from('actividad')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Actividad;
  }
}
