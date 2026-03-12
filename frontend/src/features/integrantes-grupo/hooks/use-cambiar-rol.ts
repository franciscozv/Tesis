import { useMutation, useQueryClient } from '@tanstack/react-query';
import { integranteGrupoApi } from '../api';
import type { CambiarRolInput } from '../types';
import { INTEGRANTE_GRUPO_QUERY_KEY } from './use-integrantes-grupo';

export function useCambiarRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CambiarRolInput }) =>
      integranteGrupoApi.cambiarRol(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INTEGRANTE_GRUPO_QUERY_KEY] });
    },
  });
}
