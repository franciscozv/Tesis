import { useMutation, useQueryClient } from '@tanstack/react-query';
import { necesidadesApi } from '../api';
import type { CambiarEstadoNecesidadInput } from '../types';
import { NECESIDADES_QUERY_KEY } from './use-necesidades';

export function useCambiarEstadoNecesidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CambiarEstadoNecesidadInput }) =>
      necesidadesApi.cambiarEstado(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NECESIDADES_QUERY_KEY] });
    },
  });
}
