import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CALENDARIO_QUERY_KEY } from '@/features/calendario/hooks/use-calendario';
import { actividadesApi } from '../api';
import type { DuplicarActividadInput } from '../types';
import { ACTIVIDADES_QUERY_KEY } from './use-actividades';

export function useDuplicarActividad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: DuplicarActividadInput }) =>
      actividadesApi.duplicar(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVIDADES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CALENDARIO_QUERY_KEY] });
    },
  });
}
