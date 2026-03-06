import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitadosApi } from '../api';
import type { ResponderInvitacionInput } from '../types';
import { INVITADOS_QUERY_KEY } from './use-invitados';

export function useResponderInvitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ResponderInvitacionInput }) =>
      invitadosApi.responder(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVITADOS_QUERY_KEY] });
    },
  });
}

