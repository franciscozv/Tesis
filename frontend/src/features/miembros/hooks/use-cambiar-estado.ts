import { useMutation, useQueryClient } from '@tanstack/react-query';
import { miembrosApi } from '../api';
import type { CambiarEstadoInput } from '../types';
import { MIEMBROS_QUERY_KEY } from './use-miembros';

export function useCambiarEstado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CambiarEstadoInput }) =>
      miembrosApi.cambiarEstado(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [MIEMBROS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MIEMBROS_QUERY_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: ['historial-estado', variables.id] });
    },
  });
}
