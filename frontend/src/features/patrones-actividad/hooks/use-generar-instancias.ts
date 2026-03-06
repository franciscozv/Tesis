import { useMutation } from '@tanstack/react-query';
import { patronesApi } from '../api';
import type { GenerarInstanciasInput } from '../types';

export function useGenerarInstancias() {
  return useMutation({
    mutationFn: (input: GenerarInstanciasInput) => patronesApi.generarInstancias(input),
  });
}

