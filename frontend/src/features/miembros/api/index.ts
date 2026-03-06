import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type {
  CambiarEstadoInput,
  CreateMiembroInput,
  Miembro,
  MiembrosQueryParams,
  PaginatedMiembrosResponse,
  UpdateMiembroInput,
  UpdateMiPerfilInput,
} from '../types';

export const miembrosApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<PaginatedMiembrosResponse>>('/miembros', {
      params: { page: 1, limit: 100 },
    });
    return data.responseObject?.data ?? [];
  },

  getAllPaginated: async (params: MiembrosQueryParams) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== undefined),
    );
    const { data } = await apiClient.get<ApiResponse<PaginatedMiembrosResponse>>('/miembros', {
      params: cleanParams,
    });
    return data.responseObject;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<Miembro>>(`/miembros/${id}`);
    return data.responseObject;
  },

  create: async (input: CreateMiembroInput) => {
    const { data } = await apiClient.post<ApiResponse<Miembro>>('/miembros', input);
    return data.responseObject;
  },

  update: async (id: number, input: UpdateMiembroInput) => {
    const { data } = await apiClient.put<ApiResponse<Miembro>>(`/miembros/${id}`, input);
    return data.responseObject;
  },

  cambiarEstado: async (id: number, input: CambiarEstadoInput) => {
    const { data } = await apiClient.patch<ApiResponse<Miembro>>(`/miembros/${id}/estado`, input);
    return data.responseObject;
  },

  updateMiPerfil: async (input: UpdateMiPerfilInput) => {
    const { data } = await apiClient.patch<ApiResponse<Miembro>>('/miembros/mi-perfil', input);
    return data.responseObject;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/miembros/${id}`);
  },
};

