import { useMutation } from '@tanstack/react-query';
import { candidatosApi } from '../api';

export function useSugerirCandidatosRol() {
  return useMutation({
    mutationFn: candidatosApi.sugerirRol,
  });
}

