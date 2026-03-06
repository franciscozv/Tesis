import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type {
  CreatePatronInput,
  GenerarInstanciasInput,
  GenerarInstanciasResult,
  PatronActividad,
  UpdatePatronInput,
} from '../types';

export const patronesApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<PatronActividad[]>>('/patrones');
    return data.responseObject;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<PatronActividad>>(`/patrones/${id}`);
    return data.responseObject;
  },

  create: async (input: CreatePatronInput) => {
    const { data } = await apiClient.post<ApiResponse<PatronActividad>>('/patrones', input);
    return data.responseObject;
  },

  update: async (id: number, input: UpdatePatronInput) => {
    const { data } = await apiClient.put<ApiResponse<PatronActividad>>(`/patrones/${id}`, input);
    return data.responseObject;
  },

  toggleEstado: async (id: number, activo: boolean) => {
    const { data } = await apiClient.patch<ApiResponse<PatronActividad>>(`/patrones/${id}/estado`, {
      activo,
    });
    return data.responseObject;
  },

  generarInstancias: async (input: GenerarInstanciasInput) => {
    const { data } = await apiClient.post<ApiResponse<GenerarInstanciasResult>>(
      '/patrones/generar-instancias',
      input,
    );
    return data.responseObject;
  },
};

