import type { ApiResponse } from '@/features/auth/types';
import type { MiembroGrupo } from '@/features/grupos-ministeriales/types';
import apiClient from '@/lib/api-client';
import type { CambiarRolInput, DesvincularMiembroInput, VincularMiembroInput } from '../types';

export const integranteCuerpoApi = {
  vincular: async (input: VincularMiembroInput) => {
    const { data } = await apiClient.post<ApiResponse<MiembroGrupo>>('/integrantes-cuerpo', input);
    return data.responseObject;
  },

  desvincular: async (id: number, input?: DesvincularMiembroInput) => {
    const { data } = await apiClient.patch<ApiResponse<MiembroGrupo>>(
      `/integrantes-cuerpo/${id}/desvincular`,
      input ?? {},
    );
    return data.responseObject;
  },

  cambiarRol: async (id: number, input: CambiarRolInput) => {
    const { data } = await apiClient.patch<ApiResponse<MiembroGrupo>>(
      `/integrantes-cuerpo/${id}/cambiar-rol`,
      input,
    );
    return data.responseObject;
  },

  getByMiembro: async (miembroId: number) => {
    const { data } = await apiClient.get<ApiResponse<MiembroGrupo[]>>(
      `/integrantes-cuerpo/miembro/${miembroId}`,
    );
    return data.responseObject;
  },

  getByGrupo: async (grupoId: number) => {
    const { data } = await apiClient.get<ApiResponse<MiembroGrupo[]>>(
      `/integrantes-cuerpo/grupo/${grupoId}`,
    );
    return data.responseObject;
  },
};
