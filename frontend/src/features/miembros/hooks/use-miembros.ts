import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { miembrosApi } from '../api';
import type { CreateMiembroInput, UpdateMiembroInput } from '../types';

const QUERY_KEY = 'miembros';

export function useMiembros() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: miembrosApi.getAll,
  });
}

export function useMiembro(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => miembrosApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateMiembro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMiembroInput) => miembrosApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateMiembro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateMiembroInput }) =>
      miembrosApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.id] });
    },
  });
}

export function useDeleteMiembro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => miembrosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}