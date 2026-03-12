import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CALENDARIO_QUERY_KEY } from '@/features/calendario/hooks/use-calendario';
import { actividadesApi } from '../api';
import type { CreateActividadInput } from '../types';
import { ACTIVIDADES_QUERY_KEY } from './use-actividades';

export function useCreateActividad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateActividadInput) => actividadesApi.create(input),
    onSuccess: () => {
      // Invalidar la lista general de actividades
      queryClient.invalidateQueries({ queryKey: [ACTIVIDADES_QUERY_KEY] });
      
      // Invalidar el calendario para que la nueva actividad aparezca sin recargar
      queryClient.invalidateQueries({ queryKey: [CALENDARIO_QUERY_KEY] });
    },
  });
}
