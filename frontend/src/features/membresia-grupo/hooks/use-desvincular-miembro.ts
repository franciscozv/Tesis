import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GRUPOS_QUERY_KEY } from '@/features/grupos-ministeriales/hooks/use-grupos';
import { membresiaGrupoApi } from '../api';
import { MEMBRESIA_GRUPO_QUERY_KEY } from './use-membresias-grupo';

export function useDesvincularMiembro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => membresiaGrupoApi.desvincular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MEMBRESIA_GRUPO_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [GRUPOS_QUERY_KEY] });
    },
  });
}
