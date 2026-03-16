import type { RolGrupo } from '@/features/catalogos/types';
import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type { HabilitarRolInput } from '../types';

export const grupoRolApi = {
  getByGrupo: async (grupoId: number): Promise<RolGrupo[]> => {
    const { data } = await apiClient.get<ApiResponse<RolGrupo[]>>(`/grupo-rol/${grupoId}`);
    return data.responseObject ?? [];
  },

  habilitar: async (input: HabilitarRolInput): Promise<{ grupo_id: number; rol_grupo_id: number }> => {
    const { data } = await apiClient.post<ApiResponse<{ grupo_id: number; rol_grupo_id: number }>>(
      '/grupo-rol',
      input,
    );
    return data.responseObject!;
  },

  deshabilitar: async (grupoId: number, rolId: number): Promise<void> => {
    await apiClient.delete(`/grupo-rol/${grupoId}/${rolId}`);
  },
};
