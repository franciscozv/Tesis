import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gruposApi } from '../api';
import type { AsignarEncargadoInput } from '../types';
import { GRUPOS_QUERY_KEY } from './use-grupos';

export function useAsignarEncargado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: AsignarEncargadoInput }) =>
      gruposApi.asignarEncargado(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [GRUPOS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [GRUPOS_QUERY_KEY, variables.id] });
    },
  });
}
