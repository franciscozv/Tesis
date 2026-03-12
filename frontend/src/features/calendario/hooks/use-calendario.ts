import { useQuery } from '@tanstack/react-query';
import { calendarioApi } from '../api';

export const CALENDARIO_QUERY_KEY = 'calendario';

export function useCalendarioConsolidado(
  mes: number,
  anio: number,
  grupoId?: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [CALENDARIO_QUERY_KEY, 'consolidado', mes, anio, grupoId],
    queryFn: () => calendarioApi.getConsolidado(mes, anio, grupoId),
    enabled: options?.enabled,
  });
}
