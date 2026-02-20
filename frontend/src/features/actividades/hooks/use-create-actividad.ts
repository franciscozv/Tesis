import { useMutation, useQueryClient } from '@tanstack/react-query';
import { actividadesApi } from '../api';
import type { CreateActividadInput } from '../types';
import { ACTIVIDADES_QUERY_KEY } from './use-actividades';

export function useCreateActividad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateActividadInput) => actividadesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVIDADES_QUERY_KEY] });
    },
  });
}
