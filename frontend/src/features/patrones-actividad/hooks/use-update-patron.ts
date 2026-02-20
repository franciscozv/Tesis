import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patronesApi } from '../api';
import type { UpdatePatronInput } from '../types';
import { PATRONES_QUERY_KEY } from './use-patrones';

export function useUpdatePatron() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdatePatronInput }) =>
      patronesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATRONES_QUERY_KEY] });
    },
  });
}

export function useToggleEstadoPatron() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      patronesApi.toggleEstado(id, activo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATRONES_QUERY_KEY] });
    },
  });
}
