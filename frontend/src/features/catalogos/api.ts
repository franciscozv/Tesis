import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';

interface CatalogoApi<T, TCreate, TUpdate> {
  getAll: () => Promise<T[]>;
  getAllActivos: () => Promise<T[]>;
  getById: (id: number) => Promise<T>;
  create: (input: TCreate) => Promise<T>;
  update: (id: number, input: TUpdate) => Promise<T>;
  delete: (id: number) => Promise<void>;
  toggleEstado: (id: number) => Promise<T>;
}

function createCatalogoApi<T, TCreate, TUpdate>(
  endpoint: string,
): CatalogoApi<T, TCreate, TUpdate> {
  return {
    getAll: async () => {
      const { data } = await apiClient.get<ApiResponse<T[]>>(endpoint);
      return data.responseObject;
    },
    getAllActivos: async () => {
      const { data } = await apiClient.get<ApiResponse<T[]>>(`${endpoint}?activo=true`);
      return data.responseObject;
    },
    getById: async (id: number) => {
      const { data } = await apiClient.get<ApiResponse<T>>(`${endpoint}/${id}`);
      return data.responseObject;
    },
    create: async (input: TCreate) => {
      const { data } = await apiClient.post<ApiResponse<T>>(endpoint, input);
      return data.responseObject;
    },
    update: async (id: number, input: TUpdate) => {
      const { data } = await apiClient.put<ApiResponse<T>>(`${endpoint}/${id}`, input);
      return data.responseObject;
    },
    delete: async (id: number) => {
      await apiClient.delete(`${endpoint}/${id}`);
    },
    toggleEstado: async (id: number) => {
      const { data } = await apiClient.patch<ApiResponse<T>>(`${endpoint}/${id}/toggle-estado`);
      return data.responseObject;
    },
  };
}

import type {
  CreateResponsabilidadActividadInput,
  CreateRolGrupoInput,
  CreateTipoActividadInput,
  CreateTipoNecesidadInput,
  ResponsabilidadActividad,
  RolGrupo,
  TipoActividad,
  TipoNecesidad,
  UpdateResponsabilidadActividadInput,
  UpdateRolGrupoInput,
  UpdateTipoActividadInput,
  UpdateTipoNecesidadInput,
} from './types';

export const rolesGrupoApi = createCatalogoApi<RolGrupo, CreateRolGrupoInput, UpdateRolGrupoInput>(
  '/roles-grupo',
);

export const responsabilidadesActividadApi = createCatalogoApi<
  ResponsabilidadActividad,
  CreateResponsabilidadActividadInput,
  UpdateResponsabilidadActividadInput
>('/responsabilidades-actividad');

export const tiposActividadApi = createCatalogoApi<
  TipoActividad,
  CreateTipoActividadInput,
  UpdateTipoActividadInput
>('/tipos-actividad');

export const tiposNecesidadApi = createCatalogoApi<
  TipoNecesidad,
  CreateTipoNecesidadInput,
  UpdateTipoNecesidadInput
>('/tipos-necesidad');
