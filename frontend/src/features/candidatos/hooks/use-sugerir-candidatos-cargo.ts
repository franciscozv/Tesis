import { useMutation } from '@tanstack/react-query';
import { candidatosApi } from '../api';

export function useSugerirCandidatosCargo() {
  return useMutation({
    mutationFn: candidatosApi.sugerirCargo,
  });
}
