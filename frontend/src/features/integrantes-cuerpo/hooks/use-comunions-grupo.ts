import { useQuery } from '@tanstack/react-query';
import { integranteCuerpoApi } from '../api';

export const INTEGRANTE_CUERPO_QUERY_KEY = 'integrante-cuerpo';

export function useIntegrantesGrupo(grupoId: number) {
  return useQuery({
    queryKey: [INTEGRANTE_CUERPO_QUERY_KEY, 'grupo', grupoId],
    queryFn: () => integranteCuerpoApi.getByGrupo(grupoId),
    enabled: !!grupoId,
  });
}
