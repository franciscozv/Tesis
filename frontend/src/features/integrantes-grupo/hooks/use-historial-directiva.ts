import { useQuery } from '@tanstack/react-query';
import { integranteGrupoApi } from '../api';

export const HISTORIAL_DIRECTIVA_QUERY_KEY = 'historial-directiva';

export function useHistorialDirectiva(grupoId: number, enabled = true) {
  return useQuery({
    queryKey: [HISTORIAL_DIRECTIVA_QUERY_KEY, grupoId],
    queryFn: () => integranteGrupoApi.getHistorialDirectiva(grupoId),
    enabled: !!grupoId && enabled,
  });
}
