import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colaboradoresApi } from '../api';
import type { MarcarCumplioInput } from '../types';
import { COLABORADORES_QUERY_KEY } from './use-colaboradores';

export function useMarcarCumplio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: MarcarCumplioInput }) =>
      colaboradoresApi.marcarCumplio(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLABORADORES_QUERY_KEY] });
    },
  });
}
