import { isEncargadoDeGrupo } from '@/common/utils/grupoPermissions';
import { supabase } from '@/common/utils/supabaseClient';
import type { Colaborador } from './colaboradoresModel';

/**
 * Filtros para listar colaboradores
 */
export interface ColaboradorFilters {
  necesidad_id?: number;
  miembro_id?: number;
}

/**
 * Datos de necesidad material relevantes para validaciones
 */
interface NecesidadInfo {
  id: number;
  cantidad_requerida: number;
  cantidad_cubierta: number;
  estado: string;
}

/**
 * Necesidad material con datos de su actividad para validaciones
 */
interface NecesidadConActividadInfo extends NecesidadInfo {
  descripcion?: string;
  unidad_medida?: string;
  actividad: {
    id: number;
    nombre: string;
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
      .order('fecha_compromiso', { ascending: false });

    if (filters.necesidad_id) {
      query = query.eq('necesidad_id', filters.necesidad_id);
    }

    if (filters.miembro_id) {
      query = query.eq('miembro_id', filters.miembro_id);
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
   * Verifica si una necesidad material existe y retorna sus datos
   */
  async getNecesidadInfoAsync(necesidadId: number): Promise<NecesidadInfo | null> {
    const { data, error } = await supabase
      .from('necesidad')
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
   * Carga necesidad + actividad asociada en una sola consulta para validaciones
   */
  async getNecesidadConActividadAsync(
    necesidadId: number,
  ): Promise<NecesidadConActividadInfo | null> {
    const { data, error } = await supabase
      .from('necesidad')
      .select(
        'id, descripcion, cantidad_requerida, cantidad_cubierta, estado, actividad:actividad_id(id, nombre, fecha, hora_fin, estado)',
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
   * Busca un compromiso existente por miembro y necesidad
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
   * Crea un nuevo compromiso de colaboración
   */
  async createAsync(
    colaboradorData: Omit<Colaborador, 'id' | 'fecha_compromiso' | 'cumplio'>,
  ): Promise<Colaborador> {
    const { data, error } = await supabase
      .from('colaborador')
      .insert({ ...colaboradorData, cumplio: false })
      .select('*, miembro:miembro_id(id, nombre, apellido)')
      .single();

    if (error) throw error;
    return data as Colaborador;
  }

  /**
   * Actualiza el campo cumplio de un colaborador
   */
  async updateCumplioAsync(id: number, cumplio: boolean): Promise<Colaborador | null> {
    const { data, error } = await supabase
      .from('colaborador')
      .update({ cumplio })
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
   * Actualiza la cantidad_cubierta de una necesidad material
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
      .from('necesidad')
      .update(updateData)
      .eq('id', necesidadId);

    if (error) throw error;
  }

  /**
   * Obtiene colaboradores cuya cadena necesidad→actividad→grupo pertenece a la directiva
   */
  async findAllForEncargadoAsync(
    filters: ColaboradorFilters,
    liderMiembroId: number,
  ): Promise<Colaborador[]> {
    const { data: comunions, error: gruposError } = await supabase
      .from('integrante_grupo')
      .select('grupo_id, rol_grupo!inner(es_directiva)')
      .eq('miembro_id', liderMiembroId)
      .eq('rol_grupo.es_directiva', true)
      .is('fecha_desvinculacion', null);

    if (gruposError) throw gruposError;
    if (!comunions || comunions.length === 0) return [];

    const grupoIds = comunions.map((m: { grupo_id: number }) => m.grupo_id);

    const { data: actividades, error: actError } = await supabase
      .from('actividad')
      .select('id')
      .in('grupo_id', grupoIds);

    if (actError) throw actError;
    if (!actividades || actividades.length === 0) return [];

    const actividadIds = actividades.map((a: { id: number }) => a.id);

    const { data: necesidades, error: necError } = await supabase
      .from('necesidad')
      .select('id')
      .in('actividad_id', actividadIds);

    if (necError) throw necError;
    if (!necesidades || necesidades.length === 0) return [];

    const necesidadIds = necesidades.map((n: { id: number }) => n.id);

    let query = supabase
      .from('colaborador')
      .select(
        '*, miembro(id, nombre, apellido), necesidad:necesidad_id(id, descripcion, actividad:actividad_id(id, nombre, fecha, hora_fin, estado))',
      )
      .in('necesidad_id', necesidadIds)
      .order('fecha_compromiso', { ascending: false });

    if (filters.necesidad_id) {
      query = query.eq('necesidad_id', filters.necesidad_id);
    }
    if (filters.miembro_id) {
      query = query.eq('miembro_id', filters.miembro_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Colaborador[];
  }

  /**
   * Verifica si una necesidad pertenece a un grupo donde el miembro es encargado vigente
   */
  async perteneceEncargadoAsync(necesidadId: number, liderMiembroId: number): Promise<boolean> {
    const { data: necesidad, error: necError } = await supabase
      .from('necesidad')
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
   * Elimina todos los compromisos vinculados a una lista de necesidades (cascade de cancelación).
   * Retorna los miembro_ids afectados para notificaciones.
   */
  async deleteAllByNecesidadesAsync(
    necesidadIds: number[],
  ): Promise<{ count: number; miembroIds: number[] }> {
    if (necesidadIds.length === 0) return { count: 0, miembroIds: [] };

    const { data: colaboradores, error: fetchError } = await supabase
      .from('colaborador')
      .select('id, miembro_id')
      .in('necesidad_id', necesidadIds);

    if (fetchError) throw fetchError;
    if (!colaboradores || colaboradores.length === 0) return { count: 0, miembroIds: [] };

    const miembroIds = colaboradores.map((c: { miembro_id: number }) => c.miembro_id);
    const ids = colaboradores.map((c: { id: number }) => c.id);

    const { error: deleteError } = await supabase
      .from('colaborador')
      .delete()
      .in('id', ids);

    if (deleteError) throw deleteError;

    return { count: ids.length, miembroIds: [...new Set(miembroIds)] };
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
