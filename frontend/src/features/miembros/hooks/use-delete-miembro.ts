import { useMutation, useQueryClient } from '@tanstack/react-query';
import { miembrosApi } from '../api';
import { MIEMBROS_QUERY_KEY } from './use-miembros';

export function useDeleteMiembro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => miembrosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MIEMBROS_QUERY_KEY] });
    },
    retry: false,
  });
}
