import { useQuery } from '@tanstack/react-query';
import { necesidadesApi } from '../api';
import { NECESIDADES_QUERY_KEY } from './use-necesidades';

export function useNecesidadesAbiertas() {
  return useQuery({
    queryKey: [NECESIDADES_QUERY_KEY, 'abiertas'],
    queryFn: () => necesidadesApi.getAbiertas(),
  });
}
