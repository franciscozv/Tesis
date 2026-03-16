import { isAxiosError } from 'axios';

/**
 * Extrae el mensaje de error de una respuesta Axios.
 * Retorna `fallback` si el error no tiene el formato esperado.
 */
export function extractApiMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}
