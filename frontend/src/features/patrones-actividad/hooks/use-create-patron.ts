import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patronesApi } from '../api';
import type { CreatePatronInput } from '../types';
import { PATRONES_QUERY_KEY } from './use-patrones';

export function useCreatePatron() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePatronInput) => patronesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATRONES_QUERY_KEY] });
    },
  });
}
