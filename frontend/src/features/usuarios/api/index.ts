import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type {
  CreateUsuarioInput,
  PatchEstadoUsuarioInput,
  UpdateUsuarioInput,
  Usuario,
} from '../types';

export const usuariosApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Usuario[]>>('/usuarios');
    return data.responseObject;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<Usuario>>(`/usuarios/${id}`);
    return data.responseObject;
  },

  create: async (input: CreateUsuarioInput) => {
    const { data } = await apiClient.post<ApiResponse<Usuario>>('/usuarios', input);
    return data.responseObject;
  },

  update: async (id: number, input: UpdateUsuarioInput) => {
    const { data } = await apiClient.put<ApiResponse<Usuario>>(`/usuarios/${id}`, input);
    return data.responseObject;
  },

  cambiarEstado: async (id: number, input: PatchEstadoUsuarioInput) => {
    const { data } = await apiClient.patch<ApiResponse<Usuario>>(`/usuarios/${id}/estado`, input);
    return data.responseObject;
  },
};

