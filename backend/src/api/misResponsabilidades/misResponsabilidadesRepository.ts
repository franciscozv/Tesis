import { supabase } from '@/common/utils/supabaseClient';
import { logger } from '@/server';

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
        actividad:actividad_id!inner(id, nombre, fecha, hora_inicio, hora_fin, estado,
          grupo:grupo_id(id_grupo, nombre),
          tipo_actividad:tipo_actividad_id(id_tipo, nombre)
        ),
        responsabilidad_actividad:responsabilidad_id(id_responsabilidad, nombre)
      `)
      .eq('miembro_id', miembroId)
      .in('estado', ['pendiente', 'confirmado', 'cancelado']);

    if (error) {
      logger.error({ err: error }, `findInvitacionesByMiembro error (miembroId=${miembroId})`);
      return [];
    }
    return data ?? [];
  }

  /**
   * Obtiene colaboraciones aceptadas de un miembro
   * con datos completos de necesidad, actividad, tipo y grupo
   */
  async findColaboracionesByMiembroAsync(miembroId: number) {
    const { data, error } = await supabase
      .from('colaborador')
      .select(`
        id, miembro_id, cantidad_comprometida, observaciones, cumplio,
        necesidad:necesidad_id!inner(id, descripcion,
          actividad:actividad_id!inner(id, nombre, fecha, hora_inicio, hora_fin, estado,
            grupo:grupo_id(id_grupo, nombre),
            tipo_actividad:tipo_actividad_id(id_tipo, nombre)
          ),
          tipo_necesidad:tipo_necesidad_id(id_tipo, nombre)
        )
      `)
      .eq('miembro_id', miembroId);

    if (error) {
      logger.error({ err: error }, `findColaboracionesByMiembro error (miembroId=${miembroId})`);
      return [];
    }
    return data ?? [];
  }
}
