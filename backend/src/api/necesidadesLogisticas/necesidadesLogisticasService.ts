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
 * Servicio con lógica de negocio para Necesidades Materiales
 */
export class NecesidadesLogisticasService {
  private necesidadesRepository: NecesidadesLogisticasRepository;

  constructor(repository: NecesidadesLogisticasRepository = new NecesidadesLogisticasRepository()) {
    this.necesidadesRepository = repository;
  }

  /**
   * Obtiene todas las necesidades materiales con filtros opcionales
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
        necesidades = await this.necesidadesRepository.findAllForEncargadoAsync(
          filters,
          usuario.id,
        );
      } else {
        necesidades = await this.necesidadesRepository.findAllAsync(filters);
      }

      if (!necesidades) {
        return ServiceResponse.failure(
          'Error al obtener necesidades materiales',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (necesidades.length === 0) {
        return ServiceResponse.success<NecesidadLogistica[]>(
          'No se encontraron necesidades materiales',
          [],
        );
      }

      return ServiceResponse.success<NecesidadLogistica[]>(
        'Necesidades materiales encontradas',
        necesidades,
      );
    } catch (error) {
      const errorMessage = `Error al obtener necesidades materiales: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener necesidades materiales',
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
          'No se encontraron necesidades materiales abiertas',
          [],
        );
      }

      return ServiceResponse.success<NecesidadAbierta[]>(
        'Necesidades materiales abiertas encontradas',
        necesidades,
      );
    } catch (error) {
      const errorMessage = `Error al obtener necesidades abiertas: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener necesidades materiales abiertas',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene una necesidad material por ID
   */
  async findById(id: number): Promise<ServiceResponse<NecesidadLogistica | null>> {
    try {
      const necesidad = await this.necesidadesRepository.findByIdAsync(id);

      if (!necesidad) {
        return ServiceResponse.failure(
          'Necesidad material no encontrada',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<NecesidadLogistica>(
        'Necesidad material encontrada',
        necesidad,
      );
    } catch (error) {
      const errorMessage = `Error al obtener necesidad material: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener necesidad material',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea una nueva necesidad material
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
          'No se pueden registrar necesidades materiales en una actividad cancelada',
          null,
          StatusCodes.CONFLICT,
        );
      }

      const finActividad = parseActividadFin(actividad.fecha, actividad.hora_fin);
      if (finActividad.isBefore(nowEnZona())) {
        return ServiceResponse.failure(
          'No se pueden registrar necesidades materiales en una actividad que ya finalizó',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Verificar permisos: un líder solo puede gestionar necesidades de sus grupos
      if (usuario?.rol === 'usuario') {
        const esLider = await this.necesidadesRepository.isEncargadoDeActividadAsync(
          necesidadData.actividad_id,
          usuario.id,
        );
        if (!esLider) {
          return ServiceResponse.failure(
            'Solo puede gestionar necesidades materiales de actividades de sus grupos',
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
        'Necesidad material creada exitosamente',
        necesidad,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al crear necesidad material: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al crear necesidad material',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza una necesidad material existente
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
          'Necesidad material no encontrada',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Verificar permisos: un líder solo puede gestionar necesidades de sus grupos
      if (usuario?.rol === 'usuario') {
        const esLider = await this.necesidadesRepository.isEncargadoDeActividadAsync(
          necesidadExistente.actividad_id,
          usuario.id,
        );
        if (!esLider) {
          return ServiceResponse.failure(
            'Solo puede gestionar necesidades materiales de actividades de sus grupos',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      if (necesidadExistente.estado === 'cerrada' || necesidadExistente.estado === 'cancelada') {
        return ServiceResponse.failure(
          `No se puede editar una necesidad material en estado "${necesidadExistente.estado}"`,
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
          'Necesidad material no encontrada',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Recalculate state from committed amounts (skip if manually closed)
      if (necesidad.estado !== 'cerrada') {
        const sumaCubierta = await this.necesidadesRepository.sumCantidadCompromisosAsync(id);
        const nuevoEstado: (typeof ESTADOS_NECESIDAD)[number] =
          sumaCubierta >= necesidad.cantidad_requerida ? 'cubierta' : 'abierta';

        if (necesidad.estado !== nuevoEstado || necesidad.cantidad_cubierta !== sumaCubierta) {
          const recalculada = await this.necesidadesRepository.updateAsync(id, {
            estado: nuevoEstado,
            cantidad_cubierta: sumaCubierta,
          });
          if (recalculada) {
            return ServiceResponse.success<NecesidadLogistica>(
              'Necesidad material actualizada exitosamente',
              recalculada,
            );
          }
        }
      }

      return ServiceResponse.success<NecesidadLogistica>(
        'Necesidad material actualizada exitosamente',
        necesidad,
      );
    } catch (error) {
      const errorMessage = `Error al actualizar necesidad material: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al actualizar necesidad material',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cambia el estado de una necesidad material
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
          'Necesidad material no encontrada',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Verificar permisos: un líder solo puede gestionar necesidades de sus grupos
      if (usuario?.rol === 'usuario') {
        const esLider = await this.necesidadesRepository.isEncargadoDeActividadAsync(
          necesidad.actividad_id,
          usuario.id,
        );
        if (!esLider) {
          return ServiceResponse.failure(
            'Solo puede gestionar necesidades materiales de actividades de sus grupos',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      if (necesidad.estado === estado) {
        return ServiceResponse.failure(
          `La necesidad material ya se encuentra en estado "${estado}"`,
          null,
          StatusCodes.CONFLICT,
        );
      }

      // No se puede reabrir una necesidad cerrada o cancelada
      if (
        (necesidad.estado === 'cerrada' || necesidad.estado === 'cancelada') &&
        estado === 'abierta'
      ) {
        return ServiceResponse.failure(
          `No se puede reabrir una necesidad en estado "${necesidad.estado}"`,
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
        abierta: 'Necesidad material reabierta exitosamente',
        cubierta: 'Necesidad material marcada como cubierta exitosamente',
        cerrada: 'Necesidad material cerrada exitosamente',
      };

      return ServiceResponse.success<NecesidadLogistica>(mensajes[estado], necesidadActualizada);
    } catch (error) {
      const errorMessage = `Error al cambiar estado de necesidad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar el estado de la necesidad material',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina una necesidad material (solo si está abierta)
   */
  async delete(id: number, usuario?: JwtPayload): Promise<ServiceResponse<null>> {
    try {
      const necesidad = await this.necesidadesRepository.findByIdAsync(id);
      if (!necesidad) {
        return ServiceResponse.failure(
          'Necesidad material no encontrada',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Verificar permisos: un líder solo puede gestionar necesidades de sus grupos
      if (usuario?.rol === 'usuario') {
        const esLider = await this.necesidadesRepository.isEncargadoDeActividadAsync(
          necesidad.actividad_id,
          usuario.id,
        );
        if (!esLider) {
          return ServiceResponse.failure(
            'Solo puede gestionar necesidades materiales de actividades de sus grupos',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      if (necesidad.estado !== 'abierta') {
        return ServiceResponse.failure(
          'Solo se pueden eliminar necesidades materiales en estado "abierta"',
          null,
          StatusCodes.CONFLICT,
        );
      }

      const tieneColaboraciones = await this.necesidadesRepository.hasColaboracionesAsync(id);
      if (tieneColaboraciones) {
        return ServiceResponse.failure(
          'No se puede eliminar una necesidad con colaboraciones registradas',
          null,
          StatusCodes.CONFLICT,
        );
      }

      await this.necesidadesRepository.deleteAsync(id);
      return ServiceResponse.success('Necesidad material eliminada exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al eliminar necesidad material: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al eliminar necesidad material',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const necesidadesLogisticasService = new NecesidadesLogisticasService();
