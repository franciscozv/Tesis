import { useMutation, useQueryClient } from '@tanstack/react-query';
import { necesidadesApi } from '../api';
import type { UpdateNecesidadInput } from '../types';
import { NECESIDADES_QUERY_KEY } from './use-necesidades';

export function useUpdateNecesidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateNecesidadInput }) =>
      necesidadesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NECESIDADES_QUERY_KEY] });
    },
  });
}

