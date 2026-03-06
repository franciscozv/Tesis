import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type { HistorialEstado } from '../types';

export const historialEstadoApi = {
  getByMiembro: async (miembroId: number) => {
    const { data } = await apiClient.get<ApiResponse<HistorialEstado[]>>(
      `/historial-estado?miembro_id=${miembroId}`,
    );
    return data.responseObject;
  },
};

