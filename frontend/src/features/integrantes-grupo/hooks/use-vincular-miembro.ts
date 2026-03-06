import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GRUPOS_QUERY_KEY } from '@/features/grupos-ministeriales/hooks/use-grupos';
import { integranteGrupoApi } from '../api';
import type { VincularMiembroInput } from '../types';
import { INTEGRANTE_GRUPO_QUERY_KEY } from './use-integrantes-grupo';

export function useVincularMiembro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VincularMiembroInput) => integranteGrupoApi.vincular(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [INTEGRANTE_GRUPO_QUERY_KEY, 'grupo', variables.grupo_id],
      });
      queryClient.invalidateQueries({
        queryKey: [INTEGRANTE_GRUPO_QUERY_KEY, 'miembro', variables.miembro_id],
      });
      queryClient.invalidateQueries({
        queryKey: [GRUPOS_QUERY_KEY, variables.grupo_id, 'miembros'],
      });
    },
  });
}

