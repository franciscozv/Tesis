import type { ApiResponse } from '@/features/auth/types';
import apiClient from '@/lib/api-client';
import type {
  Actividad,
  ActividadFilters,
  CambiarEstadoActividadInput,
  CreateActividadInput,
  PaginatedActividadesResponse,
  UpdateActividadInput,
} from '../types';

export const actividadesApi = {
  getAll: async (filters?: ActividadFilters) => {
    const params = new URLSearchParams();
    params.set('page', String(filters?.page ?? 1));
    params.set('limit', String(filters?.limit ?? 100));
    if (filters?.mes) params.set('mes', String(filters.mes));
    if (filters?.anio) params.set('anio', String(filters.anio));
    if (filters?.estado) params.set('estado', filters.estado);
    if (filters?.es_publica !== undefined) params.set('es_publica', String(filters.es_publica));
    if (filters?.search) params.set('search', filters.search);
    if (filters?.grupo_id) params.set('grupo_id', String(filters.grupo_id));

    const query = params.toString();
    const { data } = await apiClient.get<ApiResponse<PaginatedActividadesResponse>>(
      `/actividades${query ? `?${query}` : ''}`,
    );
    return data.responseObject?.data ?? [];
  },

  getAllPaginated: async (params: ActividadFilters) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== undefined),
    );
    const { data } = await apiClient.get<ApiResponse<PaginatedActividadesResponse>>(
      '/actividades',
      {
        params: cleanParams,
      },
    );
    return data.responseObject;
  },

  getPublicas: async () => {
    const { data } = await apiClient.get<ApiResponse<Actividad[]>>('/actividades/publicas');
    return data.responseObject;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<Actividad>>(`/actividades/${id}`);
    return data.responseObject;
  },

  create: async (input: CreateActividadInput) => {
    const { data } = await apiClient.post<ApiResponse<Actividad>>('/actividades', input);
    return data.responseObject;
  },

  update: async (id: number, input: UpdateActividadInput) => {
    const { data } = await apiClient.put<ApiResponse<Actividad>>(`/actividades/${id}`, input);
    return data.responseObject;
  },

  cambiarEstado: async (id: number, input: CambiarEstadoActividadInput) => {
    const { data } = await apiClient.patch<ApiResponse<Actividad>>(
      `/actividades/${id}/estado`,
      input,
    );
    return data.responseObject;
  },
};
