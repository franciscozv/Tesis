import { useQuery } from '@tanstack/react-query';
import { patronesApi } from '../api';

export const PATRONES_QUERY_KEY = 'patrones';

export function usePatrones() {
  return useQuery({
    queryKey: [PATRONES_QUERY_KEY],
    queryFn: patronesApi.getAll,
  });
}

