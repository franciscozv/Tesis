import { useQuery } from '@tanstack/react-query';
import { actividadesApi } from '../api';
import type { ActividadFilters } from '../types';

export const ACTIVIDADES_QUERY_KEY = 'actividades';

export function useActividades(filters?: ActividadFilters) {
  return useQuery({
    queryKey: [ACTIVIDADES_QUERY_KEY, filters],
    queryFn: () => actividadesApi.getAll(filters),
  });
}

export function useActividad(id: number) {
  return useQuery({
    queryKey: [ACTIVIDADES_QUERY_KEY, id],
    queryFn: () => actividadesApi.getById(id),
    enabled: !!id,
  });
}
