import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api';
import type { LoginRequest } from '../types';

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: LoginRequest) => authApi.login(input),
    onSuccess: (data) => {
      localStorage.setItem('token', data.responseObject.token);
      localStorage.setItem('usuario', JSON.stringify(data.responseObject.usuario));
      document.cookie = 'auth-session=1; path=/; SameSite=Lax';
      router.push('/dashboard');
    },
  });
}

export function useRecuperarPassword() {
  return useMutation({
    mutationFn: authApi.recuperarPassword,
  });
}

export function useCambiarPassword() {
  return useMutation({
    mutationFn: authApi.cambiarPassword,
  });
}
