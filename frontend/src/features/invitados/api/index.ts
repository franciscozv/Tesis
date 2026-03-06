import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type {
  CreateInvitadoInput,
  Invitado,
  InvitadoFilters,
  ResponderInvitacionInput,
} from '../types';

export const invitadosApi = {
  getAll: async (filters?: InvitadoFilters) => {
    const params = new URLSearchParams();
    if (filters?.actividad_id) params.set('actividad_id', String(filters.actividad_id));
    if (filters?.miembro_id) params.set('miembro_id', String(filters.miembro_id));
    if (filters?.estado) params.set('estado', filters.estado);
    const query = params.toString();
    const { data } = await apiClient.get<ApiResponse<Invitado[]>>(
      `/invitados${query ? `?${query}` : ''}`,
    );
    return data.responseObject;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<Invitado>>(`/invitados/${id}`);
    return data.responseObject;
  },

  create: async (input: CreateInvitadoInput) => {
    const { data } = await apiClient.post<ApiResponse<Invitado>>('/invitados', input);
    return data.responseObject;
  },

  responder: async (id: number, input: ResponderInvitacionInput) => {
    const { data } = await apiClient.patch<ApiResponse<Invitado>>(
      `/invitados/${id}/responder`,
      input,
    );
    return data.responseObject;
  },

  marcarAsistencia: async (id: number, asistio: boolean) => {
    const { data } = await apiClient.patch<ApiResponse<Invitado>>(`/invitados/${id}/asistencia`, {
      asistio,
    });
    return data.responseObject;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/invitados/${id}`);
  },
};

