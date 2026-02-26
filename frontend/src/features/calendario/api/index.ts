import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type { CalendarioEvento } from '../types';

export const calendarioApi = {
  getConsolidado: async (mes: number, anio: number) => {
    const { data } = await apiClient.get<ApiResponse<CalendarioEvento[]>>(
      `/calendario/consolidado?mes=${mes}&anio=${anio}`,
    );
    return data.responseObject;
  },
};
