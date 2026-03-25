import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type {
  Colaborador,
  ColaboradorFilters,
  CreateColaboradorInput,
  MarcarCumplioInput,
} from '../types';

export const colaboradoresApi = {
  getAll: async (filters?: ColaboradorFilters) => {
    const params = new URLSearchParams();
    if (filters?.necesidad_id) params.set('necesidad_id', String(filters.necesidad_id));
    if (filters?.miembro_id) params.set('miembro_id', String(filters.miembro_id));
    const query = params.toString();
    const { data } = await apiClient.get<ApiResponse<Colaborador[]>>(
      `/colaboradores${query ? `?${query}` : ''}`,
    );
    return data.responseObject;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<Colaborador>>(`/colaboradores/${id}`);
    return data.responseObject;
  },

  create: async (input: CreateColaboradorInput) => {
    const { data } = await apiClient.post<ApiResponse<Colaborador>>('/colaboradores', input);
    return data.responseObject;
  },

  marcarCumplio: async (id: number, input: MarcarCumplioInput) => {
    const { data } = await apiClient.patch<ApiResponse<Colaborador>>(
      `/colaboradores/${id}/cumplio`,
      input,
    );
    return data.responseObject;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/colaboradores/${id}`);
  },
};
