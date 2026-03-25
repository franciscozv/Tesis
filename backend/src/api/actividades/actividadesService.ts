import { StatusCodes } from 'http-status-codes';
import { ColaboradoresRepository } from '@/api/colaboradores/colaboradoresRepository';
import { InvitadosRepository } from '@/api/invitados/invitadosRepository';
import { NecesidadesLogisticasRepository } from '@/api/necesidadesLogisticas/necesidadesLogisticasRepository';
import { emitAndPersist } from '@/api/notificaciones/notificacionesService';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { hoyCL, nowEnZona, parseActividadFin, parseActividadInicio } from '@/common/utils/dateTime';
import { isDirectivaEnAlgunGrupo, requireEncargadoDeGrupo } from '@/common/utils/grupoPermissions';
import { logger } from '@/server';
import type {
  Actividad,
  ESTADOS_ACTIVIDAD,
  PaginatedActividadesResponse,
} from './actividadesModel';
import { ActividadesRepository } from './actividadesRepository';

/**
 * Servicio con lógica de negocio para Actividades
 */
export class ActividadesService {
  private actividadesRepository: ActividadesRepository;
  private necesidadesRepository: NecesidadesLogisticasRepository;
  private colaboradoresRepository: ColaboradoresRepository;
  private invitadosRepository: InvitadosRepository;

