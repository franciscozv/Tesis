import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type {
  CreateGrupoInput,
  GrupoConPermisos,
  GrupoMinisterial,
  UpdateGrupoInput,
} from '../types';

export const gruposApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<GrupoMinisterial[]>>('/grupos');
    return data.responseObject;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<GrupoMinisterial>>(`/grupos/${id}`);
    return data.responseObject;
  },

  create: async (input: CreateGrupoInput) => {
    const { data } = await apiClient.post<ApiResponse<GrupoMinisterial>>('/grupos', input);
    return data.responseObject;
  },

  update: async (id: number, input: UpdateGrupoInput) => {
    const { data } = await apiClient.put<ApiResponse<GrupoMinisterial>>(`/grupos/${id}`, input);
    return data.responseObject;
  },

  getMisGrupos: async () => {
    const { data } = await apiClient.get<ApiResponse<GrupoConPermisos[]>>('/grupos/mis-grupos');
    return data.responseObject;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/grupos/${id}`);
  },
};
