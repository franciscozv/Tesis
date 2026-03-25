import { useMutation, useQueryClient } from '@tanstack/react-query';
import { miembrosApi } from '../api';
import type { ResetPasswordInput, UpdateCuentaInput } from '../types';
import { MIEMBROS_QUERY_KEY } from './use-miembros';

export function useActualizarCuenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateCuentaInput }) =>
      miembrosApi.actualizarCuenta(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [MIEMBROS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MIEMBROS_QUERY_KEY, id] });
    },
  });
}

export function useResetPasswordMiembro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ResetPasswordInput }) =>
      miembrosApi.resetPassword(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [MIEMBROS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MIEMBROS_QUERY_KEY, id] });
    },
  });
}
