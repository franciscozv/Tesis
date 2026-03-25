import { useQuery } from '@tanstack/react-query';
import { patronesApi } from '../api';

export const PATRONES_QUERY_KEY = 'patrones';

export function usePatrones(includeInactive = false) {
  return useQuery({
    queryKey: [PATRONES_QUERY_KEY, { includeInactive }],
    queryFn: () => patronesApi.getAll(includeInactive),
  });
}
