import type {
  EncargadoActual,
  GrupoMinisterial,
} from '@/api/gruposMinisteriales/grupoMinisterialModel';
import { ROL_ENCARGADO_ID } from '@/common/utils/grupoPermissions';
import { supabase } from '@/common/utils/supabaseClient';

/**
 * Repository para gestionar operaciones de base de datos de Grupos Ministeriales
 */
export class GrupoMinisterialRepository {
  /**
   * Obtiene todos los grupos ministeriales activos
   */
  async findAllAsync(): Promise<GrupoMinisterial[]> {
    const { data, error } = await supabase
      .from('grupo_ministerial')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as GrupoMinisterial[]) || [];
  }

  /**
   * Busca un grupo ministerial por ID (solo activos)
   */
  async findByIdAsync(id: number): Promise<GrupoMinisterial | null> {
    const { data, error } = await supabase
      .from('grupo_ministerial')
      .select('*')
      .eq('id_grupo', id)
      .eq('activo', true)
      .single();

    if (error) {
      // PGRST116 = No rows found
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as GrupoMinisterial;
  }

  /**
   * Crea un nuevo grupo ministerial
   */
  async createAsync(
    grupoData: Omit<GrupoMinisterial, 'id_grupo' | 'created_at' | 'updated_at' | 'activo'>,
  ): Promise<GrupoMinisterial> {
    const { data, error } = await supabase
      .from('grupo_ministerial')
      .insert([{ ...grupoData, activo: true }])
      .select()
      .single();

    if (error) throw error;
    return data as GrupoMinisterial;
  }

  /**
   * Actualiza un grupo ministerial existente (solo activos)
   */
  async updateAsync(
    id: number,
    grupoData: Partial<GrupoMinisterial>,
  ): Promise<GrupoMinisterial | null> {
    const { data, error } = await supabase
      .from('grupo_ministerial')
      .update(grupoData)
      .eq('id_grupo', id)
      .eq('activo', true)
      .select()
      .single();

    if (error) {
      // PGRST116 = No rows found
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as GrupoMinisterial;
  }

  /**
   * Elimina lógicamente un grupo ministerial (soft delete)
   */
  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('grupo_ministerial')
      .update({ activo: false })
      .eq('id_grupo', id);

    if (error) throw error;
    return true;
  }

  /**
   * Verifica si un grupo ministerial tiene miembros activos
   * (miembros con fecha_desvinculacion IS NULL en membresia_grupo)
   */
  async hasActiveMembersAsync(grupo_id: number): Promise<boolean> {
    const { count, error } = await supabase
      .from('membresia_grupo')
      .select('*', { count: 'exact', head: true })
      .eq('grupo_id', grupo_id)
      .is('fecha_desvinculacion', null);

    if (error) throw error;

    // Si count es mayor a 0, tiene miembros activos
    return (count ?? 0) > 0;
  }

  /**
   * Verifica que un miembro exista, esté activo y en estado plena_comunion
   * (para validación de líder principal)
   */
  async validateLiderAsync(miembro_id: number): Promise<{
    exists: boolean;
    isActive: boolean;
    isPlenaComunion: boolean;
  }> {
    const { data, error } = await supabase
      .from('miembro')
      .select('id, activo, estado_membresia')
      .eq('id', miembro_id)
      .single();

    if (error) {
      // PGRST116 = No rows found
      if (error.code === 'PGRST116') {
        return { exists: false, isActive: false, isPlenaComunion: false };
      }
      throw error;
    }

    return {
      exists: true,
      isActive: data.activo === true,
      isPlenaComunion: data.estado_membresia === 'plena_comunion',
    };
  }

  /**
   * Devuelve el encargado activo (ROL_ENCARGADO_ID, fecha_desvinculacion IS NULL)
   * de un grupo específico, o null si no tiene ninguno.
   */
  async getEncargadoActualAsync(grupo_id: number): Promise<EncargadoActual | null> {
    const { data: membresia, error } = await supabase
      .from('membresia_grupo')
      .select('miembro_id')
      .eq('grupo_id', grupo_id)
      .eq('rol_grupo_id', ROL_ENCARGADO_ID)
      .is('fecha_desvinculacion', null)
      .maybeSingle();

    if (error) throw error;
    if (!membresia) return null;

    const { data: miembro, error: mError } = await supabase
      .from('miembro')
      .select('id, nombre, apellido')
      .eq('id', membresia.miembro_id)
      .single();

    if (mError) throw mError;
    if (!miembro) return null;

    return {
      miembro_id: membresia.miembro_id,
      nombre: miembro.nombre,
      apellido: miembro.apellido,
    };
  }

  /**
   * Batch: devuelve un Map<grupo_id, EncargadoActual> para un conjunto de grupos.
   * Solo 2 queries en total, sin N+1.
   */
  async getEncargadosForGruposAsync(grupo_ids: number[]): Promise<Map<number, EncargadoActual>> {
    if (grupo_ids.length === 0) return new Map();

    const { data: membresias, error } = await supabase
      .from('membresia_grupo')
      .select('grupo_id, miembro_id')
      .in('grupo_id', grupo_ids)
      .eq('rol_grupo_id', ROL_ENCARGADO_ID)
      .is('fecha_desvinculacion', null);

    if (error) throw error;
    if (!membresias || membresias.length === 0) return new Map();

    const miembroIds = [...new Set(membresias.map((m: { miembro_id: number }) => m.miembro_id))];

    const { data: miembros, error: mError } = await supabase
      .from('miembro')
      .select('id, nombre, apellido')
      .in('id', miembroIds);

    if (mError) throw mError;

    const miembroMap = new Map(
      (miembros ?? []).map((m: { id: number; nombre: string; apellido: string }) => [m.id, m]),
    );

    const result = new Map<number, EncargadoActual>();
    for (const m of membresias as { grupo_id: number; miembro_id: number }[]) {
      const miembro = miembroMap.get(m.miembro_id);
      if (miembro) {
        result.set(m.grupo_id, {
          miembro_id: m.miembro_id,
          nombre: miembro.nombre,
          apellido: miembro.apellido,
        });
      }
    }
    return result;
  }

  /**
   * Busca el ID de un rol activo en rol_grupo_ministerial por nombre (case-insensitive).
   * Retorna null si no existe.
   */
  async findRolBaseIdAsync(nombre: string): Promise<number | null> {
    const { data, error } = await supabase
      .from('rol_grupo_ministerial')
      .select('id_rol_grupo')
      .ilike('nombre', nombre)
      .eq('activo', true)
      .maybeSingle();

    if (error) throw error;
    return data ? (data.id_rol_grupo as number) : null;
  }

  /**
   * Obtiene estado de un rol de grupo por ID.
   */
  async getRolStatusAsync(
    rolId: number,
  ): Promise<{ exists: boolean; activo: boolean; requiere_plena_comunion: boolean }> {
    const { data, error } = await supabase
      .from('rol_grupo_ministerial')
      .select('activo, requiere_plena_comunion')
      .eq('id_rol_grupo', rolId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return { exists: false, activo: false, requiere_plena_comunion: false };
    }

    return {
      exists: true,
      activo: data.activo === true,
      requiere_plena_comunion: data.requiere_plena_comunion === true,
    };
  }

  /**
   * Asigna (o cambia) el encargado de un grupo:
   *   a) Obtiene el encargado vigente actual (si existe).
   *   b) Cierra esa membresía (fecha_desvinculacion).
   *   c) Inserta nueva membresía con ROL_ENCARGADO_ID activa.
   *   d) Si había encargado anterior distinto del nuevo, le inserta una membresía
   *      base (idRolMiembro) siempre que no tenga ya una membresía activa en el grupo.
   *   e) Retorna el nuevo EncargadoActual.
   *
   * No es una transacción atómica de BD; los pasos son secuenciales.
   */
  async asignarEncargadoAsync(
    grupo_id: number,
    nuevo_miembro_id: number,
    idRolMiembro: number,
    fecha?: string,
  ): Promise<EncargadoActual> {
    const fechaEfectiva = fecha ? new Date(fecha).toISOString() : new Date().toISOString();

    // a) Obtener miembro_id del encargado vigente actual
    const { data: encargadoVigente, error: getError } = await supabase
      .from('membresia_grupo')
      .select('miembro_id')
      .eq('grupo_id', grupo_id)
      .eq('rol_grupo_id', ROL_ENCARGADO_ID)
      .is('fecha_desvinculacion', null)
      .maybeSingle();

    if (getError) throw getError;
    const anteriorMiembroId: number | null = encargadoVigente?.miembro_id ?? null;

    // b) Cerrar encargado vigente
    const { error: closeError } = await supabase
      .from('membresia_grupo')
      .update({ fecha_desvinculacion: fechaEfectiva })
      .eq('grupo_id', grupo_id)
      .eq('rol_grupo_id', ROL_ENCARGADO_ID)
      .is('fecha_desvinculacion', null);

    if (closeError) throw closeError;

    // c) Insertar nueva membresía encargado
    const { error: insertError } = await supabase.from('membresia_grupo').insert({
      miembro_id: nuevo_miembro_id,
      grupo_id,
      rol_grupo_id: ROL_ENCARGADO_ID,
      fecha_vinculacion: fechaEfectiva,
    });

    if (insertError) throw insertError;

    // d) Reinsertar encargado anterior con rol base si es distinto del nuevo
    if (anteriorMiembroId !== null && anteriorMiembroId !== nuevo_miembro_id) {
      const { data: memActiva, error: checkError } = await supabase
        .from('membresia_grupo')
        .select('id_membresia')
        .eq('miembro_id', anteriorMiembroId)
        .eq('grupo_id', grupo_id)
        .is('fecha_desvinculacion', null)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!memActiva) {
        const { error: insertMiembroError } = await supabase.from('membresia_grupo').insert({
          miembro_id: anteriorMiembroId,
          grupo_id,
          rol_grupo_id: idRolMiembro,
          fecha_vinculacion: fechaEfectiva,
        });
        if (insertMiembroError) throw insertMiembroError;
      }
    }

    // e) Retornar encargado_actual actualizado
    const encargado = await this.getEncargadoActualAsync(grupo_id);
    if (!encargado) throw new Error('No se pudo obtener el nuevo encargado tras la asignación.');
    return encargado;
  }

  /**
   * Obtiene los grupos que un encargado puede gestionar.
   * Retorna grupos donde el miembro tiene membresía vigente con ROL_ENCARGADO_ID
   * en membresia_grupo (fecha_desvinculacion IS NULL).
   */
  async findGruposByEncargadoAsync(miembro_id: number): Promise<GrupoMinisterial[]> {
    // Obtener grupo_ids donde el miembro es encargado vigente
    const { data: membresias, error: memError } = await supabase
      .from('membresia_grupo')
      .select('grupo_id')
      .eq('miembro_id', miembro_id)
      .eq('rol_grupo_id', ROL_ENCARGADO_ID)
      .is('fecha_desvinculacion', null);

    if (memError) throw memError;
    if (!membresias || membresias.length === 0) return [];

    const grupoIds = membresias.map((m: { grupo_id: number }) => m.grupo_id);

    const { data, error } = await supabase
      .from('grupo_ministerial')
      .select('*')
      .in('id_grupo', grupoIds)
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as GrupoMinisterial[]) || [];
  }
}

export const grupoMinisterialRepository = new GrupoMinisterialRepository();