  constructor(
    repository: ActividadesRepository = new ActividadesRepository(),
    necesidadesRepository: NecesidadesLogisticasRepository = new NecesidadesLogisticasRepository(),
    colaboradoresRepository: ColaboradoresRepository = new ColaboradoresRepository(),
    invitadosRepository: InvitadosRepository = new InvitadosRepository(),
  ) {
    this.actividadesRepository = repository;
    this.necesidadesRepository = necesidadesRepository;
    this.colaboradoresRepository = colaboradoresRepository;
    this.invitadosRepository = invitadosRepository;
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
   * Obtiene actividades paginadas con búsqueda y filtros
   */
  async findAllPaginated(filters: {
    page?: number;
    limit?: number;
    mes?: number;
    anio?: number;
    estado?: string;
    es_publica?: boolean;
    search?: string;
    grupo_id?: number;
  }): Promise<ServiceResponse<PaginatedActividadesResponse | null>> {
    try {
      await this.syncProgramadasVencidas();
      const result = await this.actividadesRepository.findAllPaginatedAsync(filters);

      const enriched = result.data.map((a) => ({
        ...a,
        tipo_actividad: (a as any).tipo_actividad ?? null,
      }));

      return ServiceResponse.success<PaginatedActividadesResponse>('Actividades encontradas', {
        ...result,
        data: enriched,
      });
    } catch (error) {
      const errorMessage = `Error al obtener actividades paginadas: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener actividades paginadas',
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
  async findById(
    id: number,
    usuario?: { rol: string; id: number },
  ): Promise<ServiceResponse<Actividad | null>> {
    try {
      await this.syncProgramadasVencidas();
      const actividad = await this.actividadesRepository.findByIdAsync(id);

      if (!actividad) {
        return ServiceResponse.failure('Actividad no encontrada', null, StatusCodes.NOT_FOUND);
      }

      // Restricción: Si la actividad ya pasó, solo Admin o Directiva pueden verla.
      const esPasada = actividad.fecha < hoyCL();
      if (esPasada && usuario) {
        const esAdmin = usuario.rol === 'administrador';
        const esDirectiva = await isDirectivaEnAlgunGrupo(usuario.id);

        if (!esAdmin && !esDirectiva) {
          return ServiceResponse.failure(
            'No tienes permiso para ver los detalles de una actividad pasada',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
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
    usuario?: { rol: string; id: number },
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
      // Admin: bypass total. Lider: debe ser encargado vigente del grupo en integrante_grupo.
      if (usuario?.rol === 'usuario') {
        if (!actividadData.grupo_id) {
          return ServiceResponse.failure(
            'Como líder, debes asignar la actividad a uno de tus grupos.',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
        const forbidden = await requireEncargadoDeGrupo(usuario.id, actividadData.grupo_id);
        if (forbidden) return forbidden;
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
    usuario?: { rol: string; id: number },
  ): Promise<ServiceResponse<Actividad | null>> {
    try {
      // Verificar que la actividad exista
      const actividadExistente = await this.actividadesRepository.findByIdAsync(id);
      if (!actividadExistente) {
        return ServiceResponse.failure('Actividad no encontrada', null, StatusCodes.NOT_FOUND);
      }

      // Validar que un líder solo pueda modificar actividades de sus grupos
      // Admin: bypass total. Lider: debe ser encargado vigente del grupo en integrante_grupo.
      if (usuario?.rol === 'usuario') {
        if (!actividadExistente.grupo_id) {
          return ServiceResponse.failure(
            'No tienes permiso para modificar esta actividad',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
        const forbidden = await requireEncargadoDeGrupo(usuario.id, actividadExistente.grupo_id);
        if (forbidden) return forbidden;
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
        // Si el usuario es líder, validar que sea líder del nuevo grupo asignado
        if (usuario?.rol === 'usuario') {
          const forbiddenNuevoGrupo = await requireEncargadoDeGrupo(usuario.id, actividadData.grupo_id);
          if (forbiddenNuevoGrupo) {
            return ServiceResponse.failure(
              'No tienes permiso para asignar la actividad a este grupo ministerial.',
              null,
              StatusCodes.FORBIDDEN,
            );
          }
        }

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
    usuario?: { rol: string; id: number },
  ): Promise<ServiceResponse<Actividad | null>> {
    try {
      await this.syncProgramadasVencidas();
      // Verificar que la actividad exista
      const actividad = await this.actividadesRepository.findByIdAsync(id);
      if (!actividad) {
        return ServiceResponse.failure('Actividad no encontrada', null, StatusCodes.NOT_FOUND);
      }

      // Validar que un líder solo pueda cambiar el estado de actividades de sus grupos
      // Admin: bypass total. Lider: debe ser encargado vigente del grupo en integrante_grupo.
      if (usuario?.rol === 'usuario') {
        if (!actividad.grupo_id) {
          return ServiceResponse.failure(
            'No tienes permiso para modificar esta actividad',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
        const forbidden = await requireEncargadoDeGrupo(usuario.id, actividad.grupo_id);
        if (forbidden) return forbidden;
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

      if (actividad.estado === 'realizada') {
        return ServiceResponse.failure(
          'No se puede cambiar el estado de una actividad realizada',
          null,
          StatusCodes.CONFLICT,
        );
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

      // Al cancelar una actividad: cascada completa hacia necesidades y colaboradores.
      if (estado === 'cancelada') {
        let miembrosColaboradores: number[] = [];
        let miembrosInvitados: number[] = [];

        try {
          const { count: necesidadesCerradas, ids: necesidadIds } =
            await this.necesidadesRepository.closeAllByActividadAsync(id);

          if (necesidadesCerradas > 0) {
            logger.info(
              `Actividad ${id} cancelada: ${necesidadesCerradas} necesidad(es) logística(s) cerrada(s) automáticamente.`,
            );
          }

          try {
            const { count: colaboradoresEliminados, miembroIds } =
              await this.colaboradoresRepository.deleteAllByNecesidadesAsync(necesidadIds);

            miembrosColaboradores = [...new Set(miembroIds)];

            if (colaboradoresEliminados > 0) {
              logger.info(
                `Actividad ${id} cancelada: ${colaboradoresEliminados} compromiso(s) de colaboración eliminado(s) automáticamente.`,
              );
            }
          } catch (colabError) {
            logger.error(
              `Actividad ${id} cancelada y necesidades canceladas, pero falló la cancelación de colaboradores: ${(colabError as Error).message}`,
            );
          }
        } catch (needsError) {
          logger.error(
            `Actividad ${id} cancelada, pero falló la cancelación de necesidades: ${(needsError as Error).message}`,
          );
        }

        try {
          const { count: invitadosCancelados, miembroIds } =
            await this.invitadosRepository.cancelAllByActividadAsync(id);

          miembrosInvitados = [...new Set(miembroIds)];

          if (invitadosCancelados > 0) {
            logger.info(
              `Actividad ${id} cancelada: ${invitadosCancelados} invitación(es) cancelada(s) automáticamente.`,
            );
          }
        } catch (invitError) {
          logger.error(
            `Actividad ${id} cancelada, pero falló la cancelación de invitaciones: ${(invitError as Error).message}`,
          );
        }

        // Notificar a invitados y colaboradores afectados (fire-and-forget)
        const nombreActividad = actividad.nombre;
        const timestamp = Date.now();

        const notifInvitados = miembrosInvitados.map((miembroId) =>
          emitAndPersist(miembroId, {
            tipo: 'actividad_cancelada',
            mensaje: `Actividad cancelada: ${nombreActividad}`,
            detalle: 'Tu participación fue cancelada',
            href: `/dashboard/mis-responsabilidades?actividadId=${id}`,
            timestamp,
          }).catch((err) =>
            logger.warn({ err }, `[notif] error notificando invitado ${miembroId}`),
          ),
        );

        // Evitar duplicados: no notificar dos veces al mismo miembro
        const invitadosSet = new Set(miembrosInvitados);
        const miembrosColabUnicos = miembrosColaboradores.filter((id) => !invitadosSet.has(id));

        const notifColab = miembrosColabUnicos.map((miembroId) =>
          emitAndPersist(miembroId, {
            tipo: 'actividad_cancelada',
            mensaje: `Actividad cancelada: ${nombreActividad}`,
            detalle: 'Tu oferta de colaboración fue cancelada',
            href: `/dashboard/mis-responsabilidades?actividadId=${id}`,
            timestamp,
          }).catch((err) =>
            logger.warn({ err }, `[notif] error notificando colaborador ${miembroId}`),
          ),
        );

        Promise.all([...notifInvitados, ...notifColab]).catch(() => {});
      }

      const mensajes: Record<string, string> = {
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

  /**
   * Duplica una actividad cancelada con nueva fecha/hora (reprogramar)
   * Copia solo datos base: NO copia necesidades, invitaciones ni colaboraciones
   */
  async duplicar(
    id: number,
    datos: { fecha: string; hora_inicio: string; hora_fin: string },
    usuario?: { rol: string; id: number },
  ): Promise<ServiceResponse<Actividad | null>> {
    try {
      const original = await this.actividadesRepository.findByIdAsync(id);
      if (!original) {
        return ServiceResponse.failure('Actividad no encontrada', null, StatusCodes.NOT_FOUND);
      }

      if (original.estado !== 'cancelada') {
        return ServiceResponse.failure(
          'Solo se pueden reprogramar actividades canceladas',
          null,
          StatusCodes.CONFLICT,
        );
      }

      if (original.reprogramada_en_id) {
        return ServiceResponse.failure(
          'Esta actividad ya fue reprogramada anteriormente',
          null,
          StatusCodes.CONFLICT,
        );
      }

      if (usuario?.rol === 'usuario') {
        if (!original.grupo_id) {
          return ServiceResponse.failure(
            'No tienes permiso para reprogramar esta actividad',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
        const forbidden = await requireEncargadoDeGrupo(usuario.id, original.grupo_id);
        if (forbidden) return forbidden;
      }

      if (datos.fecha < hoyCL()) {
        return ServiceResponse.failure(
          'La nueva fecha no puede ser anterior a hoy',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      if (datos.hora_fin <= datos.hora_inicio) {
        return ServiceResponse.failure(
          'La hora de fin debe ser posterior a la hora de inicio',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const nuevaActividad = await this.actividadesRepository.createAsync({
        patron_id: original.patron_id,
        tipo_actividad_id: original.tipo_actividad_id,
        nombre: original.nombre,
        descripcion: original.descripcion,
        fecha: datos.fecha,
        hora_inicio: datos.hora_inicio,
        hora_fin: datos.hora_fin,
        lugar: original.lugar,
        grupo_id: original.grupo_id,
        es_publica: original.es_publica,
        creador_id: usuario?.id ?? original.creador_id,
      });

      await this.actividadesRepository.setReprogramadaEnAsync(id, nuevaActividad.id);

      // Notificar a los ex-invitados de la actividad cancelada (fire-and-forget)
      try {
        const miembrosNotificar =
          await this.invitadosRepository.findMiembroIdsCanceladosByActividadAsync(id);

        if (miembrosNotificar.length > 0) {
          const fechaFormateada = new Date(`${datos.fecha}T12:00:00`).toLocaleDateString('es-CL', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });

          const notifs = miembrosNotificar.map((miembroId) =>
            emitAndPersist(miembroId, {
              tipo: 'actividad_reprogramada',
              mensaje: `Actividad reprogramada: ${original.nombre}`,
              detalle: `Nueva fecha: ${fechaFormateada}`,
              href: `/dashboard/actividades/${nuevaActividad.id}`,
              timestamp: Date.now(),
            }).catch((err) =>
              logger.warn({ err }, `[notif] error notificando reprogramación a ${miembroId}`),
            ),
          );

          Promise.all(notifs).catch(() => {});

          logger.info(
            `Actividad ${id} reprogramada: notificación enviada a ${miembrosNotificar.length} ex-invitado(s).`,
          );
        }
      } catch (notifError) {
        logger.warn(
          `[notif] error al obtener ex-invitados para notificar reprogramación: ${(notifError as Error).message}`,
        );
      }

      return ServiceResponse.success<Actividad>(
        'Actividad reprogramada exitosamente',
        nuevaActividad,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al reprogramar actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al reprogramar actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const actividadesService = new ActividadesService();
