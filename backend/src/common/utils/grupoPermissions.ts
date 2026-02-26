import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { supabase } from '@/common/utils/supabaseClient';

/**
 * ID del rol "Encargado/Líder Principal" en rol_grupo_ministerial.
 * Requerido vía ROL_ENCARGADO_ID en .env.
 */
export const ROL_ENCARGADO_ID = Number(process.env.ROL_ENCARGADO_ID);

if (!ROL_ENCARGADO_ID || Number.isNaN(ROL_ENCARGADO_ID)) {
  throw new Error('Falta ROL_ENCARGADO_ID en .env (debe ser 9)');
}
/**
 * Verifica si un miembro tiene membresía vigente como encargado de un grupo.
 *
 * Un miembro ES encargado si existe en membresia_grupo una fila con:
 *   - miembro_id = miembroId
 *   - grupo_id   = grupoId
 *   - rol_grupo_id = ROL_ENCARGADO_ID
 *   - fecha_desvinculacion IS NULL  (membresía activa)
 *
 * Los administradores deben omitir esta función (bypass total vía rol).
 *
 * TESTS de comportamiento esperado:
 *   - Líder de grupo A llama con grupoId del grupo B → retorna false → 403.
 *   - Admin nunca llama a esta función → siempre puede.
 *   - Lider sin membresía vigente en el grupo → false → 403.
 */
export async function isEncargadoDeGrupo(miembroId: number, grupoId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('membresia_grupo')
    .select('id_membresia')
    .eq('miembro_id', miembroId)
    .eq('grupo_id', grupoId)
    .eq('rol_grupo_id', ROL_ENCARGADO_ID)
    .is('fecha_desvinculacion', null)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

/**
 * Retorna un ServiceResponse 403 si el miembro NO es encargado vigente del grupo.
 * Retorna null si está autorizado (la ejecución puede continuar).
 *
 * Los administradores deben hacer bypass y nunca llamar a esta función.
 *
 * Uso típico en un service:
 *   if (usuario.rol !== 'administrador') {
 *     const forbidden = await requireEncargadoDeGrupo(usuario.miembro_id, grupoId);
 *     if (forbidden) return forbidden;
 *   }
 */
export async function requireEncargadoDeGrupo(
  miembroId: number,
  grupoId: number,
): Promise<ServiceResponse<null> | null> {
  const esEncargado = await isEncargadoDeGrupo(miembroId, grupoId);
  if (!esEncargado) {
    return ServiceResponse.failure(
      'No tienes permiso para gestionar recursos de este grupo',
      null,
      StatusCodes.FORBIDDEN,
    );
  }
  return null;
}
