import { useQuery } from '@tanstack/react-query';
import { historialEstadoApi } from '../api';

const HISTORIAL_ESTADO_QUERY_KEY = 'historial-estado';

export function useHistorialEstado(miembroId: number) {
  return useQuery({
    queryKey: [HISTORIAL_ESTADO_QUERY_KEY, miembroId],
    queryFn: () => historialEstadoApi.getByMiembro(miembroId),
    enabled: miembroId > 0,
  });
}
