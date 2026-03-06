import { useMutation } from '@tanstack/react-query';
import { candidatosApi } from '../api';
import type { SugerirCargoInput, SugerirCargoResponse } from '../types';

export function useSugerirCandidatosCargo() {
  return useMutation<SugerirCargoResponse, Error, SugerirCargoInput>({
    mutationFn: candidatosApi.sugerirCargo,
  });
}

