import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import { INVITADOS_QUERY_KEY } from './use-invitados-actividad';

export interface AsignarResponsabilidadInput {
  responsabilidad_id: number;
  miembro_id: number;
  confirmado?: boolean;
}

export function useSugerirResponsabilidades(actividadId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignments: AsignarResponsabilidadInput[]) =>
      Promise.all(
        assignments.map((a) =>
          apiClient.post<ApiResponse<unknown>>('/invitados', {
            actividad_id: actividadId,
            miembro_id: a.miembro_id,
            responsabilidad_id: a.responsabilidad_id,
            confirmado: a.confirmado ?? false,
          }),
        ),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [INVITADOS_QUERY_KEY, { actividad_id: actividadId }],
      });
    },
  });
}
