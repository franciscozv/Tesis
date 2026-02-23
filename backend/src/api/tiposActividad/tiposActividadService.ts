import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import type { TipoActividad } from './tiposActividadModel';
import { TiposActividadRepository } from './tiposActividadRepository';

/**
 * Servicio con lógica de negocio para Tipos de Actividad
 */
export class TiposActividadService {
  private tiposActividadRepository: TiposActividadRepository;

  constructor(repository: TiposActividadRepository = new TiposActividadRepository()) {
    this.tiposActividadRepository = repository;
  }

  /**
   * Obtiene todos los tipos de actividad activos
   */
  async findAll(activo?: boolean): Promise<ServiceResponse<TipoActividad[] | null>> {
    try {
      const tipos = await this.tiposActividadRepository.findAllAsync(activo);

      if (!tipos) {
        return ServiceResponse.failure(
          'Error al obtener tipos de actividad',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (tipos.length === 0) {
        return ServiceResponse.success<TipoActividad[]>('No se encontraron tipos de actividad', []);
      }

      return ServiceResponse.success<TipoActividad[]>('Tipos de actividad encontrados', tipos);
    } catch (error) {
      const errorMessage = `Error al obtener tipos de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener tipos de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene un tipo de actividad por ID
   */
  async findById(id: number): Promise<ServiceResponse<TipoActividad | null>> {
    try {
      const tipo = await this.tiposActividadRepository.findByIdAsync(id);

      if (!tipo) {
        return ServiceResponse.failure(
          'Tipo de actividad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<TipoActividad>('Tipo de actividad encontrado', tipo);
    } catch (error) {
      const errorMessage = `Error al obtener tipo de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener tipo de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo tipo de actividad
   */
  async create(
    tipoData: Omit<TipoActividad, 'id_tipo' | 'created_at' | 'updated_at' | 'activo'>,
  ): Promise<ServiceResponse<TipoActividad | null>> {
    try {
      // Validar que el nombre no exista
      const existeNombre = await this.tiposActividadRepository.existsByNombreAsync(tipoData.nombre);
      if (existeNombre) {
        return ServiceResponse.failure(
          'Ya existe un tipo de actividad con ese nombre',
          null,
          StatusCodes.CONFLICT,
        );
      }

      const tipo = await this.tiposActividadRepository.createAsync(tipoData);
      return ServiceResponse.success<TipoActividad>(
        'Tipo de actividad creado exitosamente',
        tipo,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al crear tipo de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al crear tipo de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza un tipo de actividad existente
   */
  async update(
    id: number,
    tipoData: Partial<TipoActividad>,
  ): Promise<ServiceResponse<TipoActividad | null>> {
    try {
      // Validar que el nombre no exista (excluyendo el tipo actual)
      if (tipoData.nombre) {
        const existeNombre = await this.tiposActividadRepository.existsByNombreAsync(
          tipoData.nombre,
          id,
        );
        if (existeNombre) {
          return ServiceResponse.failure(
            'Ya existe un tipo de actividad con ese nombre',
            null,
            StatusCodes.CONFLICT,
          );
        }
      }

      const tipo = await this.tiposActividadRepository.updateAsync(id, tipoData);

      if (!tipo) {
        return ServiceResponse.failure(
          'Tipo de actividad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<TipoActividad>(
        'Tipo de actividad actualizado exitosamente',
        tipo,
      );
    } catch (error) {
      const errorMessage = `Error al actualizar tipo de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al actualizar tipo de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cambia el estado activo/inactivo de un tipo de actividad
   */
  async toggleEstado(id: number): Promise<ServiceResponse<TipoActividad | null>> {
    try {
      const tipo = await this.tiposActividadRepository.toggleEstadoAsync(id);

      if (!tipo) {
        return ServiceResponse.failure(
          'Tipo de actividad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const estado = tipo.activo ? 'activado' : 'desactivado';
      return ServiceResponse.success<TipoActividad>(
        `Tipo de actividad ${estado} exitosamente`,
        tipo,
      );
    } catch (error) {
      const errorMessage = `Error al cambiar estado del tipo de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar estado del tipo de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina un tipo de actividad permanentemente (hard delete)
   * Solo se permite si no tiene registros asociados
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      const tipo = await this.tiposActividadRepository.findByIdAsync(id);
      if (!tipo) {
        return ServiceResponse.failure(
          'Tipo de actividad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const enUso = await this.tiposActividadRepository.isBeingUsedAsync(id);
      if (enUso) {
        return ServiceResponse.failure(
          'No se puede eliminar porque tiene actividades asociadas. Puede desactivarlo en su lugar.',
          null,
          StatusCodes.CONFLICT,
        );
      }

      await this.tiposActividadRepository.deleteAsync(id);
      return ServiceResponse.success('Tipo de actividad eliminado exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al eliminar tipo de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al eliminar tipo de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const tiposActividadService = new TiposActividadService();
