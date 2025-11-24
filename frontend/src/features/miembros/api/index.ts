import apiClient from '@/lib/api-client';
import type { Miembro, CreateMiembroInput, UpdateMiembroInput } from '../types';

export const miembrosApi = {
  getAll: async () => {
    const { data } = await apiClient.get<Miembro[]>('/miembros');
    return data;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<Miembro>(`/miembros/${id}`);
    return data;
  },

  create: async (input: CreateMiembroInput) => {
    const { data } = await apiClient.post<Miembro>('/miembros', input);
    return data;
  },

  update: async (id: number, input: UpdateMiembroInput) => {
    const { data } = await apiClient.put<Miembro>(`/miembros/${id}`, input);
    return data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/miembros/${id}`);
  },
};