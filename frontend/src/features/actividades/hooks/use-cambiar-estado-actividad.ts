import { useMutation, useQueryClient } from '@tanstack/react-query';
import { INVITADOS_QUERY_KEY } from '@/features/actividades/hooks/use-invitados-actividad';
import { CALENDARIO_QUERY_KEY } from '@/features/calendario/hooks/use-calendario';
import { COLABORADORES_QUERY_KEY } from '@/features/colaboradores/hooks/use-colaboradores';
import { MIS_RESPONSABILIDADES_KEY } from '@/features/mis-responsabilidades/hooks/use-mis-responsabilidades';
import { NECESIDADES_QUERY_KEY } from '@/features/necesidades/hooks/use-necesidades';
import { actividadesApi } from '../api';
import type { CambiarEstadoActividadInput } from '../types';
import { ACTIVIDADES_QUERY_KEY } from './use-actividades';

export function useCambiarEstadoActividad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CambiarEstadoActividadInput }) =>
      actividadesApi.cambiarEstado(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ACTIVIDADES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVIDADES_QUERY_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [CALENDARIO_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [INVITADOS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [COLABORADORES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [NECESIDADES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MIS_RESPONSABILIDADES_KEY] });
    },
  });
}
