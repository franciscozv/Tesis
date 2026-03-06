import { useQuery } from '@tanstack/react-query';
import { integranteGrupoApi } from '../api';
import { INTEGRANTE_GRUPO_QUERY_KEY } from './use-integrantes-grupo';

export function useAsignacionesMiembro(miembroId: number) {
  return useQuery({
    queryKey: [INTEGRANTE_GRUPO_QUERY_KEY, 'miembro', miembroId],
    queryFn: () => integranteGrupoApi.getByMiembro(miembroId),
    enabled: !!miembroId,
  });
}

