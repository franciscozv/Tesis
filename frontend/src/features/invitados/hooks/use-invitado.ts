import { useQuery } from '@tanstack/react-query';
import { invitadosApi } from '../api';
import { INVITADOS_QUERY_KEY } from './use-invitados';

export function useInvitado(id: number) {
  return useQuery({
    queryKey: [INVITADOS_QUERY_KEY, id],
    queryFn: () => invitadosApi.getById(id),
    enabled: !!id,
  });
}
