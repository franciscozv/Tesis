import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import { NecesidadesLogisticasRepository } from './necesidadesLogisticasRepository';
import type { NecesidadLogistica, ESTADOS_NECESIDAD } from './necesidadesLogisticasModel';

/**
 * Servicio con lógica de negocio para Necesidades Logísticas
 */
export class NecesidadesLogisticasService {
  private necesidadesRepository: NecesidadesLogisticasRepository;

  constructor(
    repository: NecesidadesLogisticasRepository = new NecesidadesLogisticasRepository()
  ) {
    this.necesidadesRepository = repository;
  }

  /**
   * Obtiene todas las necesidades logísticas con filtros opcionales
   */
  async findAll(filters: {
    estado?: string;
    actividad_id?: number;
  }): Promise<ServiceResponse<NecesidadLogistica[] | null>> {
    try {
      const necesidades = await this.necesidadesRepository.findAllAsync(filters);

      if (!necesidades) {
        return ServiceResponse.failure(
          'Error al obtener necesidades logísticas',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      if (necesidades.length === 0) {
        return ServiceResponse.success<NecesidadLogistica[]>(
          'No se encontraron necesidades logísticas',
          []
        );
      }

      return ServiceResponse.success<NecesidadLogistica[]>(
        'Necesidades logísticas encontradas',
        necesidades
      );
    } catch (error) {
      const errorMessage = `Error al obtener necesidades logísticas: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener necesidades logísticas',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtiene necesidades abiertas de actividades en los próximos 60 días
   */
  async findAbiertas(): Promise<ServiceResponse<NecesidadLogistica[] | null>> {
    try {
      const necesidades = await this.necesidadesRepository.findAbiertasProximasAsync();

      if (!necesidades || necesidades.length === 0) {
        return ServiceResponse.success<NecesidadLogistica[]>(
          'No se encontraron necesidades logísticas abiertas',
          []
        );
      }

      return ServiceResponse.success<NecesidadLogistica[]>(
        'Necesidades logísticas abiertas encontradas',
        necesidades
      );
    } catch (error) {
      const errorMessage = `Error al obtener necesidades abiertas: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener necesidades logísticas abiertas',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtiene una necesidad logística por ID
   */
  async findById(id: number): Promise<ServiceResponse<NecesidadLogistica | null>> {
    try {
      const necesidad = await this.necesidadesRepository.findByIdAsync(id);

      if (!necesidad) {
        return ServiceResponse.failure(
          'Necesidad logística no encontrada',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      return ServiceResponse.success<NecesidadLogistica>(
        'Necesidad logística encontrada',
        necesidad
      );
    } catch (error) {
      const errorMessage = `Error al obtener necesidad logística: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener necesidad logística',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Crea una nueva necesidad logística
   */
  async create(
    necesidadData: Omit<NecesidadLogistica, 'id' | 'fecha_registro' | 'estado'>
  ): Promise<ServiceResponse<NecesidadLogistica | null>> {
    try {
      // Validar que la actividad exista
      const actividadExiste = await this.necesidadesRepository.actividadExistsAsync(
        necesidadData.actividad_id
      );
      if (!actividadExiste) {
        return ServiceResponse.failure(
          'La actividad especificada no existe',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que el tipo de necesidad exista
      const tipoExiste = await this.necesidadesRepository.tipoNecesidadExistsAsync(
        necesidadData.tipo_necesidad_id
      );
      if (!tipoExiste) {
        return ServiceResponse.failure(
          'El tipo de necesidad especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que cantidad_cubierta no supere cantidad_requerida
      if (necesidadData.cantidad_cubierta > necesidadData.cantidad_requerida) {
        return ServiceResponse.failure(
          'La cantidad cubierta no puede superar la cantidad requerida',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const necesidad = await this.necesidadesRepository.createAsync(necesidadData);
      return ServiceResponse.success<NecesidadLogistica>(
        'Necesidad logística creada exitosamente',
        necesidad,
        StatusCodes.CREATED
      );
    } catch (error) {
      const errorMessage = `Error al crear necesidad logística: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al crear necesidad logística',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Actualiza una necesidad logística existente
   */
  async update(
    id: number,
    necesidadData: Partial<NecesidadLogistica>
  ): Promise<ServiceResponse<NecesidadLogistica | null>> {
    try {
      // Verificar que exista
      const necesidadExistente = await this.necesidadesRepository.findByIdAsync(id);
      if (!necesidadExistente) {
        return ServiceResponse.failure(
          'Necesidad logística no encontrada',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      // Validar tipo de necesidad (si se proporcionó)
      if (necesidadData.tipo_necesidad_id) {
        const tipoExiste = await this.necesidadesRepository.tipoNecesidadExistsAsync(
          necesidadData.tipo_necesidad_id
        );
        if (!tipoExiste) {
          return ServiceResponse.failure(
            'El tipo de necesidad especificado no existe o no está activo',
            null,
            StatusCodes.BAD_REQUEST
          );
        }
      }

      // Validar que cantidad_cubierta no supere cantidad_requerida
      const cantidadRequerida =
        necesidadData.cantidad_requerida ?? necesidadExistente.cantidad_requerida;
      const cantidadCubierta =
        necesidadData.cantidad_cubierta ?? necesidadExistente.cantidad_cubierta;

      if (cantidadCubierta > cantidadRequerida) {
        return ServiceResponse.failure(
          'La cantidad cubierta no puede superar la cantidad requerida',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const necesidad = await this.necesidadesRepository.updateAsync(id, necesidadData);

      if (!necesidad) {
        return ServiceResponse.failure(
          'Necesidad logística no encontrada',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      return ServiceResponse.success<NecesidadLogistica>(
        'Necesidad logística actualizada exitosamente',
        necesidad
      );
    } catch (error) {
      const errorMessage = `Error al actualizar necesidad logística: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al actualizar necesidad logística',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Cambia el estado de una necesidad logística
   */
  async updateEstado(
    id: number,
    estado: (typeof ESTADOS_NECESIDAD)[number]
  ): Promise<ServiceResponse<NecesidadLogistica | null>> {
    try {
      const necesidad = await this.necesidadesRepository.findByIdAsync(id);
      if (!necesidad) {
        return ServiceResponse.failure(
          'Necesidad logística no encontrada',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      if (necesidad.estado === estado) {
        return ServiceResponse.failure(
          `La necesidad logística ya se encuentra en estado "${estado}"`,
          null,
          StatusCodes.CONFLICT
        );
      }

      // No se puede reabrir una necesidad cerrada
      if (necesidad.estado === 'cerrada' && estado === 'abierta') {
        return ServiceResponse.failure(
          'No se puede reabrir una necesidad cerrada',
          null,
          StatusCodes.CONFLICT
        );
      }

      const necesidadActualizada = await this.necesidadesRepository.updateEstadoAsync(id, estado);

      if (!necesidadActualizada) {
        return ServiceResponse.failure(
          'Error al cambiar el estado de la necesidad',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      const mensajes: Record<string, string> = {
        abierta: 'Necesidad logística reabierta exitosamente',
        cubierta: 'Necesidad logística marcada como cubierta exitosamente',
        cerrada: 'Necesidad logística cerrada exitosamente',
      };

      return ServiceResponse.success<NecesidadLogistica>(
        mensajes[estado],
        necesidadActualizada
      );
    } catch (error) {
      const errorMessage = `Error al cambiar estado de necesidad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar el estado de la necesidad logística',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Elimina una necesidad logística (solo si está abierta)
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      const necesidad = await this.necesidadesRepository.findByIdAsync(id);
      if (!necesidad) {
        return ServiceResponse.failure(
          'Necesidad logística no encontrada',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      if (necesidad.estado !== 'abierta') {
        return ServiceResponse.failure(
          'Solo se pueden eliminar necesidades logísticas en estado "abierta"',
          null,
          StatusCodes.CONFLICT
        );
      }

      await this.necesidadesRepository.deleteAsync(id);
      return ServiceResponse.success('Necesidad logística eliminada exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al eliminar necesidad logística: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al eliminar necesidad logística',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const necesidadesLogisticasService = new NecesidadesLogisticasService();
