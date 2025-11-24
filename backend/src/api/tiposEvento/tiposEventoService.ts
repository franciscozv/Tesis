import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import { TiposEventoRepository } from './tiposEventoRepository';
import type { TipoEvento } from './tiposEventoModel';

export class TiposEventoService {
  private tiposEventoRepository: TiposEventoRepository;

  constructor(repository: TiposEventoRepository = new TiposEventoRepository()) {
    this.tiposEventoRepository = repository;
  }

  /**
   * Obtiene todos los tipos de evento activos
   */
  async findAll(): Promise<ServiceResponse<TipoEvento[] | null>> {
    try {
      const tiposEvento = await this.tiposEventoRepository.findAllAsync();

      if (!tiposEvento || tiposEvento.length === 0) {
        return ServiceResponse.failure(
          'No se encontraron tipos de evento',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      return ServiceResponse.success<TipoEvento[]>('Tipos de evento encontrados', tiposEvento);
    } catch (error) {
      const errorMessage = `Error al obtener tipos de evento: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener tipos de evento',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtiene un tipo de evento por ID
   */
  async findById(id: number): Promise<ServiceResponse<TipoEvento | null>> {
    try {
      const tipoEvento = await this.tiposEventoRepository.findByIdAsync(id);

      if (!tipoEvento) {
        return ServiceResponse.failure(
          'Tipo de evento no encontrado',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      return ServiceResponse.success<TipoEvento>('Tipo de evento encontrado', tipoEvento);
    } catch (error) {
      const errorMessage = `Error al obtener tipo de evento: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener tipo de evento',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Crea un nuevo tipo de evento
   */
  async create(
    tipoEventoData: Omit<TipoEvento, 'id_tipo_evento' | 'created_at' | 'updated_at' | 'activo'>
  ): Promise<ServiceResponse<TipoEvento | null>> {
    try {
      const tipoEvento = await this.tiposEventoRepository.createAsync(tipoEventoData);
      return ServiceResponse.success<TipoEvento>(
        'Tipo de evento creado exitosamente',
        tipoEvento,
        StatusCodes.CREATED
      );
    } catch (error) {
      const errorMessage = `Error al crear tipo de evento: ${(error as Error).message}`;
      logger.error(errorMessage);

      // Manejar error de nombre duplicado (unique constraint)
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique')) {
        return ServiceResponse.failure(
          'Ya existe un tipo de evento con ese nombre',
          null,
          StatusCodes.CONFLICT
        );
      }

      return ServiceResponse.failure(
        'Error al crear tipo de evento',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Actualiza un tipo de evento existente
   */
  async update(
    id: number,
    tipoEventoData: Partial<TipoEvento>
  ): Promise<ServiceResponse<TipoEvento | null>> {
    try {
      const tipoEvento = await this.tiposEventoRepository.updateAsync(id, tipoEventoData);

      if (!tipoEvento) {
        return ServiceResponse.failure(
          'Tipo de evento no encontrado',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      return ServiceResponse.success<TipoEvento>('Tipo de evento actualizado exitosamente', tipoEvento);
    } catch (error) {
      const errorMessage = `Error al actualizar tipo de evento: ${(error as Error).message}`;
      logger.error(errorMessage);

      // Manejar error de nombre duplicado
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique')) {
        return ServiceResponse.failure(
          'Ya existe un tipo de evento con ese nombre',
          null,
          StatusCodes.CONFLICT
        );
      }

      return ServiceResponse.failure(
        'Error al actualizar tipo de evento',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Elimina un tipo de evento (soft delete)
   * Verifica que no esté siendo usado en eventos activos
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      // Verificar si el tipo está siendo usado en eventos activos
      const isUsed = await this.tiposEventoRepository.checkIfUsedInActiveEvents(id);

      if (isUsed) {
        return ServiceResponse.failure(
          'No se puede eliminar el tipo de evento porque está siendo usado en eventos activos',
          null,
          StatusCodes.CONFLICT
        );
      }

      const deleted = await this.tiposEventoRepository.deleteAsync(id);

      if (!deleted) {
        return ServiceResponse.failure(
          'Tipo de evento no encontrado',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      return ServiceResponse.success('Tipo de evento eliminado exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al eliminar tipo de evento: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al eliminar tipo de evento',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const tiposEventoService = new TiposEventoService();
