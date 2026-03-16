import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { supabase } from '@/common/utils/supabaseClient';

/**
 * Verifica si un miembro tiene privilegios de directiva en un grupo.
 *
 * Un miembro TIENE privilegios si existe en integrante_grupo una fila con:
 *   - miembro_id = miembroId
 *   - grupo_id   = grupoId
 *   - fecha_desvinculacion IS NULL  (membresía activa)
 *   - rol_grupo.es_directiva = true
 *
 * Los administradores deben omitir esta función (bypass total vía rol).
 *
 * TESTS de comportamiento esperado:
 *   - Miembro con rol es_directiva=false (Integrante/Vocal) → retorna false → 403.
 *   - Secretario o Tesorero activo en el grupo → retorna true → autorizado.
 *   - Admin nunca llama a esta función → siempre puede.
 */
export async function isEncargadoDeGrupo(miembroId: number, grupoId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('integrante_grupo')
    .select('rol_grupo!inner(es_directiva)')
    .eq('miembro_id', miembroId)
    .eq('grupo_id', grupoId)
    .is('fecha_desvinculacion', null);

  if (error) throw error;
  if (!data || data.length === 0) return false;

  return (data as any[]).some((row) => row.rol_grupo.es_directiva === true);
}

/**
 * Verifica si un miembro tiene privilegios de directiva en AL MENOS un grupo.
 * Usado para decidir si puede acceder a recursos globales (ej: lista de miembros).
 */
export async function isDirectivaEnAlgunGrupo(miembroId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('integrante_grupo')
    .select('rol_grupo!inner(es_directiva)')
    .eq('miembro_id', miembroId)
    .is('fecha_desvinculacion', null);

  if (error) throw error;
  if (!data || data.length === 0) return false;

  return (data as any[]).some((row) => row.rol_grupo.es_directiva === true);
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

