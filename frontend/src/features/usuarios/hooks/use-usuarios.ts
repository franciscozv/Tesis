import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usuariosApi } from '../api';
import type { CreateUsuarioInput, PatchEstadoUsuarioInput, UpdateUsuarioInput } from '../types';

export const USUARIOS_QUERY_KEY = 'usuarios';

export function useUsuarios() {
  return useQuery({
    queryKey: [USUARIOS_QUERY_KEY],
    queryFn: usuariosApi.getAll,
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUsuarioInput) => usuariosApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USUARIOS_QUERY_KEY] });
    },
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateUsuarioInput }) =>
      usuariosApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USUARIOS_QUERY_KEY] });
    },
  });
}

export function useCambiarEstadoUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: PatchEstadoUsuarioInput }) =>
      usuariosApi.cambiarEstado(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USUARIOS_QUERY_KEY] });
    },
  });
}
