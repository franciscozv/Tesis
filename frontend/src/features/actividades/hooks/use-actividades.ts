import { useQuery } from '@tanstack/react-query';
import { actividadesApi } from '../api';
import type { ActividadFilters } from '../types';

export const ACTIVIDADES_QUERY_KEY = 'actividades';

export function useActividades(filters?: ActividadFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [ACTIVIDADES_QUERY_KEY, filters],
    queryFn: () => actividadesApi.getAll(filters),
    enabled: options?.enabled,
  });
}

export function useActividadesPublicas(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [ACTIVIDADES_QUERY_KEY, 'publicas'],
    queryFn: () => actividadesApi.getPublicas(),
    enabled: options?.enabled,
  });
}

export function useActividad(id: number) {
  return useQuery({
    queryKey: [ACTIVIDADES_QUERY_KEY, id],
    queryFn: () => actividadesApi.getById(id),
    enabled: !!id,
  });
}
