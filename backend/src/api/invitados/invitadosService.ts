import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import { InvitadosRepository } from './invitadosRepository';
import type { Invitado } from './invitadosModel';

/**
 * Servicio con lógica de negocio para Invitados
 */
export class InvitadosService {
  private invitadosRepository: InvitadosRepository;

  constructor(repository: InvitadosRepository = new InvitadosRepository()) {
    this.invitadosRepository = repository;
  }

  /**
   * Obtiene todos los invitados con filtros opcionales
   */
  async findAll(filters: {
    actividad_id?: number;
    miembro_id?: number;
    estado?: string;
  }): Promise<ServiceResponse<Invitado[] | null>> {
    try {
      const invitados = await this.invitadosRepository.findAllAsync(filters);

      if (!invitados) {
        return ServiceResponse.failure(
          'Error al obtener invitados',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      if (invitados.length === 0) {
        return ServiceResponse.success<Invitado[]>(
          'No se encontraron invitados',
          []
        );
      }

      return ServiceResponse.success<Invitado[]>('Invitados encontrados', invitados);
    } catch (error) {
      const errorMessage = `Error al obtener invitados: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener invitados',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtiene un invitado por ID
   */
  async findById(id: number): Promise<ServiceResponse<Invitado | null>> {
    try {
      const invitado = await this.invitadosRepository.findByIdAsync(id);

      if (!invitado) {
        return ServiceResponse.failure(
          'Invitado no encontrado',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      return ServiceResponse.success<Invitado>('Invitado encontrado', invitado);
    } catch (error) {
      const errorMessage = `Error al obtener invitado: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener invitado',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Crea una nueva invitación
   */
  async create(invitadoData: {
    actividad_id: number;
    miembro_id: number;
    rol_id: number;
    confirmado?: boolean;
  }): Promise<ServiceResponse<Invitado | null>> {
    try {
      // Validar que la actividad exista
      const actividadExiste = await this.invitadosRepository.actividadExistsAsync(
        invitadoData.actividad_id
      );
      if (!actividadExiste) {
        return ServiceResponse.failure(
          'La actividad especificada no existe',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que el miembro exista y esté activo
      const miembroExiste = await this.invitadosRepository.miembroExistsAsync(
        invitadoData.miembro_id
      );
      if (!miembroExiste) {
        return ServiceResponse.failure(
          'El miembro especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que el rol de actividad exista y esté activo
      const rolExiste = await this.invitadosRepository.rolActividadExistsAsync(
        invitadoData.rol_id
      );
      if (!rolExiste) {
        return ServiceResponse.failure(
          'El rol de actividad especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que no exista invitación duplicada (mismo miembro, misma actividad, mismo rol)
      const existeDuplicada = await this.invitadosRepository.existsInvitacionDuplicadaAsync(
        invitadoData.actividad_id,
        invitadoData.miembro_id,
        invitadoData.rol_id
      );
      if (existeDuplicada) {
        return ServiceResponse.failure(
          'El miembro ya tiene una invitación para esta actividad con el mismo rol',
          null,
          StatusCodes.CONFLICT
        );
      }

      const { confirmado, ...dataToInsert } = invitadoData;
      const invitado = await this.invitadosRepository.createAsync(dataToInsert, confirmado);
      return ServiceResponse.success<Invitado>(
        'Invitación creada exitosamente',
        invitado,
        StatusCodes.CREATED
      );
    } catch (error) {
      const errorMessage = `Error al crear invitación: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al crear invitación',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Miembro responde a una invitación (confirmar o rechazar)
   */
  async responder(
    id: number,
    estado: 'confirmado' | 'rechazado',
    motivo_rechazo?: string
  ): Promise<ServiceResponse<Invitado | null>> {
    try {
      const invitado = await this.invitadosRepository.findByIdAsync(id);
      if (!invitado) {
        return ServiceResponse.failure(
          'Invitado no encontrado',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      // Solo se pueden responder invitaciones pendientes
      if (invitado.estado !== 'pendiente') {
        return ServiceResponse.failure(
          `No se puede responder a una invitación en estado "${invitado.estado}"`,
          null,
          StatusCodes.CONFLICT
        );
      }

      const invitadoActualizado = await this.invitadosRepository.updateRespuestaAsync(
        id,
        estado,
        motivo_rechazo
      );

      if (!invitadoActualizado) {
        return ServiceResponse.failure(
          'Error al registrar la respuesta',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      const mensaje =
        estado === 'confirmado'
          ? 'Invitación confirmada exitosamente'
          : 'Invitación rechazada';

      return ServiceResponse.success<Invitado>(mensaje, invitadoActualizado);
    } catch (error) {
      const errorMessage = `Error al responder invitación: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al responder a la invitación',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Marca la asistencia real de un invitado
   */
  async marcarAsistencia(
    id: number,
    asistio: boolean
  ): Promise<ServiceResponse<Invitado | null>> {
    try {
      const invitado = await this.invitadosRepository.findByIdAsync(id);
      if (!invitado) {
        return ServiceResponse.failure(
          'Invitado no encontrado',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      // Solo se puede marcar asistencia de invitados confirmados
      if (invitado.estado !== 'confirmado') {
        return ServiceResponse.failure(
          'Solo se puede marcar asistencia de invitados con estado "confirmado"',
          null,
          StatusCodes.CONFLICT
        );
      }

      const invitadoActualizado = await this.invitadosRepository.updateAsistenciaAsync(
        id,
        asistio
      );

      if (!invitadoActualizado) {
        return ServiceResponse.failure(
          'Error al marcar asistencia',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      const mensaje = asistio
        ? 'Asistencia registrada exitosamente'
        : 'Inasistencia registrada exitosamente';

      return ServiceResponse.success<Invitado>(mensaje, invitadoActualizado);
    } catch (error) {
      const errorMessage = `Error al marcar asistencia: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al marcar asistencia',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Elimina una invitación (solo si está pendiente)
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      const invitado = await this.invitadosRepository.findByIdAsync(id);
      if (!invitado) {
        return ServiceResponse.failure(
          'Invitado no encontrado',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      if (invitado.estado !== 'pendiente') {
        return ServiceResponse.failure(
          'Solo se pueden eliminar invitaciones en estado "pendiente"',
          null,
          StatusCodes.CONFLICT
        );
      }

      await this.invitadosRepository.deleteAsync(id);
      return ServiceResponse.success('Invitación eliminada exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al eliminar invitación: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al eliminar invitación',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const invitadosService = new InvitadosService();
