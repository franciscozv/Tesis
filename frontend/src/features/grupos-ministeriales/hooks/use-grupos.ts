import { useQuery } from '@tanstack/react-query';
import { gruposApi } from '../api';

export const GRUPOS_QUERY_KEY = 'grupos-ministeriales';

export function useGrupos() {
  return useQuery({
    queryKey: [GRUPOS_QUERY_KEY],
    queryFn: gruposApi.getAll,
  });
}

export function useGrupo(id: number) {
  return useQuery({
    queryKey: [GRUPOS_QUERY_KEY, id],
    queryFn: () => gruposApi.getById(id),
    enabled: !!id,
  });
}

