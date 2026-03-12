import { useMutation, useQueryClient } from '@tanstack/react-query';
import { miembrosApi } from '../api';
import type { CreateMiembroInput } from '../types';
import { MIEMBROS_QUERY_KEY } from './use-miembros';

export function useCreateMiembro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMiembroInput) => miembrosApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MIEMBROS_QUERY_KEY] });
    },
  });
}
