import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import type {
  ESTADOS_MEMBRESIA,
  HistorialEstado,
  HistorialEstadoConUsuario,
} from './historialEstadoModel';
import { HistorialEstadoRepository } from './historialEstadoRepository';

/**
 * Servicio con lógica de negocio para Historial de Estado de Membresía
 */
export class HistorialEstadoService {
  private historialRepository: HistorialEstadoRepository;

  constructor(repository: HistorialEstadoRepository = new HistorialEstadoRepository()) {
    this.historialRepository = repository;
  }

  /**
   * Obtiene todos los registros de historial con filtros opcionales
   */
  async findAll(filters: {
    miembro_id?: number;
  }): Promise<ServiceResponse<HistorialEstado[] | null>> {
    try {
      const registros = await this.historialRepository.findAllAsync(filters);

      if (!registros) {
        return ServiceResponse.failure(
          'Error al obtener historial de estado',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (registros.length === 0) {
        return ServiceResponse.success<HistorialEstado[]>(
          'No se encontraron registros de historial de estado',
          [],
        );
      }

      return ServiceResponse.success<HistorialEstado[]>(
        'Registros de historial de estado encontrados',
        registros,
      );
    } catch (error) {
      const errorMessage = `Error al obtener historial de estado: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener historial de estado',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene historial de un miembro con datos del usuario que hizo el cambio
   */
  async findByMiembro(
    miembroId: number,
  ): Promise<ServiceResponse<HistorialEstadoConUsuario[] | null>> {
    try {
      const registros = await this.historialRepository.findByMiembroAsync(miembroId);

      if (!registros) {
        return ServiceResponse.failure(
          'Error al obtener historial de estado del miembro',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (registros.length === 0) {
        return ServiceResponse.success<HistorialEstadoConUsuario[]>(
          'No se encontraron registros de historial para este miembro',
          [],
        );
      }

      return ServiceResponse.success<HistorialEstadoConUsuario[]>(
        'Historial de estado del miembro encontrado',
        registros,
      );
    } catch (error) {
      const errorMessage = `Error al obtener historial por miembro: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener historial de estado del miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene un registro de historial por ID
   */
  async findById(id: number): Promise<ServiceResponse<HistorialEstado | null>> {
    try {
      const registro = await this.historialRepository.findByIdAsync(id);

      if (!registro) {
        return ServiceResponse.failure(
          'Registro de historial no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<HistorialEstado>('Registro de historial encontrado', registro);
    } catch (error) {
      const errorMessage = `Error al obtener registro de historial: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener registro de historial',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Registra un cambio de estado y actualiza el miembro
   */
  async create(historialData: {
    miembro_id: number;
    estado_anterior: (typeof ESTADOS_MEMBRESIA)[number];
    estado_nuevo: (typeof ESTADOS_MEMBRESIA)[number];
    motivo: string;
    usuario_id: number;
  }): Promise<ServiceResponse<HistorialEstado | null>> {
    try {
      // Validar que el miembro exista y esté activo
      const miembro = await this.historialRepository.getMiembroInfoAsync(historialData.miembro_id);
      if (!miembro.exists) {
        return ServiceResponse.failure(
          'El miembro especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Validar que el estado_anterior coincida con el estado actual del miembro
      if (miembro.estado_membresia !== historialData.estado_anterior) {
        return ServiceResponse.failure(
          `El estado anterior indicado (${historialData.estado_anterior}) no coincide con el estado actual del miembro (${miembro.estado_membresia})`,
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Validar que el usuario exista y esté activo
      const usuarioExiste = await this.historialRepository.usuarioExistsAsync(
        historialData.usuario_id,
      );
      if (!usuarioExiste) {
        return ServiceResponse.failure(
          'El usuario especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Crear el registro de historial
      const registro = await this.historialRepository.createAsync(historialData);

      // Actualizar automáticamente el estado en la tabla miembro
      await this.historialRepository.updateEstadoMiembroAsync(
        historialData.miembro_id,
        historialData.estado_nuevo,
      );

      return ServiceResponse.success<HistorialEstado>(
        'Cambio de estado registrado exitosamente',
        registro,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al registrar cambio de estado: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al registrar cambio de estado',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const historialEstadoService = new HistorialEstadoService();
