import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { hoyCL, nowEnZona, parseActividadFin, parseActividadInicio } from '@/common/utils/dateTime';
import { logger } from '@/server';
import type { Actividad, ESTADOS_ACTIVIDAD } from './actividadesModel';
import { ActividadesRepository } from './actividadesRepository';

/**
 * Servicio con lógica de negocio para Actividades
 */
export class ActividadesService {
  private actividadesRepository: ActividadesRepository;

  constructor(repository: ActividadesRepository = new ActividadesRepository()) {
    this.actividadesRepository = repository;
  }

  /**
   * Marca como 'realizada' toda actividad 'programada' cuyo fecha+hora_fin ya pasó.
   * Idempotente: solo transiciona programada → realizada.
   */
  private async syncProgramadasVencidas(): Promise<void> {
    try {
      const programadas = await this.actividadesRepository.findProgramadasAsync();
      const now = nowEnZona();

      const vencidasIds = programadas
        .filter(({ fecha, hora_fin }) => {
          const finActividad = parseActividadFin(fecha, hora_fin);
          return finActividad.isBefore(now);
        })
        .map(({ id }) => id);

      if (vencidasIds.length > 0) {
        await this.actividadesRepository.markManyAsRealizadaAsync(vencidasIds);
      }
    } catch (error) {
      logger.error(`Error en syncProgramadasVencidas: ${(error as Error).message}`);
    }
  }

