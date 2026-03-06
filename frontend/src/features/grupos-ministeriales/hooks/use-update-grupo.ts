import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gruposApi } from '../api';
import type { UpdateGrupoInput } from '../types';
import { GRUPOS_QUERY_KEY } from './use-grupos';

export function useUpdateGrupo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateGrupoInput }) =>
      gruposApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [GRUPOS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [GRUPOS_QUERY_KEY, variables.id] });
    },
  });
}

