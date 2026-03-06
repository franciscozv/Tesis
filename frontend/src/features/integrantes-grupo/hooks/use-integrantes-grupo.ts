import { useQuery } from '@tanstack/react-query';
import { integranteGrupoApi } from '../api';

export const INTEGRANTE_GRUPO_QUERY_KEY = 'integrante-grupo';

export function useIntegrantesGrupo(grupoId: number) {
  return useQuery({
    queryKey: [INTEGRANTE_GRUPO_QUERY_KEY, 'grupo', grupoId],
    queryFn: () => integranteGrupoApi.getByGrupo(grupoId),
    enabled: !!grupoId,
  });
}

