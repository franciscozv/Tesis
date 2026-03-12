import apiClient from '@/lib/api-client';
import type {
  ApiResponse,
  CambiarPasswordRequest,
  LoginRequest,
  LoginResponse,
  RecuperarPasswordRequest,
  ResetPasswordRequest,
} from '../types';

export const authApi = {
  login: async (input: LoginRequest) => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', input);
    return data;
  },

  recuperarPassword: async (input: RecuperarPasswordRequest) => {
    const { data } = await apiClient.post<ApiResponse>('/auth/recuperar-password', input);
    return data;
  },

  resetPassword: async (input: ResetPasswordRequest) => {
    const { data } = await apiClient.post<ApiResponse>('/auth/reset-password', input);
    return data;
  },

  cambiarPassword: async (input: CambiarPasswordRequest) => {
    const { data } = await apiClient.patch<ApiResponse>('/auth/cambiar-password', input);
    return data;
  },
};
