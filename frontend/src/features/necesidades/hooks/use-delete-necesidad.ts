import { useMutation, useQueryClient } from '@tanstack/react-query';
import { necesidadesApi } from '../api';
import { NECESIDADES_QUERY_KEY } from './use-necesidades';

export function useDeleteNecesidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => necesidadesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NECESIDADES_QUERY_KEY] });
    },
  });
}
