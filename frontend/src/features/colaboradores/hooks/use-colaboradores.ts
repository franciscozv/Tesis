import { useQuery } from '@tanstack/react-query';
import { colaboradoresApi } from '../api';
import type { ColaboradorFilters } from '../types';

export const COLABORADORES_QUERY_KEY = 'colaboradores';

export function useColaboradores(filters?: ColaboradorFilters) {
  return useQuery({
    queryKey: [COLABORADORES_QUERY_KEY, filters],
    queryFn: () => colaboradoresApi.getAll(filters),
  });
}

