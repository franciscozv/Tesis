import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type {
  CambiarEstadoNecesidadInput,
  CreateNecesidadInput,
  NecesidadFilters,
  NecesidadLogistica,
  UpdateNecesidadInput,
} from '../types';

export const necesidadesApi = {
  getAbiertas: async (): Promise<NecesidadLogistica[]> => {
    try {
      const { data } =
        await apiClient.get<ApiResponse<NecesidadLogistica[]>>('/necesidades/abiertas');
      return data.responseObject ?? [];
    } catch {
      return [];
    }
  },

  getAll: async (filters?: NecesidadFilters) => {
    const params = new URLSearchParams();
    if (filters?.actividad_id) params.set('actividad_id', String(filters.actividad_id));
    if (filters?.estado) params.set('estado', filters.estado);
    const query = params.toString();
    const { data } = await apiClient.get<ApiResponse<NecesidadLogistica[]>>(
      `/necesidades${query ? `?${query}` : ''}`,
    );
    return data.responseObject;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<NecesidadLogistica>>(`/necesidades/${id}`);
    return data.responseObject;
  },

  create: async (input: CreateNecesidadInput) => {
    const { data } = await apiClient.post<ApiResponse<NecesidadLogistica>>('/necesidades', input);
    return data.responseObject;
  },

  update: async (id: number, input: UpdateNecesidadInput) => {
    const { data } = await apiClient.put<ApiResponse<NecesidadLogistica>>(
      `/necesidades/${id}`,
      input,
    );
    return data.responseObject;
  },

  cambiarEstado: async (id: number, input: CambiarEstadoNecesidadInput) => {
    const { data } = await apiClient.patch<ApiResponse<NecesidadLogistica>>(
      `/necesidades/${id}/estado`,
      input,
    );
    return data.responseObject;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/necesidades/${id}`);
  },
};
