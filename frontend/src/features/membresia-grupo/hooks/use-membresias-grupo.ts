import { useQuery } from '@tanstack/react-query';
import { membresiaGrupoApi } from '../api';

export const MEMBRESIA_GRUPO_QUERY_KEY = 'membresia-grupo';

export function useMembresiasGrupo(grupoId: number) {
  return useQuery({
    queryKey: [MEMBRESIA_GRUPO_QUERY_KEY, 'grupo', grupoId],
    queryFn: () => membresiaGrupoApi.getByGrupo(grupoId),
    enabled: !!grupoId,
  });
}
