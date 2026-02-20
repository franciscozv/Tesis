import { useMutation, useQueryClient } from '@tanstack/react-query';
import { membresiaGrupoApi } from '../api';
import type { CambiarRolInput } from '../types';
import { MEMBRESIA_GRUPO_QUERY_KEY } from './use-membresias-grupo';

export function useCambiarRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CambiarRolInput }) =>
      membresiaGrupoApi.cambiarRol(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MEMBRESIA_GRUPO_QUERY_KEY] });
    },
  });
}
