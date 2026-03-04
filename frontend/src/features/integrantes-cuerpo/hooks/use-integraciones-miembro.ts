import { useQuery } from '@tanstack/react-query';
import { integranteCuerpoApi } from '../api';
import { INTEGRANTE_CUERPO_QUERY_KEY } from './use-integrantes-grupo';

export function useAsignacionesMiembro(miembroId: number) {
  return useQuery({
    queryKey: [INTEGRANTE_CUERPO_QUERY_KEY, 'miembro', miembroId],
    queryFn: () => integranteCuerpoApi.getByMiembro(miembroId),
    enabled: !!miembroId,
  });
}
