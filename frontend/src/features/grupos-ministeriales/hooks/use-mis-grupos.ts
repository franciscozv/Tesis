import { useQuery } from '@tanstack/react-query';
import { gruposApi } from '../api';

export const MIS_GRUPOS_QUERY_KEY = 'mis-grupos';

export function useMisGrupos() {
  return useQuery({
    queryKey: [MIS_GRUPOS_QUERY_KEY],
    queryFn: gruposApi.getMisGrupos,
  });
}
