import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import { EventosRepository } from './eventosRepository';
import type { Evento, EventoConIglesias, EstadoEvento } from './eventosModel';

interface CreateEventoData {
  tipo_evento_id: number;
  grupo_organizador_id: number;
  usuario_solicitante_id: number;
  nombre: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  ubicacion_tipo: 'iglesia' | 'otro';
  iglesia_id?: number;
  ubicacion_otra?: string;
  direccion_ubicacion?: string;
  iglesias_invitadas?: number[];
  aprobar_automaticamente?: boolean;
}

export class EventosService {
  private eventosRepository: EventosRepository;

  constructor(repository: EventosRepository = new EventosRepository()) {
    this.eventosRepository = repository;
  }

  /**
   * Obtiene todos los eventos activos
   */
  async findAll(): Promise<ServiceResponse<Evento[] | null>> {
    try {
      const eventos = await this.eventosRepository.findAllAsync();

      if (!eventos || eventos.length === 0) {
        return ServiceResponse.failure('No se encontraron eventos', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Evento[]>('Eventos encontrados', eventos);
    } catch (error) {
      const errorMessage = `Error al obtener eventos: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener eventos',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtiene un evento por ID (con iglesias invitadas)
   */
  async findById(id: number): Promise<ServiceResponse<EventoConIglesias | null>> {
    try {
      const evento = await this.eventosRepository.findByIdWithIglesiasAsync(id);

      if (!evento) {
        return ServiceResponse.failure('Evento no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<EventoConIglesias>('Evento encontrado', evento);
    } catch (error) {
      const errorMessage = `Error al obtener evento: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener evento',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Crea un nuevo evento (RF_08: Solicitar evento)
   */
  async create(eventoData: CreateEventoData): Promise<ServiceResponse<Evento | null>> {
    try {
      // Validar que tipo_evento_id exista y esté activo
      const tipoEventoExists = await this.eventosRepository.tipoEventoExistsAndActiveAsync(
        eventoData.tipo_evento_id
      );
      if (!tipoEventoExists) {
        return ServiceResponse.failure(
          'El tipo de evento especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que grupo_organizador_id exista y esté activo
      const grupoExists = await this.eventosRepository.grupoExistsAndActiveAsync(
        eventoData.grupo_organizador_id
      );
      if (!grupoExists) {
        return ServiceResponse.failure(
          'El grupo organizador especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que usuario_solicitante_id exista
      const usuarioExists = await this.eventosRepository.usuarioExistsAndActiveAsync(
        eventoData.usuario_solicitante_id
      );
      if (!usuarioExists) {
        return ServiceResponse.failure(
          'El usuario solicitante especificado no existe',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Si ubicacion_tipo es 'iglesia', validar que iglesia_id exista y esté activa
      if (eventoData.ubicacion_tipo === 'iglesia' && eventoData.iglesia_id) {
        const iglesiaExists = await this.eventosRepository.iglesiaExistsAndActiveAsync(
          eventoData.iglesia_id
        );
        if (!iglesiaExists) {
          return ServiceResponse.failure(
            'La iglesia especificada no existe o no está activa',
            null,
            StatusCodes.BAD_REQUEST
          );
        }
      }

      // Validar iglesias invitadas si vienen
      if (eventoData.iglesias_invitadas && eventoData.iglesias_invitadas.length > 0) {
        for (const iglesia_id of eventoData.iglesias_invitadas) {
          const iglesiaExists = await this.eventosRepository.iglesiaExistsAndActiveAsync(
            iglesia_id
          );
          if (!iglesiaExists) {
            return ServiceResponse.failure(
              `La iglesia invitada con ID ${iglesia_id} no existe o no está activa`,
              null,
              StatusCodes.BAD_REQUEST
            );
          }
        }
      }

      const fecha_solicitud = new Date().toISOString();
      let estado: EstadoEvento = 'pendiente_aprobacion';
      let usuario_aprobador_id: number | null = null;
      let fecha_aprobacion: string | null = null;

      // Lógica de aprobación automática
      if (eventoData.aprobar_automaticamente === true) {
        estado = 'aprobado';
        usuario_aprobador_id = eventoData.usuario_solicitante_id;
        fecha_aprobacion = fecha_solicitud;
      }

      // Preparar datos del evento
      const eventoToCreate = {
        tipo_evento_id: eventoData.tipo_evento_id,
        grupo_organizador_id: eventoData.grupo_organizador_id,
        usuario_solicitante_id: eventoData.usuario_solicitante_id,
        usuario_aprobador_id,
        nombre: eventoData.nombre,
        descripcion: eventoData.descripcion || null,
        fecha_inicio: eventoData.fecha_inicio,
        fecha_fin: eventoData.fecha_fin,
        ubicacion_tipo: eventoData.ubicacion_tipo,
        iglesia_id: eventoData.iglesia_id || null,
        ubicacion_otra: eventoData.ubicacion_otra || null,
        direccion_ubicacion: eventoData.direccion_ubicacion || null,
        estado,
        fecha_solicitud,
        fecha_aprobacion,
      };

      // Crear el evento
      const evento = await this.eventosRepository.createAsync(eventoToCreate);

      // Agregar iglesias invitadas si hay
      if (eventoData.iglesias_invitadas && eventoData.iglesias_invitadas.length > 0) {
        await this.eventosRepository.addIglesiasInvitadasAsync(
          evento.id_evento,
          eventoData.iglesias_invitadas
        );
      }

      return ServiceResponse.success<Evento>(
        'Evento creado exitosamente',
        evento,
        StatusCodes.CREATED
      );
    } catch (error) {
      const errorMessage = `Error al crear evento: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al crear evento',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Aprueba un evento
   */
  async aprobar(
    id: number,
    usuario_aprobador_id: number
  ): Promise<ServiceResponse<Evento | null>> {
    try {
      const evento = await this.eventosRepository.findByIdAsync(id);

      if (!evento) {
        return ServiceResponse.failure('Evento no encontrado', null, StatusCodes.NOT_FOUND);
      }

      if (evento.estado !== 'pendiente_aprobacion') {
        return ServiceResponse.failure(
          'Solo se pueden aprobar eventos en estado "pendiente_aprobacion"',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que el usuario aprobador exista
      const usuarioExists = await this.eventosRepository.usuarioExistsAndActiveAsync(
        usuario_aprobador_id
      );
      if (!usuarioExists) {
        return ServiceResponse.failure(
          'El usuario aprobador especificado no existe',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const eventoActualizado = await this.eventosRepository.updateAsync(id, {
        estado: 'aprobado',
        usuario_aprobador_id,
        fecha_aprobacion: new Date().toISOString(),
      });

      return ServiceResponse.success<Evento>('Evento aprobado exitosamente', eventoActualizado!);
    } catch (error) {
      const errorMessage = `Error al aprobar evento: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al aprobar evento',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Rechaza un evento
   */
  async rechazar(
    id: number,
    usuario_aprobador_id: number,
    motivo?: string
  ): Promise<ServiceResponse<Evento | null>> {
    try {
      const evento = await this.eventosRepository.findByIdAsync(id);

      if (!evento) {
        return ServiceResponse.failure('Evento no encontrado', null, StatusCodes.NOT_FOUND);
      }

      if (evento.estado !== 'pendiente_aprobacion') {
        return ServiceResponse.failure(
          'Solo se pueden rechazar eventos en estado "pendiente_aprobacion"',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que el usuario aprobador exista
      const usuarioExists = await this.eventosRepository.usuarioExistsAndActiveAsync(
        usuario_aprobador_id
      );
      if (!usuarioExists) {
        return ServiceResponse.failure(
          'El usuario aprobador especificado no existe',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const eventoActualizado = await this.eventosRepository.updateAsync(id, {
        estado: 'rechazado',
        usuario_aprobador_id,
        fecha_aprobacion: new Date().toISOString(),
      });

      return ServiceResponse.success<Evento>('Evento rechazado exitosamente', eventoActualizado!);
    } catch (error) {
      const errorMessage = `Error al rechazar evento: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al rechazar evento',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Cambia el estado de un evento
   * Validaciones de transiciones permitidas:
   * - aprobado → en_curso, cancelado
   * - en_curso → finalizado, cancelado
   * - finalizado → no cambia
   * - rechazado, cancelado → no cambian
   */
  async cambiarEstado(
    id: number,
    nuevoEstado: 'en_curso' | 'finalizado' | 'cancelado'
  ): Promise<ServiceResponse<Evento | null>> {
    try {
      const evento = await this.eventosRepository.findByIdAsync(id);

      if (!evento) {
        return ServiceResponse.failure('Evento no encontrado', null, StatusCodes.NOT_FOUND);
      }

      // Validar transiciones permitidas
      const transicionesPermitidas: Record<EstadoEvento, EstadoEvento[]> = {
        pendiente_aprobacion: [],
        aprobado: ['en_curso', 'cancelado'],
        rechazado: [],
        en_curso: ['finalizado', 'cancelado'],
        finalizado: [],
        cancelado: [],
      };

      const estadosPermitidos = transicionesPermitidas[evento.estado];

      if (!estadosPermitidos.includes(nuevoEstado)) {
        return ServiceResponse.failure(
          `No se puede cambiar de estado "${evento.estado}" a "${nuevoEstado}"`,
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const eventoActualizado = await this.eventosRepository.updateAsync(id, {
        estado: nuevoEstado,
      });

      return ServiceResponse.success<Evento>(
        'Estado del evento actualizado exitosamente',
        eventoActualizado!
      );
    } catch (error) {
      const errorMessage = `Error al cambiar estado del evento: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar estado del evento',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Elimina un evento (soft delete)
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      const deleted = await this.eventosRepository.deleteAsync(id);

      if (!deleted) {
        return ServiceResponse.failure('Evento no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success('Evento eliminado exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al eliminar evento: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al eliminar evento',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const eventosService = new EventosService();
