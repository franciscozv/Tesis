import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type { CreateGrupoInput, GrupoMinisterial, UpdateGrupoInput } from '../types';

export const gruposApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<GrupoMinisterial[]>>('/grupos-ministeriales');
    return data.responseObject;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<GrupoMinisterial>>(
      `/grupos-ministeriales/${id}`,
    );
    return data.responseObject;
  },

  create: async (input: CreateGrupoInput) => {
    const { data } = await apiClient.post<ApiResponse<GrupoMinisterial>>(
      '/grupos-ministeriales',
      input,
    );
    return data.responseObject;
  },

  update: async (id: number, input: UpdateGrupoInput) => {
    const { data } = await apiClient.put<ApiResponse<GrupoMinisterial>>(
      `/grupos-ministeriales/${id}`,
      input,
    );
    return data.responseObject;
  },

  getMisGrupos: async () => {
    const { data } = await apiClient.get<ApiResponse<GrupoMinisterial[]>>(
      '/grupos-ministeriales/mis-grupos',
    );
    return data.responseObject;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/grupos-ministeriales/${id}`);
  },
};
