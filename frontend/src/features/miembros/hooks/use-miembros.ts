import { useQuery } from '@tanstack/react-query';
import { miembrosApi } from '../api';

export const MIEMBROS_QUERY_KEY = 'miembros';

export function useMiembros() {
  return useQuery({
    queryKey: [MIEMBROS_QUERY_KEY],
    queryFn: miembrosApi.getAll,
  });
}

export function useMiembro(id: number) {
  return useQuery({
    queryKey: [MIEMBROS_QUERY_KEY, id],
    queryFn: () => miembrosApi.getById(id),
    enabled: !!id,
  });
}
