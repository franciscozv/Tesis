import { useMutation, useQueryClient } from '@tanstack/react-query';
import { miembrosApi } from '../api';
import type { UpdateMiPerfilInput } from '../types';
import { MIEMBROS_QUERY_KEY } from './use-miembros';

export function useUpdateMiPerfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMiPerfilInput) => miembrosApi.updateMiPerfil(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MIEMBROS_QUERY_KEY] });
    },
  });
}

