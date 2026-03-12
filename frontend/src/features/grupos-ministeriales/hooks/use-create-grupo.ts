import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gruposApi } from '../api';
import type { CreateGrupoInput, GrupoMinisterial } from '../types';
import { GRUPOS_QUERY_KEY } from './use-grupos';

export function useCreateGrupo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGrupoInput) => gruposApi.create(input),
    onSuccess: (nuevoGrupo) => {
      if (nuevoGrupo) {
        queryClient.setQueryData<GrupoMinisterial[]>([GRUPOS_QUERY_KEY], (prev) =>
          prev ? [nuevoGrupo, ...prev] : [nuevoGrupo],
        );
      }
      queryClient.invalidateQueries({ queryKey: [GRUPOS_QUERY_KEY] });
    },
  });
}
