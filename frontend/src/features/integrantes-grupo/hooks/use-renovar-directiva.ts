import { useMutation, useQueryClient } from '@tanstack/react-query';
import { integranteGrupoApi } from '../api';
import type { RenovarDirectivaInput } from '../types';
import { INTEGRANTE_GRUPO_QUERY_KEY } from './use-integrantes-grupo';

export function useRenovarDirectiva(grupoId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RenovarDirectivaInput) =>
      integranteGrupoApi.renovarDirectiva(grupoId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INTEGRANTE_GRUPO_QUERY_KEY] });
    },
  });
}
