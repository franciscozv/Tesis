import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type { CreateInvitadoInput, Invitado } from '../types/invitados';

export const INVITADOS_QUERY_KEY = 'invitados';

export function useInvitadosActividad(actividadId: number) {
  return useQuery({
    queryKey: [INVITADOS_QUERY_KEY, { actividad_id: actividadId }],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Invitado[]>>(
        `/invitados?actividad_id=${actividadId}`,
      );
      return data.responseObject;
    },
    enabled: !!actividadId,
  });
}

export function useCreateInvitado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInvitadoInput) => {
      const { data } = await apiClient.post<ApiResponse<Invitado>>('/invitados', input);
      return data.responseObject;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [INVITADOS_QUERY_KEY, { actividad_id: variables.actividad_id }],
      });
    },
  });
}

export function useMarcarAsistencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, asistio }: { id: number; asistio: boolean }) => {
      const { data } = await apiClient.patch<ApiResponse<Invitado>>(`/invitados/${id}/asistencia`, {
        asistio,
      });
      return data.responseObject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVITADOS_QUERY_KEY] });
    },
  });
}

export function useDeleteInvitado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/invitados/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVITADOS_QUERY_KEY] });
    },
  });
}
