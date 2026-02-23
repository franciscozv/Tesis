import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import type { TipoNecesidad } from './tiposNecesidadModel';
import { TiposNecesidadRepository } from './tiposNecesidadRepository';

/**
 * Servicio con lógica de negocio para Tipos de Necesidad Logística
 */
export class TiposNecesidadService {
  private tiposNecesidadRepository: TiposNecesidadRepository;

  constructor(repository: TiposNecesidadRepository = new TiposNecesidadRepository()) {
    this.tiposNecesidadRepository = repository;
  }

  /**
   * Obtiene todos los tipos de necesidad activos
   */
  async findAll(activo?: boolean): Promise<ServiceResponse<TipoNecesidad[] | null>> {
    try {
      const tipos = await this.tiposNecesidadRepository.findAllAsync(activo);

      if (!tipos) {
        return ServiceResponse.failure(
          'Error al obtener tipos de necesidad',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (tipos.length === 0) {
        return ServiceResponse.success<TipoNecesidad[]>('No se encontraron tipos de necesidad', []);
      }

      return ServiceResponse.success<TipoNecesidad[]>('Tipos de necesidad encontrados', tipos);
    } catch (error) {
      const errorMessage = `Error al obtener tipos de necesidad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener tipos de necesidad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene un tipo de necesidad por ID
   */
  async findById(id: number): Promise<ServiceResponse<TipoNecesidad | null>> {
    try {
      const tipo = await this.tiposNecesidadRepository.findByIdAsync(id);

      if (!tipo) {
        return ServiceResponse.failure(
          'Tipo de necesidad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<TipoNecesidad>('Tipo de necesidad encontrado', tipo);
    } catch (error) {
      const errorMessage = `Error al obtener tipo de necesidad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener tipo de necesidad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo tipo de necesidad
   */
  async create(
    tipoData: Omit<TipoNecesidad, 'id_tipo' | 'created_at' | 'updated_at' | 'activo'>,
  ): Promise<ServiceResponse<TipoNecesidad | null>> {
    try {
      // Validar que el nombre no exista
      const existeNombre = await this.tiposNecesidadRepository.existsByNombreAsync(tipoData.nombre);
      if (existeNombre) {
        return ServiceResponse.failure(
          'Ya existe un tipo de necesidad con ese nombre',
          null,
          StatusCodes.CONFLICT,
        );
      }

      const tipo = await this.tiposNecesidadRepository.createAsync(tipoData);
      return ServiceResponse.success<TipoNecesidad>(
        'Tipo de necesidad creado exitosamente',
        tipo,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al crear tipo de necesidad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al crear tipo de necesidad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza un tipo de necesidad existente
   */
  async update(
    id: number,
    tipoData: Partial<TipoNecesidad>,
  ): Promise<ServiceResponse<TipoNecesidad | null>> {
    try {
      // Validar que el nombre no exista (excluyendo el tipo actual)
      if (tipoData.nombre) {
        const existeNombre = await this.tiposNecesidadRepository.existsByNombreAsync(
          tipoData.nombre,
          id,
        );
        if (existeNombre) {
          return ServiceResponse.failure(
            'Ya existe un tipo de necesidad con ese nombre',
            null,
            StatusCodes.CONFLICT,
          );
        }
      }

      const tipo = await this.tiposNecesidadRepository.updateAsync(id, tipoData);

      if (!tipo) {
        return ServiceResponse.failure(
          'Tipo de necesidad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<TipoNecesidad>(
        'Tipo de necesidad actualizado exitosamente',
        tipo,
      );
    } catch (error) {
      const errorMessage = `Error al actualizar tipo de necesidad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al actualizar tipo de necesidad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cambia el estado activo/inactivo de un tipo de necesidad
   */
  async toggleEstado(id: number): Promise<ServiceResponse<TipoNecesidad | null>> {
    try {
      const tipo = await this.tiposNecesidadRepository.toggleEstadoAsync(id);

      if (!tipo) {
        return ServiceResponse.failure(
          'Tipo de necesidad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const estado = tipo.activo ? 'activado' : 'desactivado';
      return ServiceResponse.success<TipoNecesidad>(
        `Tipo de necesidad ${estado} exitosamente`,
        tipo,
      );
    } catch (error) {
      const errorMessage = `Error al cambiar estado del tipo de necesidad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar estado del tipo de necesidad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina un tipo de necesidad permanentemente (hard delete)
   * Solo se permite si no tiene registros asociados
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      const tipo = await this.tiposNecesidadRepository.findByIdAsync(id);
      if (!tipo) {
        return ServiceResponse.failure(
          'Tipo de necesidad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const enUso = await this.tiposNecesidadRepository.isBeingUsedAsync(id);
      if (enUso) {
        return ServiceResponse.failure(
          'No se puede eliminar porque tiene necesidades logísticas asociadas. Puede desactivarlo en su lugar.',
          null,
          StatusCodes.CONFLICT,
        );
      }

      await this.tiposNecesidadRepository.deleteAsync(id);
      return ServiceResponse.success('Tipo de necesidad eliminado exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al eliminar tipo de necesidad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al eliminar tipo de necesidad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const tiposNecesidadService = new TiposNecesidadService();
