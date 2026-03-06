import { StatusCodes } from 'http-status-codes';
import type { JwtPayload } from '@/common/middleware/authMiddleware';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { nowEnZona, parseActividadFin } from '@/common/utils/dateTime';
import { logger } from '@/server';
import type {
  ESTADOS_NECESIDAD,
  NecesidadAbierta,
  NecesidadLogistica,
} from './necesidadesLogisticasModel';
import { NecesidadesLogisticasRepository } from './necesidadesLogisticasRepository';

/**
 * Servicio con lógica de negocio para Necesidades Logísticas
 */
export class NecesidadesLogisticasService {
  private necesidadesRepository: NecesidadesLogisticasRepository;

  constructor(repository: NecesidadesLogisticasRepository = new NecesidadesLogisticasRepository()) {
    this.necesidadesRepository = repository;
  }

  /**
   * Obtiene todas las necesidades logísticas con filtros opcionales
   */
  async findAll(
    filters: {
      estado?: string;
      actividad_id?: number;
    },
    usuario?: JwtPayload,
  ): Promise<ServiceResponse<NecesidadLogistica[] | null>> {
    try {
      let necesidades: NecesidadLogistica[] = [];

      if (usuario?.rol === 'usuario') {
        if (!usuario.miembro_id) {
          return ServiceResponse.failure(
            'No tiene un perfil de miembro asociado para realizar esta acción',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
        necesidades = await this.necesidadesRepository.findAllForEncargadoAsync(
          filters,
          usuario.miembro_id,
        );
      } else {
        necesidades = await this.necesidadesRepository.findAllAsync(filters);
      }

      if (!necesidades) {
        return ServiceResponse.failure(
          'Error al obtener necesidades logísticas',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (necesidades.length === 0) {
        return ServiceResponse.success<NecesidadLogistica[]>(
          'No se encontraron necesidades logísticas',
          [],
        );
      }

      return ServiceResponse.success<NecesidadLogistica[]>(
        'Necesidades logísticas encontradas',
        necesidades,
      );
    } catch (error) {
      const errorMessage = `Error al obtener necesidades logísticas: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener necesidades logísticas',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene necesidades abiertas de actividades en los próximos 60 días
   * (incluye datos de actividad y tipo de necesidad embebidos)
   */
  async findAbiertas(): Promise<ServiceResponse<NecesidadAbierta[] | null>> {
    try {
      const necesidades = await this.necesidadesRepository.findAbiertasProximasAsync();

      if (!necesidades || necesidades.length === 0) {
        return ServiceResponse.success<NecesidadAbierta[]>(
          'No se encontraron necesidades logísticas abiertas',
          [],
        );
      }

      return ServiceResponse.success<NecesidadAbierta[]>(
        'Necesidades logísticas abiertas encontradas',
        necesidades,
      );
    } catch (error) {
      const errorMessage = `Error al obtener necesidades abiertas: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener necesidades logísticas abiertas',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
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
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<NecesidadLogistica>(
        'Necesidad logística encontrada',
        necesidad,
      );
    } catch (error) {
      const errorMessage = `Error al obtener necesidad logística: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener necesidad logística',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea una nueva necesidad logística
   */
  async create(
    necesidadData: Omit<
      NecesidadLogistica,
      'id' | 'fecha_registro' | 'estado' | 'cantidad_cubierta'
    >,
    usuario?: JwtPayload,
  ): Promise<ServiceResponse<NecesidadLogistica | null>> {
    try {
      // Validar que la actividad exista y obtener datos temporales
      const actividad = await this.necesidadesRepository.findActividadDatosAsync(
        necesidadData.actividad_id,
      );
      if (!actividad) {
        return ServiceResponse.failure(
          'La actividad especificada no existe',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      if (actividad.estado === 'cancelada') {
        return ServiceResponse.failure(
          'No se pueden registrar necesidades logísticas en una actividad cancelada',
          null,
          StatusCodes.CONFLICT,
        );
      }

      const finActividad = parseActividadFin(actividad.fecha, actividad.hora_fin);
      if (finActividad.isBefore(nowEnZona())) {
        return ServiceResponse.failure(
          'No se pueden registrar necesidades logísticas en una actividad que ya finalizó',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Verificar permisos: un líder solo puede gestionar necesidades de sus grupos
      if (usuario?.rol === 'usuario') {
        if (!usuario.miembro_id) {
          return ServiceResponse.failure(
            'No tiene un perfil de miembro asociado para realizar esta acción',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
        const esLider = await this.necesidadesRepository.isEncargadoDeActividadAsync(
          necesidadData.actividad_id,
          usuario.miembro_id,
        );
        if (!esLider) {
          return ServiceResponse.failure(
            'Solo puede gestionar necesidades logísticas de actividades de sus grupos',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      // Validar que el tipo de necesidad exista
      const tipoExiste = await this.necesidadesRepository.tipoNecesidadExistsAsync(
        necesidadData.tipo_necesidad_id,
      );
      if (!tipoExiste) {
        return ServiceResponse.failure(
          'El tipo de necesidad especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const necesidad = await this.necesidadesRepository.createAsync({
        ...necesidadData,
        cantidad_cubierta: 0,
      });
      return ServiceResponse.success<NecesidadLogistica>(
        'Necesidad logística creada exitosamente',
        necesidad,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al crear necesidad logística: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al crear necesidad logística',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza una necesidad logística existente
   */
  async update(
    id: number,
    necesidadData: Partial<NecesidadLogistica>,
    usuario?: JwtPayload,
  ): Promise<ServiceResponse<NecesidadLogistica | null>> {
    try {
      // Verificar que exista
      const necesidadExistente = await this.necesidadesRepository.findByIdAsync(id);
      if (!necesidadExistente) {
        return ServiceResponse.failure(
          'Necesidad logística no encontrada',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Verificar permisos: un líder solo puede gestionar necesidades de sus grupos
      if (usuario?.rol === 'usuario') {
        if (!usuario.miembro_id) {
          return ServiceResponse.failure(
            'No tiene un perfil de miembro asociado para realizar esta acción',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
        const esLider = await this.necesidadesRepository.isEncargadoDeActividadAsync(
          necesidadExistente.actividad_id,
          usuario.miembro_id,
        );
        if (!esLider) {
          return ServiceResponse.failure(
            'Solo puede gestionar necesidades logísticas de actividades de sus grupos',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      if (necesidadExistente.estado === 'cerrada') {
        return ServiceResponse.failure(
          'No se puede editar una necesidad logística en estado "cerrada"',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Validar tipo de necesidad (si se proporcionó)
      if (necesidadData.tipo_necesidad_id) {
        const tipoExiste = await this.necesidadesRepository.tipoNecesidadExistsAsync(
          necesidadData.tipo_necesidad_id,
        );
        if (!tipoExiste) {
          return ServiceResponse.failure(
            'El tipo de necesidad especificado no existe o no está activo',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
      }

      // Validar que la nueva cantidad_requerida no quede por debajo de lo ya cubierto
      if (
        necesidadData.cantidad_requerida !== undefined &&
        necesidadExistente.cantidad_cubierta > necesidadData.cantidad_requerida
      ) {
        return ServiceResponse.failure(
          'La cantidad requerida no puede ser menor a la cantidad ya cubierta',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const necesidad = await this.necesidadesRepository.updateAsync(id, necesidadData);

      if (!necesidad) {
        return ServiceResponse.failure(
          'Necesidad logística no encontrada',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Recalculate state from accepted offers (skip if manually closed)
      if (necesidad.estado !== 'cerrada') {
        const sumaCubierta = await this.necesidadesRepository.sumCantidadOfrecidaAceptadaAsync(id);
        const nuevoEstado: (typeof ESTADOS_NECESIDAD)[number] =
          sumaCubierta >= necesidad.cantidad_requerida ? 'cubierta' : 'abierta';

        if (necesidad.estado !== nuevoEstado || necesidad.cantidad_cubierta !== sumaCubierta) {
          const recalculada = await this.necesidadesRepository.updateAsync(id, {
            estado: nuevoEstado,
            cantidad_cubierta: sumaCubierta,
          });
          if (recalculada) {
            return ServiceResponse.success<NecesidadLogistica>(
              'Necesidad logística actualizada exitosamente',
              recalculada,
            );
          }
        }
      }

      return ServiceResponse.success<NecesidadLogistica>(
        'Necesidad logística actualizada exitosamente',
        necesidad,
      );
    } catch (error) {
      const errorMessage = `Error al actualizar necesidad logística: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al actualizar necesidad logística',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cambia el estado de una necesidad logística
   */
  async updateEstado(
    id: number,
    estado: (typeof ESTADOS_NECESIDAD)[number],
    usuario?: JwtPayload,
  ): Promise<ServiceResponse<NecesidadLogistica | null>> {
    try {
      const necesidad = await this.necesidadesRepository.findByIdAsync(id);
      if (!necesidad) {
        return ServiceResponse.failure(
          'Necesidad logística no encontrada',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Verificar permisos: un líder solo puede gestionar necesidades de sus grupos
      if (usuario?.rol === 'usuario') {
        if (!usuario.miembro_id) {
          return ServiceResponse.failure(
            'No tiene un perfil de miembro asociado para realizar esta acción',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
        const esLider = await this.necesidadesRepository.isEncargadoDeActividadAsync(
          necesidad.actividad_id,
          usuario.miembro_id,
        );
        if (!esLider) {
          return ServiceResponse.failure(
            'Solo puede gestionar necesidades logísticas de actividades de sus grupos',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      if (necesidad.estado === estado) {
        return ServiceResponse.failure(
          `La necesidad logística ya se encuentra en estado "${estado}"`,
          null,
          StatusCodes.CONFLICT,
        );
      }

      // No se puede reabrir una necesidad cerrada
      if (necesidad.estado === 'cerrada' && estado === 'abierta') {
        return ServiceResponse.failure(
          'No se puede reabrir una necesidad cerrada',
          null,
          StatusCodes.CONFLICT,
        );
      }

      const necesidadActualizada = await this.necesidadesRepository.updateEstadoAsync(id, estado);

      if (!necesidadActualizada) {
        return ServiceResponse.failure(
          'Error al cambiar el estado de la necesidad',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      const mensajes: Record<string, string> = {
        abierta: 'Necesidad logística reabierta exitosamente',
        cubierta: 'Necesidad logística marcada como cubierta exitosamente',
        cerrada: 'Necesidad logística cerrada exitosamente',
      };

      return ServiceResponse.success<NecesidadLogistica>(mensajes[estado], necesidadActualizada);
    } catch (error) {
      const errorMessage = `Error al cambiar estado de necesidad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar el estado de la necesidad logística',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina una necesidad logística (solo si está abierta)
   */
  async delete(id: number, usuario?: JwtPayload): Promise<ServiceResponse<null>> {
    try {
      const necesidad = await this.necesidadesRepository.findByIdAsync(id);
      if (!necesidad) {
        return ServiceResponse.failure(
          'Necesidad logística no encontrada',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Verificar permisos: un líder solo puede gestionar necesidades de sus grupos
      if (usuario?.rol === 'usuario') {
        if (!usuario.miembro_id) {
          return ServiceResponse.failure(
            'No tiene un perfil de miembro asociado para realizar esta acción',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
        const esLider = await this.necesidadesRepository.isEncargadoDeActividadAsync(
          necesidad.actividad_id,
          usuario.miembro_id,
        );
        if (!esLider) {
          return ServiceResponse.failure(
            'Solo puede gestionar necesidades logísticas de actividades de sus grupos',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      if (necesidad.estado !== 'abierta') {
        return ServiceResponse.failure(
          'Solo se pueden eliminar necesidades logísticas en estado "abierta"',
          null,
          StatusCodes.CONFLICT,
        );
      }

      const tieneAceptadas = await this.necesidadesRepository.hasColaboracionesAceptadasAsync(id);
      if (tieneAceptadas) {
        return ServiceResponse.failure(
          'No se puede eliminar una necesidad con colaboraciones aceptadas',
          null,
          StatusCodes.CONFLICT,
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
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const necesidadesLogisticasService = new NecesidadesLogisticasService();
