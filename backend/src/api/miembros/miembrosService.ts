import { StatusCodes } from 'http-status-codes';

import type { Miembro } from '@/api/miembros/miembrosModel';
import { MiembrosRepository } from '@/api/miembros/miembrosRepository';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';

/**
 * Service para lógica de negocio de Miembros
 */
export class MiembrosService {
  private miembrosRepository: MiembrosRepository;

  constructor(repository: MiembrosRepository = new MiembrosRepository()) {
    this.miembrosRepository = repository;
  }

  /**
   * Obtiene todos los miembros activos
   */
  async findAll(): Promise<ServiceResponse<Miembro[] | null>> {
    try {
      const miembros = await this.miembrosRepository.findAllAsync();

      if (!miembros || miembros.length === 0) {
        return ServiceResponse.failure('No se encontraron miembros', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Miembro[]>('Miembros encontrados', miembros);
    } catch (ex) {
      const errorMessage = `Error al obtener miembros: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al obtener los miembros',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Busca un miembro por ID
   */
  async findById(id: number): Promise<ServiceResponse<Miembro | null>> {
    try {
      const miembro = await this.miembrosRepository.findByIdAsync(id);

      if (!miembro) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Miembro>('Miembro encontrado', miembro);
    } catch (ex) {
      const errorMessage = `Error al obtener miembro con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al obtener el miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo miembro (RF_01: Registrar nuevo miembro)
   */
  async create(
    miembroData: Omit<Miembro, 'id' | 'created_at' | 'updated_at' | 'activo'>,
  ): Promise<ServiceResponse<Miembro | null>> {
    try {
      const miembro = await this.miembrosRepository.createAsync(miembroData);
      return ServiceResponse.success<Miembro>(
        'Miembro creado exitosamente',
        miembro,
        StatusCodes.CREATED,
      );
    } catch (ex) {
      const errorMessage = `Error al crear miembro: ${(ex as Error).message}`;
      logger.error(errorMessage);

      // Manejar error de duplicado (RUT o email únicos)
      if ((ex as any).code === '23505') {
        return ServiceResponse.failure(
          'Ya existe un miembro con ese RUT o email',
          null,
          StatusCodes.CONFLICT,
        );
      }

      return ServiceResponse.failure(
        'Ocurrió un error al crear el miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza un miembro existente (RF_03: Actualizar información)
   */
  async update(
    id: number,
    miembroData: Partial<Miembro>,
  ): Promise<ServiceResponse<Miembro | null>> {
    try {
      const miembro = await this.miembrosRepository.updateAsync(id, miembroData);

      if (!miembro) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Miembro>('Miembro actualizado exitosamente', miembro);
    } catch (ex) {
      const errorMessage = `Error al actualizar miembro con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);

      // Manejar error de duplicado (RUT o email únicos)
      if ((ex as any).code === '23505') {
        return ServiceResponse.failure(
          'Ya existe un miembro con ese RUT o email',
          null,
          StatusCodes.CONFLICT,
        );
      }

      return ServiceResponse.failure(
        'Ocurrió un error al actualizar el miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina lógicamente un miembro (soft delete)
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      const deleted = await this.miembrosRepository.deleteAsync(id);

      if (!deleted) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success('Miembro eliminado exitosamente', null);
    } catch (ex) {
      const errorMessage = `Error al eliminar miembro con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al eliminar el miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cambia el estado de membresía de un miembro (RF_05)
   */
  async changeEstadoMembresia(
    id: number,
    estado_membresia: string,
  ): Promise<ServiceResponse<Miembro | null>> {
    try {
      const miembro = await this.miembrosRepository.changeEstadoMembresiaAsync(
        id,
        estado_membresia,
      );

      if (!miembro) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Miembro>(
        'Estado de membresía actualizado exitosamente',
        miembro,
      );
    } catch (ex) {
      const errorMessage = `Error al cambiar estado de membresía del miembro con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al cambiar el estado de membresía',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const miembrosService = new MiembrosService();
