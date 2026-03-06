import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type { Candidato, SugerirCargoInput, SugerirCargoResponse, SugerirRolInput } from '../types';

export const candidatosApi = {
  sugerirRol: async (input: SugerirRolInput) => {
    const { data } = await apiClient.post<ApiResponse<Candidato[]>>(
      '/candidatos/sugerir-responsabilidad',
      input,
    );
    return data.responseObject;
  },

  sugerirCargo: async (input: SugerirCargoInput): Promise<SugerirCargoResponse> => {
    const { data } = await apiClient.post<ApiResponse<SugerirCargoResponse>>(
      '/candidatos/sugerir-cargo',
      input,
    );
    return data.responseObject;
  },
};

