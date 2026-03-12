import { useQuery } from '@tanstack/react-query';
import { misResponsabilidadesApi } from '../api';

export const MIS_RESPONSABILIDADES_KEY = 'mis-responsabilidades';

export function useMisResponsabilidades() {
  return useQuery({
    queryKey: [MIS_RESPONSABILIDADES_KEY],
    queryFn: misResponsabilidadesApi.getAll,
  });
}
