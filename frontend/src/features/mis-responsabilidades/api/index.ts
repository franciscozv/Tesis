import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type { Responsabilidad } from '../types';

export const misResponsabilidadesApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Responsabilidad[]>>('/mis-responsabilidades');
    return data.responseObject;
  },
};