  /**
   * Obtiene todas las actividades con filtros opcionales
   */
  async findAll(filters: {
    mes?: number;
    anio?: number;
    estado?: string;
    es_publica?: boolean;
  }): Promise<ServiceResponse<Actividad[] | null>> {
    try {
      await this.syncProgramadasVencidas();
      const actividades = await this.actividadesRepository.findAllAsync(filters);

      if (!actividades) {
        return ServiceResponse.failure(
          'Error al obtener actividades',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (actividades.length === 0) {
        return ServiceResponse.success<Actividad[]>('No se encontraron actividades', []);
      }

      const enriched = actividades.map((a) => ({
        ...a,
        tipo_actividad: (a as any).tipo_actividad ?? null,
      }));

      return ServiceResponse.success<Actividad[]>('Actividades encontradas', enriched);
    } catch (error) {
      const errorMessage = `Error al obtener actividades: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener actividades',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene solo actividades públicas programadas futuras
   */
  async findPublicas(): Promise<ServiceResponse<Actividad[] | null>> {
    try {
      await this.syncProgramadasVencidas();
      const actividades = await this.actividadesRepository.findPublicasAsync();

      if (!actividades) {
        return ServiceResponse.failure(
          'Error al obtener actividades públicas',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (actividades.length === 0) {
        return ServiceResponse.success<Actividad[]>('No se encontraron actividades públicas', []);
      }

      const enriched = actividades.map((a) => ({
        ...a,
        tipo_actividad: (a as any).tipo_actividad ?? null,
      }));

      return ServiceResponse.success<Actividad[]>('Actividades públicas encontradas', enriched);
    } catch (error) {
      const errorMessage = `Error al obtener actividades públicas: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener actividades públicas',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene una actividad por ID
   */
  async findById(id: number): Promise<ServiceResponse<Actividad | null>> {
    try {
      await this.syncProgramadasVencidas();
      const actividad = await this.actividadesRepository.findByIdAsync(id);

      if (!actividad) {
        return ServiceResponse.failure('Actividad no encontrada', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Actividad>('Actividad encontrada', actividad);
    } catch (error) {
      const errorMessage = `Error al obtener actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea una nueva actividad
   */
  async create(
    actividadData: Omit<Actividad, 'id' | 'fecha_creacion' | 'estado' | 'motivo_cancelacion'>,
    usuario?: { rol: string; miembro_id: number | null },
  ): Promise<ServiceResponse<Actividad | null>> {
    try {
      // Validar que el tipo de actividad exista
      const tipoExiste = await this.actividadesRepository.tipoActividadExistsAsync(
        actividadData.tipo_actividad_id,
      );
      if (!tipoExiste) {
        return ServiceResponse.failure(
          'El tipo de actividad especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Validar que el patrón exista (si se proporcionó)
      if (actividadData.patron_id) {
        const patronExiste = await this.actividadesRepository.patronExistsAsync(
          actividadData.patron_id,
        );
        if (!patronExiste) {
          return ServiceResponse.failure(
            'El patrón de actividad especificado no existe o no está activo',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
      }

      // Validar permisos según rol
      if (usuario?.rol === 'lider') {
        if (!actividadData.grupo_id) {
          return ServiceResponse.failure(
            'Como líder, debes asignar la actividad a uno de tus grupos.',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
        if (!usuario.miembro_id) {
          return ServiceResponse.failure(
            'Tu usuario no tiene un miembro asociado',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
        const esLider = await this.actividadesRepository.isLiderOfGrupoAsync(
          actividadData.grupo_id,
          usuario.miembro_id,
        );
        if (!esLider) {
          return ServiceResponse.failure(
            'No tienes permiso para crear actividades en este grupo.',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      // Validar que el grupo ministerial exista (si se proporcionó)
      if (actividadData.grupo_id) {
        const grupoExiste = await this.actividadesRepository.grupoExistsAsync(
          actividadData.grupo_id,
        );
        if (!grupoExiste) {
          return ServiceResponse.failure(
            'El grupo ministerial especificado no existe o no está activo',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
      }

      // Validar que el creador exista
      const creadorExiste = await this.actividadesRepository.creadorExistsAsync(
        actividadData.creador_id,
      );
      if (!creadorExiste) {
        return ServiceResponse.failure(
          'El usuario creador especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Validar que la fecha no sea anterior a hoy (zona Chile)
      if (actividadData.fecha < hoyCL()) {
        return ServiceResponse.failure(
          'La fecha de la actividad no puede ser anterior a hoy',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Validar que hora_fin sea mayor que hora_inicio
      if (actividadData.hora_fin <= actividadData.hora_inicio) {
        return ServiceResponse.failure(
          'La hora de fin debe ser posterior a la hora de inicio',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const actividad = await this.actividadesRepository.createAsync(actividadData);
      return ServiceResponse.success<Actividad>(
        'Actividad creada exitosamente',
        actividad,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al crear actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al crear actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza una actividad existente
   */
  async update(
    id: number,
    actividadData: Partial<Actividad>,
    usuario?: { rol: string; miembro_id: number | null },
  ): Promise<ServiceResponse<Actividad | null>> {
    try {
      // Verificar que la actividad exista
      const actividadExistente = await this.actividadesRepository.findByIdAsync(id);
      if (!actividadExistente) {
        return ServiceResponse.failure('Actividad no encontrada', null, StatusCodes.NOT_FOUND);
      }

      // Validar que un líder solo pueda modificar actividades de sus grupos
      if (usuario?.rol === 'lider') {
        if (!usuario.miembro_id) {
          return ServiceResponse.failure(
            'Tu usuario no tiene un miembro asociado',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
        if (!actividadExistente.grupo_id) {
          return ServiceResponse.failure(
            'No tienes permiso para modificar esta actividad',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
        const esLider = await this.actividadesRepository.isLiderOfGrupoAsync(
          actividadExistente.grupo_id,
          usuario.miembro_id,
        );
        if (!esLider) {
          return ServiceResponse.failure(
            'Solo puedes modificar actividades de grupos donde eres líder principal',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      // No permitir editar actividades que ya comenzaron (basado en fecha+hora_inicio)
      const inicioActividad = parseActividadInicio(
        actividadExistente.fecha,
        actividadExistente.hora_inicio,
      );
      const now = nowEnZona();
      if (!inicioActividad.isAfter(now)) {
        return ServiceResponse.failure(
          'No se puede editar una actividad que ya comenzó.',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Validar tipo de actividad (si se proporcionó)
      if (actividadData.tipo_actividad_id) {
        const tipoExiste = await this.actividadesRepository.tipoActividadExistsAsync(
          actividadData.tipo_actividad_id,
        );
        if (!tipoExiste) {
          return ServiceResponse.failure(
            'El tipo de actividad especificado no existe o no está activo',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
      }

      // Validar grupo ministerial (si se proporcionó)
      if (actividadData.grupo_id) {
        const grupoExiste = await this.actividadesRepository.grupoExistsAsync(
          actividadData.grupo_id,
        );
        if (!grupoExiste) {
          return ServiceResponse.failure(
            'El grupo ministerial especificado no existe o no está activo',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
      }

      // Validar horas si se proporcionaron ambas o alguna
      const horaInicio = actividadData.hora_inicio || actividadExistente.hora_inicio;
      const horaFin = actividadData.hora_fin || actividadExistente.hora_fin;
      if (horaFin <= horaInicio) {
        return ServiceResponse.failure(
          'La hora de fin debe ser posterior a la hora de inicio',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const actividad = await this.actividadesRepository.updateAsync(id, actividadData);

      if (!actividad) {
        return ServiceResponse.failure('Actividad no encontrada', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Actividad>('Actividad actualizada exitosamente', actividad);
    } catch (error) {
      const errorMessage = `Error al actualizar actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al actualizar actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cambia el estado de una actividad
   */
  async updateEstado(
    id: number,
    estado: (typeof ESTADOS_ACTIVIDAD)[number],
    motivo_cancelacion?: string,
    usuario?: { rol: string; miembro_id: number | null },
  ): Promise<ServiceResponse<Actividad | null>> {
    try {
      await this.syncProgramadasVencidas();
      // Verificar que la actividad exista
      const actividad = await this.actividadesRepository.findByIdAsync(id);
      if (!actividad) {
        return ServiceResponse.failure('Actividad no encontrada', null, StatusCodes.NOT_FOUND);
      }

      // Validar que un líder solo pueda cambiar el estado de actividades de sus grupos
      if (usuario?.rol === 'lider') {
        if (!usuario.miembro_id) {
          return ServiceResponse.failure(
            'Tu usuario no tiene un miembro asociado',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
        if (!actividad.grupo_id) {
          return ServiceResponse.failure(
            'No tienes permiso para modificar esta actividad',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
        const esLider = await this.actividadesRepository.isLiderOfGrupoAsync(
          actividad.grupo_id,
          usuario.miembro_id,
        );
        if (!esLider) {
          return ServiceResponse.failure(
            'Solo puedes cambiar el estado de actividades de grupos donde eres líder principal',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      // Validar transiciones de estado permitidas
      if (actividad.estado === estado) {
        return ServiceResponse.failure(
          `La actividad ya se encuentra en estado "${estado}"`,
          null,
          StatusCodes.CONFLICT,
        );
      }

      if (actividad.estado === 'cancelada') {
        return ServiceResponse.failure(
          'No se puede cambiar el estado de una actividad cancelada',
          null,
          StatusCodes.CONFLICT,
        );
      }

      if (actividad.estado === 'realizada' && estado === 'programada') {
        return ServiceResponse.failure(
          'No se puede volver a programar una actividad ya realizada',
          null,
          StatusCodes.CONFLICT,
        );
      }

      if (actividad.estado === 'realizada' && estado === 'cancelada') {
        if (usuario?.rol !== 'administrador') {
          return ServiceResponse.failure(
            'Solo el administrador puede cancelar una actividad ya realizada (corrección administrativa).',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      const actividadActualizada = await this.actividadesRepository.updateEstadoAsync(
        id,
        estado,
        motivo_cancelacion,
      );

      if (!actividadActualizada) {
        return ServiceResponse.failure(
          'Error al cambiar el estado de la actividad',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      const mensajes: Record<string, string> = {
        programada: 'Actividad reprogramada exitosamente',
        realizada: 'Actividad marcada como realizada exitosamente',
        cancelada: 'Actividad cancelada exitosamente',
      };

      return ServiceResponse.success<Actividad>(mensajes[estado], actividadActualizada);
    } catch (error) {
      const errorMessage = `Error al cambiar estado de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar el estado de la actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const actividadesService = new ActividadesService();
