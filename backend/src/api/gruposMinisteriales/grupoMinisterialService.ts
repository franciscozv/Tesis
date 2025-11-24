import { StatusCodes } from 'http-status-codes';

import type { GrupoMinisterial } from '@/api/gruposMinisteriales/grupoMinisterialModel';
import { GrupoMinisterialRepository } from '@/api/gruposMinisteriales/grupoMinisterialRepository';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';

/**
 * Service para lógica de negocio de Grupos Ministeriales
 */
export class GrupoMinisterialService {
  private grupoMinisterialRepository: GrupoMinisterialRepository;

  constructor(repository: GrupoMinisterialRepository = new GrupoMinisterialRepository()) {
    this.grupoMinisterialRepository = repository;
  }

  /**
   * Obtiene todos los grupos ministeriales activos
   */
  async findAll(): Promise<ServiceResponse<GrupoMinisterial[] | null>> {
    try {
      const grupos = await this.grupoMinisterialRepository.findAllAsync();

      if (!grupos || grupos.length === 0) {
        return ServiceResponse.failure(
          'No se encontraron grupos ministeriales',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<GrupoMinisterial[]>(
        'Grupos ministeriales encontrados',
        grupos,
      );
    } catch (ex) {
      const errorMessage = `Error al obtener grupos ministeriales: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al obtener los grupos ministeriales',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Busca un grupo ministerial por ID
   */
  async findById(id: number): Promise<ServiceResponse<GrupoMinisterial | null>> {
    try {
      const grupo = await this.grupoMinisterialRepository.findByIdAsync(id);

      if (!grupo) {
        return ServiceResponse.failure(
          'Grupo ministerial no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<GrupoMinisterial>('Grupo ministerial encontrado', grupo);
    } catch (ex) {
      const errorMessage = `Error al obtener grupo ministerial con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al obtener el grupo ministerial',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo grupo ministerial
   * Validaciones:
   * - El líder principal debe existir
   * - El líder debe estar activo
   * - El líder debe estar en estado plena_comunion
   * - El nombre debe ser único
   */
  async create(
    grupoData: Omit<GrupoMinisterial, 'id_grupo' | 'created_at' | 'updated_at' | 'activo'>,
  ): Promise<ServiceResponse<GrupoMinisterial | null>> {
    try {
      // Validar que el líder principal exista, esté activo y en plena_comunion
      const liderValidation = await this.grupoMinisterialRepository.validateLiderAsync(
        grupoData.lider_principal_id,
      );

      if (!liderValidation.exists) {
        return ServiceResponse.failure(
          'El líder principal no existe',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      if (!liderValidation.isActive) {
        return ServiceResponse.failure(
          'El líder principal no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      if (!liderValidation.isPlenaComunion) {
        return ServiceResponse.failure(
          'El líder principal debe estar en estado de plena comunión',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Si no se proporciona fecha_creacion, usar la fecha actual
      const dataToCreate = {
        ...grupoData,
        fecha_creacion: grupoData.fecha_creacion || new Date().toISOString().split('T')[0],
      };

      const grupo = await this.grupoMinisterialRepository.createAsync(dataToCreate);
      return ServiceResponse.success<GrupoMinisterial>(
        'Grupo ministerial creado exitosamente',
        grupo,
        StatusCodes.CREATED,
      );
    } catch (ex) {
      const errorMessage = `Error al crear grupo ministerial: ${(ex as Error).message}`;
      logger.error(errorMessage);

      // Manejar error de duplicado (nombre único)
      if ((ex as any).code === '23505') {
        return ServiceResponse.failure(
          'Ya existe un grupo ministerial con ese nombre',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Manejar error de clave foránea (líder no existe)
      if ((ex as any).code === '23503') {
        return ServiceResponse.failure(
          'El líder principal especificado no existe',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      return ServiceResponse.failure(
        'Ocurrió un error al crear el grupo ministerial',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza un grupo ministerial existente
   * Validaciones:
   * - Si se cambia el líder, debe existir, estar activo y en plena_comunion
   * - Si se cambia el nombre, debe ser único
   * - No se permite cambiar fecha_creacion
   */
  async update(
    id: number,
    grupoData: Partial<GrupoMinisterial>,
  ): Promise<ServiceResponse<GrupoMinisterial | null>> {
    try {
      // Validar que el grupo existe
      const grupoExistente = await this.grupoMinisterialRepository.findByIdAsync(id);
      if (!grupoExistente) {
        return ServiceResponse.failure(
          'Grupo ministerial no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Si se está cambiando el líder principal, validarlo
      if (
        grupoData.lider_principal_id &&
        grupoData.lider_principal_id !== grupoExistente.lider_principal_id
      ) {
        const liderValidation = await this.grupoMinisterialRepository.validateLiderAsync(
          grupoData.lider_principal_id,
        );

        if (!liderValidation.exists) {
          return ServiceResponse.failure(
            'El nuevo líder principal no existe',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }

        if (!liderValidation.isActive) {
          return ServiceResponse.failure(
            'El nuevo líder principal no está activo',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }

        if (!liderValidation.isPlenaComunion) {
          return ServiceResponse.failure(
            'El nuevo líder principal debe estar en estado de plena comunión',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
      }

      // No permitir cambiar fecha_creacion
      const dataToUpdate = { ...grupoData };
      delete (dataToUpdate as any).fecha_creacion;

      const grupo = await this.grupoMinisterialRepository.updateAsync(id, dataToUpdate);

      if (!grupo) {
        return ServiceResponse.failure(
          'Grupo ministerial no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<GrupoMinisterial>(
        'Grupo ministerial actualizado exitosamente',
        grupo,
      );
    } catch (ex) {
      const errorMessage = `Error al actualizar grupo ministerial con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);

      // Manejar error de duplicado (nombre único)
      if ((ex as any).code === '23505') {
        return ServiceResponse.failure(
          'Ya existe un grupo ministerial con ese nombre',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Manejar error de clave foránea (líder no existe)
      if ((ex as any).code === '23503') {
        return ServiceResponse.failure(
          'El líder principal especificado no existe',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      return ServiceResponse.failure(
        'Ocurrió un error al actualizar el grupo ministerial',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina lógicamente un grupo ministerial (soft delete)
   * Validación:
   * - No debe tener miembros activos (fecha_desvinculacion IS NULL en membresia_grupo)
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      // Validar que el grupo existe
      const grupoExistente = await this.grupoMinisterialRepository.findByIdAsync(id);
      if (!grupoExistente) {
        return ServiceResponse.failure(
          'Grupo ministerial no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Validar que no tiene miembros activos
      const hasActiveMembers = await this.grupoMinisterialRepository.hasActiveMembersAsync(id);
      if (hasActiveMembers) {
        return ServiceResponse.failure(
          'No se puede eliminar el grupo ministerial porque tiene miembros activos',
          null,
          StatusCodes.CONFLICT,
        );
      }

      await this.grupoMinisterialRepository.deleteAsync(id);
      return ServiceResponse.success('Grupo ministerial eliminado exitosamente', null);
    } catch (ex) {
      const errorMessage = `Error al eliminar grupo ministerial con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al eliminar el grupo ministerial',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const grupoMinisterialService = new GrupoMinisterialService();
