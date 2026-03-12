import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GRUPOS_QUERY_KEY } from '@/features/grupos-ministeriales/hooks/use-grupos';
import { integranteGrupoApi } from '../api';
import { INTEGRANTE_GRUPO_QUERY_KEY } from './use-integrantes-grupo';

export function useDesvincularMiembro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => integranteGrupoApi.desvincular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INTEGRANTE_GRUPO_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [GRUPOS_QUERY_KEY] });
    },
  });
}
