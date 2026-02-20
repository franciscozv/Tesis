import { useQuery } from '@tanstack/react-query';
import { necesidadesApi } from '../api';
import type { NecesidadFilters } from '../types';

export const NECESIDADES_QUERY_KEY = 'necesidades';

export function useNecesidades(filters?: NecesidadFilters) {
  return useQuery({
    queryKey: [NECESIDADES_QUERY_KEY, filters],
    queryFn: () => necesidadesApi.getAll(filters),
  });
}
