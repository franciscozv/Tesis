import { useMutation, useQueryClient } from '@tanstack/react-query';
import { actividadesApi } from '../api';
import type { CambiarEstadoActividadInput } from '../types';
import { ACTIVIDADES_QUERY_KEY } from './use-actividades';

export function useCambiarEstadoActividad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CambiarEstadoActividadInput }) =>
      actividadesApi.cambiarEstado(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ACTIVIDADES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVIDADES_QUERY_KEY, variables.id] });
    },
  });
}

