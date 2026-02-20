import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type { CreateNecesidadInput, NecesidadLogistica } from '../types/necesidades';

export const NECESIDADES_QUERY_KEY = 'necesidades';

export function useNecesidadesActividad(actividadId: number) {
  return useQuery({
    queryKey: [NECESIDADES_QUERY_KEY, { actividad_id: actividadId }],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<NecesidadLogistica[]>>(
        `/necesidades?actividad_id=${actividadId}`,
      );
      return data.responseObject;
    },
    enabled: !!actividadId,
  });
}

export function useCreateNecesidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateNecesidadInput) => {
      const { data } = await apiClient.post<ApiResponse<NecesidadLogistica>>('/necesidades', input);
      return data.responseObject;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [NECESIDADES_QUERY_KEY, { actividad_id: variables.actividad_id }],
      });
    },
  });
}
