import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { grupoRolApi } from '../api';
import type { HabilitarRolInput } from '../types';

export const GRUPO_ROL_QUERY_KEY = 'grupo-rol';

export function useRolesHabilitadosEnGrupo(grupoId: number) {
  return useQuery({
    queryKey: [GRUPO_ROL_QUERY_KEY, grupoId],
    queryFn: () => grupoRolApi.getByGrupo(grupoId),
    enabled: grupoId > 0,
  });
}

export function useHabilitarRol(grupoId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: HabilitarRolInput) => grupoRolApi.habilitar(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GRUPO_ROL_QUERY_KEY, grupoId] });
    },
  });
}

export function useDeshabilitarRol(grupoId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rolId }: { rolId: number }) => grupoRolApi.deshabilitar(grupoId, rolId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GRUPO_ROL_QUERY_KEY, grupoId] });
    },
  });
}
