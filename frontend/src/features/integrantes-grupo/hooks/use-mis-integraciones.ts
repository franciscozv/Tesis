import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { integranteGrupoApi } from '../api';

export function useMisIntegraciones() {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: ['mis-integraciones', usuario?.id],
    queryFn: () => integranteGrupoApi.getByMiembro(usuario!.id),
    enabled: !!usuario?.id && usuario.rol !== 'administrador',
  });
}
