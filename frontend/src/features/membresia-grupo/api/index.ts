import type { ApiResponse } from '@/features/auth/types';
import type { MiembroGrupo } from '@/features/grupos-ministeriales/types';
import apiClient from '@/lib/api-client';
import type { CambiarRolInput, DesvincularMiembroInput, VincularMiembroInput } from '../types';

export const membresiaGrupoApi = {
  vincular: async (input: VincularMiembroInput) => {
    const { data } = await apiClient.post<ApiResponse<MiembroGrupo>>('/membresia-grupo', input);
    return data.responseObject;
  },

  desvincular: async (id: number, input?: DesvincularMiembroInput) => {
    const { data } = await apiClient.patch<ApiResponse<MiembroGrupo>>(
      `/membresia-grupo/${id}/desvincular`,
      input ?? {},
    );
    return data.responseObject;
  },

  cambiarRol: async (id: number, input: CambiarRolInput) => {
    const { data } = await apiClient.patch<ApiResponse<MiembroGrupo>>(
      `/membresia-grupo/${id}/cambiar-rol`,
      input,
    );
    return data.responseObject;
  },

  getByMiembro: async (miembroId: number) => {
    const { data } = await apiClient.get<ApiResponse<MiembroGrupo[]>>(
      `/membresia-grupo/miembro/${miembroId}`,
    );
    return data.responseObject;
  },

  getByGrupo: async (grupoId: number) => {
    const { data } = await apiClient.get<ApiResponse<MiembroGrupo[]>>(
      `/membresia-grupo/grupo/${grupoId}`,
    );
    return data.responseObject;
  },
};
