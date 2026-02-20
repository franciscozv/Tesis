import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GRUPOS_QUERY_KEY } from '@/features/grupos-ministeriales/hooks/use-grupos';
import { membresiaGrupoApi } from '../api';
import type { VincularMiembroInput } from '../types';
import { MEMBRESIA_GRUPO_QUERY_KEY } from './use-membresias-grupo';

export function useVincularMiembro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VincularMiembroInput) => membresiaGrupoApi.vincular(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [MEMBRESIA_GRUPO_QUERY_KEY, 'grupo', variables.grupo_id],
      });
      queryClient.invalidateQueries({
        queryKey: [MEMBRESIA_GRUPO_QUERY_KEY, 'miembro', variables.miembro_id],
      });
      queryClient.invalidateQueries({
        queryKey: [GRUPOS_QUERY_KEY, variables.grupo_id, 'miembros'],
      });
    },
  });
}
