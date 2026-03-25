import { useAuth } from '@/features/auth/hooks/use-auth';
import { useGrupos } from './use-grupos';
import { useMisGrupos } from './use-mis-grupos';

export function useGruposPermitidos() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';
  const { data: todosLosGrupos, ...allQuery } = useGrupos();
  const { data: misGrupos, ...misQuery } = useMisGrupos();

  return {
    // Admin: todos los grupos para gestión. Usuario: sus grupos personales.
    grupos: isAdmin ? todosLosGrupos : misGrupos,
    isLoading: isAdmin ? allQuery.isLoading : misQuery.isLoading,
    isAdmin,
    // Siempre refleja membresía personal, independiente del rol.
    misGruposIds: new Set(misGrupos?.map((g) => g.id_grupo) ?? []),
    // IDs de grupos donde el usuario es directiva.
    gruposDirectivaIds: new Set(
      misGrupos?.filter((g) => g.es_directiva_miembro).map((g) => g.id_grupo) ?? [],
    ),
    // Grupos que el usuario puede gestionar (Crear/Editar actividades)
    gruposGestionables: isAdmin
      ? todosLosGrupos
      : misGrupos?.filter((g) => g.es_directiva_miembro) ?? [],
  };
}
