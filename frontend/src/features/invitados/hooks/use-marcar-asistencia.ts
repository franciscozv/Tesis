import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitadosApi } from '../api';
import { INVITADOS_QUERY_KEY } from './use-invitados';

export function useMarcarAsistencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, asistio }: { id: number; asistio: boolean }) =>
      invitadosApi.marcarAsistencia(id, asistio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVITADOS_QUERY_KEY] });
    },
  });
}
