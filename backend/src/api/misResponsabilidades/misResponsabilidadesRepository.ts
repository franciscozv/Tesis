import { supabase } from '@/common/utils/supabaseClient';

/**
 * Repositorio para consultas de "Mis Responsabilidades"
 * Combina invitaciones + colaboraciones aceptadas con JOINs completos
 */
export class MisResponsabilidadesRepository {
  /**
   * Obtiene invitaciones (pendientes y confirmadas) de un miembro
   * con datos completos de actividad, tipo, grupo y rol
   */
  async findInvitacionesByMiembroAsync(miembroId: number) {
    const { data, error } = await supabase
      .from('invitado')
      .select(`
        id, miembro_id, responsabilidad_id, estado, fecha_invitacion,
        actividad!inner(id, nombre, fecha, hora_inicio, hora_fin, estado,
          grupo(id_grupo, nombre),
          tipo_actividad(id_tipo, nombre)
        ),
        responsabilidad_actividad(id_responsabilidad, nombre)
      `)
      .eq('miembro_id', miembroId)
      .in('estado', ['pendiente', 'confirmado']);

    if (error) throw error;
    return data;
  }

  /**
   * Obtiene colaboraciones aceptadas de un miembro
   * con datos completos de necesidad, actividad, tipo y grupo
   */
  async findColaboracionesByMiembroAsync(miembroId: number) {
    const { data, error } = await supabase
      .from('colaborador')
      .select(`
        id, miembro_id, cantidad_ofrecida, observaciones, estado,
        necesidad_logistica!inner(id, descripcion,
          actividad!inner(id, nombre, fecha, hora_inicio, hora_fin, estado,
            grupo(id_grupo, nombre),
            tipo_actividad(id_tipo, nombre)
          ),
          tipo_necesidad_logistica(id_tipo, nombre)
        )
      `)
      .eq('miembro_id', miembroId)
      .eq('estado', 'aceptada');

    if (error) throw error;
    return data;
  }
}

