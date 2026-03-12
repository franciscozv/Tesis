import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface CatalogoApi<T, TCreate, TUpdate> {
  getAll: () => Promise<T[]>;
  getAllActivos: () => Promise<T[]>;
  create: (input: TCreate) => Promise<T>;
  update: (id: number, input: TUpdate) => Promise<T>;
  delete: (id: number) => Promise<void>;
  toggleEstado: (id: number) => Promise<T>;
}

function createCatalogoHooks<T, TCreate, TUpdate>(
  queryKey: string,
  api: CatalogoApi<T, TCreate, TUpdate>,
) {
  function useAll() {
    return useQuery({
      queryKey: [queryKey],
      queryFn: api.getAll,
    });
  }

  function useAllActivos() {
    return useQuery({
      queryKey: [queryKey, 'activos'],
      queryFn: api.getAllActivos,
    });
  }

  function useCreate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (input: TCreate) => api.create(input),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  function useUpdate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, input }: { id: number; input: TUpdate }) => api.update(id, input),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  function useDelete() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => api.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  function useToggleEstado() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => api.toggleEstado(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  return { useAll, useAllActivos, useCreate, useUpdate, useDelete, useToggleEstado };
}

import {
  responsabilidadesActividadApi,
  rolesGrupoApi,
  tiposActividadApi,
  tiposNecesidadApi,
} from './api';
import type {
  CreateResponsabilidadActividadInput,
  CreateRolGrupoInput,
  CreateTipoActividadInput,
  CreateTipoNecesidadInput,
  ResponsabilidadActividad,
  RolGrupo,
  TipoActividad,
  TipoNecesidad,
  UpdateResponsabilidadActividadInput,
  UpdateRolGrupoInput,
  UpdateTipoActividadInput,
  UpdateTipoNecesidadInput,
} from './types';

export const rolesGrupoHooks = createCatalogoHooks<
  RolGrupo,
  CreateRolGrupoInput,
  UpdateRolGrupoInput
>('roles-grupo', rolesGrupoApi);

export const responsabilidadesActividadHooks = createCatalogoHooks<
  ResponsabilidadActividad,
  CreateResponsabilidadActividadInput,
  UpdateResponsabilidadActividadInput
>('responsabilidades-actividad', responsabilidadesActividadApi);

export const tiposActividadHooks = createCatalogoHooks<
  TipoActividad,
  CreateTipoActividadInput,
  UpdateTipoActividadInput
>('tipos-actividad', tiposActividadApi);

export const tiposNecesidadHooks = createCatalogoHooks<
  TipoNecesidad,
  CreateTipoNecesidadInput,
  UpdateTipoNecesidadInput
>('tipos-necesidad', tiposNecesidadApi);
