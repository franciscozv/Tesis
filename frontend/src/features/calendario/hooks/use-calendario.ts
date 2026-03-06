import { useQuery } from '@tanstack/react-query';
import { calendarioApi } from '../api';

export const CALENDARIO_QUERY_KEY = 'calendario';

export function useCalendarioConsolidado(
  mes: number,
  anio: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [CALENDARIO_QUERY_KEY, 'consolidado', mes, anio],
    queryFn: () => calendarioApi.getConsolidado(mes, anio),
    enabled: options?.enabled,
  });
}

