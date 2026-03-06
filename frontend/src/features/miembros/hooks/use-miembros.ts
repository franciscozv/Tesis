import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { miembrosApi } from '../api';
import type { MiembrosQueryParams } from '../types';

export const MIEMBROS_QUERY_KEY = 'miembros';

export function useMiembros() {
  return useQuery({
    queryKey: [MIEMBROS_QUERY_KEY],
    queryFn: miembrosApi.getAll,
  });
}

export function useMiembro(id: number) {
  return useQuery({
    queryKey: [MIEMBROS_QUERY_KEY, id],
    queryFn: () => miembrosApi.getById(id),
    enabled: !!id,
  });
}

export function useMiembrosPaginated(params: MiembrosQueryParams) {
  return useQuery({
    queryKey: [MIEMBROS_QUERY_KEY, 'paginated', params],
    queryFn: () => miembrosApi.getAllPaginated(params),
    placeholderData: keepPreviousData,
  });
}

