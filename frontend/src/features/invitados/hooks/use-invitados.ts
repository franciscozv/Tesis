import { useQuery } from '@tanstack/react-query';
import { invitadosApi } from '../api';
import type { InvitadoFilters } from '../types';

export const INVITADOS_QUERY_KEY = 'invitados';

export function useInvitados(filters?: InvitadoFilters) {
  return useQuery({
    queryKey: [INVITADOS_QUERY_KEY, filters],
    queryFn: () => invitadosApi.getAll(filters),
  });
}
