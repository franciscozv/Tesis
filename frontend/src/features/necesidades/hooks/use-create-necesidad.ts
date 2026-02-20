import { useMutation, useQueryClient } from '@tanstack/react-query';
import { necesidadesApi } from '../api';
import type { CreateNecesidadInput } from '../types';
import { NECESIDADES_QUERY_KEY } from './use-necesidades';

export function useCreateNecesidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNecesidadInput) => necesidadesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NECESIDADES_QUERY_KEY] });
    },
  });
}
