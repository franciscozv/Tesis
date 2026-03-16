import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { misResponsabilidadesApi } from '../api';

export const MIS_RESPONSABILIDADES_KEY = 'mis-responsabilidades';

export function useMisResponsabilidades() {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: [MIS_RESPONSABILIDADES_KEY],
    queryFn: misResponsabilidadesApi.getAll,
    enabled: !!usuario?.miembro_id,
  });
}
