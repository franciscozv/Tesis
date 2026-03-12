import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type { CalendarioEvento } from '../types';

export const calendarioApi = {
  getConsolidado: async (mes: number, anio: number, grupoId?: number) => {
    let url = `/calendario/consolidado?mes=${mes}&anio=${anio}`;
    if (grupoId) {
      url += `&grupoId=${grupoId}`;
    }
    const { data } = await apiClient.get<ApiResponse<CalendarioEvento[]>>(url);
    return data.responseObject;
  },
};
