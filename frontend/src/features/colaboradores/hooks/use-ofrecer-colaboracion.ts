import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NECESIDADES_QUERY_KEY } from '@/features/necesidades/hooks/use-necesidades';
import { colaboradoresApi } from '../api';
import type { CreateColaboradorInput } from '../types';
import { COLABORADORES_QUERY_KEY } from './use-colaboradores';

export function useOfrecerColaboracion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateColaboradorInput) => colaboradoresApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLABORADORES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [NECESIDADES_QUERY_KEY] });
    },
  });
}

