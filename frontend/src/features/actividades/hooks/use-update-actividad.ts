import { useMutation, useQueryClient } from '@tanstack/react-query';
import { actividadesApi } from '../api';
import type { UpdateActividadInput } from '../types';
import { ACTIVIDADES_QUERY_KEY } from './use-actividades';

export function useUpdateActividad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateActividadInput }) =>
      actividadesApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ACTIVIDADES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVIDADES_QUERY_KEY, variables.id] });
    },
  });
}
