'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { Usuario } from '../types';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function useAuth() {
  const token = useSyncExternalStore(subscribe, getToken, () => null);
  const usuario = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem('usuario'),
    () => null,
  );

  const isAuthenticated = !!token;

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.dispatchEvent(new StorageEvent('storage'));
    window.location.href = '/auth/login';
  }, []);

  return {
    token,
    usuario: usuario ? (JSON.parse(usuario) as Usuario) : null,
    isAuthenticated,
    logout,
  };
}

