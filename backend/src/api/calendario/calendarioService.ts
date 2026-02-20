import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import { CalendarioRepository } from './calendarioRepository';
import type { CalendarioEvento, Responsabilidad } from './calendarioModel';

/**
 * Servicio para lógica de negocio del Calendario
 */
export class CalendarioService {
  private calendarioRepository: CalendarioRepository;

  constructor(repository: CalendarioRepository = new CalendarioRepository()) {
    this.calendarioRepository = repository;
  }

  /**
   * Obtiene el calendario público para un mes/año
   */
  async getCalendarioPublico(
    mes: number,
    anio: number
  ): Promise<ServiceResponse<CalendarioEvento[] | null>> {
    try {
      const eventos = await this.calendarioRepository.findPublicasAsync(mes, anio);

      if (!eventos) {
        return ServiceResponse.failure(
          'Error al obtener calendario público',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      if (eventos.length === 0) {
        return ServiceResponse.success<CalendarioEvento[]>(
          'No se encontraron actividades públicas para el período solicitado',
          []
        );
      }

      return ServiceResponse.success<CalendarioEvento[]>(
        'Calendario público obtenido exitosamente',
        eventos
      );
    } catch (error) {
      const errorMessage = `Error al obtener calendario público: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener calendario público',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtiene el calendario consolidado (todas las actividades programadas) para un mes/año
   */
  async getCalendarioConsolidado(
    mes: number,
    anio: number
  ): Promise<ServiceResponse<CalendarioEvento[] | null>> {
    try {
      const eventos = await this.calendarioRepository.findConsolidadoAsync(mes, anio);

      if (!eventos) {
        return ServiceResponse.failure(
          'Error al obtener calendario consolidado',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      if (eventos.length === 0) {
        return ServiceResponse.success<CalendarioEvento[]>(
          'No se encontraron actividades para el período solicitado',
          []
        );
      }

      return ServiceResponse.success<CalendarioEvento[]>(
        'Calendario consolidado obtenido exitosamente',
        eventos
      );
    } catch (error) {
      const errorMessage = `Error al obtener calendario consolidado: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener calendario consolidado',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtiene las responsabilidades futuras confirmadas de un miembro
   */
  async getMisResponsabilidades(
    miembroId: number,
    miembroIdToken: number | null
  ): Promise<ServiceResponse<Responsabilidad[] | null>> {
    try {
      // Validar que el miembro_id del token coincida con el solicitado
      if (miembroIdToken !== null && miembroIdToken !== miembroId) {
        return ServiceResponse.failure(
          'No tiene permisos para ver las responsabilidades de otro miembro',
          null,
          StatusCodes.FORBIDDEN
        );
      }

      const responsabilidades =
        await this.calendarioRepository.findResponsabilidadesAsync(miembroId);

      if (!responsabilidades) {
        return ServiceResponse.failure(
          'Error al obtener responsabilidades',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      if (responsabilidades.length === 0) {
        return ServiceResponse.success<Responsabilidad[]>(
          'No se encontraron responsabilidades para este miembro',
          []
        );
      }

      return ServiceResponse.success<Responsabilidad[]>(
        'Responsabilidades obtenidas exitosamente',
        responsabilidades
      );
    } catch (error) {
      const errorMessage = `Error al obtener responsabilidades: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener responsabilidades',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const calendarioService = new CalendarioService();
