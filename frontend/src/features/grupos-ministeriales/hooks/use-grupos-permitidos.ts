import { useAuth } from '@/features/auth/hooks/use-auth';
import { useGrupos } from './use-grupos';
import { useMisGrupos } from './use-mis-grupos';

export function useGruposPermitidos() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';
  const { data: todosLosGrupos, ...allQuery } = useGrupos();
  const { data: misGrupos, ...misQuery } = useMisGrupos();

  return {
    grupos: isAdmin ? todosLosGrupos : misGrupos,
    isLoading: isAdmin ? allQuery.isLoading : misQuery.isLoading,
    isAdmin,
    misGruposIds: new Set(misGrupos?.map((g) => g.id_grupo) ?? []),
  };
}

