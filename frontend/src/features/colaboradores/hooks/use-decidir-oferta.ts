import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NECESIDADES_QUERY_KEY } from '@/features/necesidades/hooks/use-necesidades';
import { colaboradoresApi } from '../api';
import type { DecidirOfertaInput } from '../types';
import { COLABORADORES_QUERY_KEY } from './use-colaboradores';

export function useDecidirOferta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: DecidirOfertaInput }) =>
      colaboradoresApi.decidir(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLABORADORES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [NECESIDADES_QUERY_KEY] });
    },
  });
}
