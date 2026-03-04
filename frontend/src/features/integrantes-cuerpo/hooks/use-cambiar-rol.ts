import { useMutation, useQueryClient } from '@tanstack/react-query';
import { integranteCuerpoApi } from '../api';
import type { CambiarRolInput } from '../types';
import { INTEGRANTE_CUERPO_QUERY_KEY } from './use-integrantes-grupo';

export function useCambiarRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CambiarRolInput }) =>
      integranteCuerpoApi.cambiarRol(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INTEGRANTE_CUERPO_QUERY_KEY] });
    },
  });
}
