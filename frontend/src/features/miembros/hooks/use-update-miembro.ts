import { useMutation, useQueryClient } from '@tanstack/react-query';
import { miembrosApi } from '../api';
import type { UpdateMiembroInput } from '../types';
import { MIEMBROS_QUERY_KEY } from './use-miembros';

export function useUpdateMiembro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateMiembroInput }) =>
      miembrosApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [MIEMBROS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MIEMBROS_QUERY_KEY, variables.id] });
    },
  });
}

