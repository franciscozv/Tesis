import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type { Candidato, SugerirCargoInput, SugerirRolInput } from '../types';

export const candidatosApi = {
  sugerirRol: async (input: SugerirRolInput) => {
    const { data } = await apiClient.post<ApiResponse<Candidato[]>>(
      '/candidatos/sugerir-rol',
      input,
    );
    return data.responseObject;
  },

  sugerirCargo: async (input: SugerirCargoInput) => {
    const { data } = await apiClient.post<ApiResponse<Candidato[]>>(
      '/candidatos/sugerir-cargo',
      input,
    );
    return data.responseObject;
  },
};
