import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colaboradoresApi } from '../api';
import { COLABORADORES_QUERY_KEY } from './use-colaboradores';

export function useDeleteColaborador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => colaboradoresApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLABORADORES_QUERY_KEY] });
    },
  });
}

