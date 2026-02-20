import { useQuery } from '@tanstack/react-query';
import { membresiaGrupoApi } from '../api';
import { MEMBRESIA_GRUPO_QUERY_KEY } from './use-membresias-grupo';

export function useMembresiaseMiembro(miembroId: number) {
  return useQuery({
    queryKey: [MEMBRESIA_GRUPO_QUERY_KEY, 'miembro', miembroId],
    queryFn: () => membresiaGrupoApi.getByMiembro(miembroId),
    enabled: !!miembroId,
  });
}
