import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { StatusCodes } from 'http-status-codes';
import { ActividadesRepository } from '@/api/actividades/actividadesRepository';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import type { GenerarInstanciasResponse, PatronActividad } from './patronesActividadModel';
import { PatronesActividadRepository } from './patronesActividadRepository';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Servicio con lógica de negocio para Patrones de Actividad
 */
export class PatronesActividadService {
  private patronesActividadRepository: PatronesActividadRepository;
  private actividadesRepository: ActividadesRepository;

  constructor(
    repository: PatronesActividadRepository = new PatronesActividadRepository(),
    actividadesRepo: ActividadesRepository = new ActividadesRepository(),
  ) {
    this.patronesActividadRepository = repository;
    this.actividadesRepository = actividadesRepo;
  }

  /**
   * Obtiene todos los patrones de actividad activos
   */
  async findAll(): Promise<ServiceResponse<PatronActividad[] | null>> {
    try {
      const patrones = await this.patronesActividadRepository.findAllAsync();

      if (!patrones || patrones.length === 0) {
        return ServiceResponse.success<PatronActividad[]>(
          'No se encontraron patrones de actividad',
          [],
        );
      }

      return ServiceResponse.success<PatronActividad[]>(
        'Patrones de actividad encontrados',
        patrones,
      );
    } catch (error) {
      const errorMessage = `Error al obtener patrones de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener patrones de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene un patrón de actividad por ID
   */
  async findById(id: number): Promise<ServiceResponse<PatronActividad | null>> {
    try {
      const patron = await this.patronesActividadRepository.findByIdAsync(id);

      if (!patron) {
        return ServiceResponse.failure(
          'Patrón de actividad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<PatronActividad>('Patrón de actividad encontrado', patron);
    } catch (error) {
      const errorMessage = `Error al obtener patrón de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener patrón de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo patrón de actividad
   */
  async create(
    patronData: Omit<PatronActividad, 'id' | 'fecha_creacion' | 'activo'>,
  ): Promise<ServiceResponse<PatronActividad | null>> {
    try {
      // Validar nombre único
      const existeNombre = await this.patronesActividadRepository.existsByNombreAsync(
        patronData.nombre,
      );
      if (existeNombre) {
        return ServiceResponse.failure(
          'Ya existe un patrón de actividad con ese nombre',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Validar que el tipo de actividad exista
      const tipoExiste = await this.patronesActividadRepository.tipoActividadExistsAsync(
        patronData.tipo_actividad_id,
      );
      if (!tipoExiste) {
        return ServiceResponse.failure(
          'El tipo de actividad especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Validar que el grupo ministerial exista (si se proporcionó)
      if (patronData.grupo_id) {
        const grupoExiste = await this.patronesActividadRepository.grupoExistsAsync(
          patronData.grupo_id,
        );
        if (!grupoExiste) {
          return ServiceResponse.failure(
            'El grupo ministerial especificado no existe o no está activo',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
      }

      const patron = await this.patronesActividadRepository.createAsync(patronData);
      return ServiceResponse.success<PatronActividad>(
        'Patrón de actividad creado exitosamente',
        patron,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al crear patrón de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al crear patrón de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza un patrón de actividad existente
   */
  async update(
    id: number,
    patronData: Partial<PatronActividad>,
  ): Promise<ServiceResponse<PatronActividad | null>> {
    try {
      // Validar nombre único (excluyendo el actual)
      if (patronData.nombre) {
        const existeNombre = await this.patronesActividadRepository.existsByNombreAsync(
          patronData.nombre,
          id,
        );
        if (existeNombre) {
          return ServiceResponse.failure(
            'Ya existe un patrón de actividad con ese nombre',
            null,
            StatusCodes.CONFLICT,
          );
        }
      }

      // Validar que el tipo de actividad exista (si se proporcionó)
      if (patronData.tipo_actividad_id) {
        const tipoExiste = await this.patronesActividadRepository.tipoActividadExistsAsync(
          patronData.tipo_actividad_id,
        );
        if (!tipoExiste) {
          return ServiceResponse.failure(
            'El tipo de actividad especificado no existe o no está activo',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
      }

      // Validar que el grupo ministerial exista (si se proporcionó)
      if (patronData.grupo_id) {
        const grupoExiste = await this.patronesActividadRepository.grupoExistsAsync(
          patronData.grupo_id,
        );
        if (!grupoExiste) {
          return ServiceResponse.failure(
            'El grupo ministerial especificado no existe o no está activo',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
      }

      const patron = await this.patronesActividadRepository.updateAsync(id, patronData);

      if (!patron) {
        return ServiceResponse.failure(
          'Patrón de actividad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<PatronActividad>(
        'Patrón de actividad actualizado exitosamente',
        patron,
      );
    } catch (error) {
      const errorMessage = `Error al actualizar patrón de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al actualizar patrón de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Activa o desactiva un patrón de actividad
   */
  async updateEstado(
    id: number,
    activo: boolean,
  ): Promise<ServiceResponse<PatronActividad | null>> {
    try {
      // Verificar que el patrón exista
      const patron = await this.patronesActividadRepository.findByIdIncludingInactiveAsync(id);
      if (!patron) {
        return ServiceResponse.failure(
          'Patrón de actividad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      if (patron.activo === activo) {
        const estado = activo ? 'activo' : 'inactivo';
        return ServiceResponse.failure(
          `El patrón de actividad ya se encuentra ${estado}`,
          null,
          StatusCodes.CONFLICT,
        );
      }

      const patronActualizado = await this.patronesActividadRepository.updateEstadoAsync(
        id,
        activo,
      );

      if (!patronActualizado) {
        return ServiceResponse.failure(
          'Error al cambiar el estado del patrón',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      const mensaje = activo
        ? 'Patrón de actividad activado exitosamente'
        : 'Patrón de actividad desactivado exitosamente';

      return ServiceResponse.success<PatronActividad>(mensaje, patronActualizado);
    } catch (error) {
      const errorMessage = `Error al cambiar estado del patrón: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar el estado del patrón de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
  /**
   * Genera instancias de actividades a partir de los patrones activos para un mes/año dado
   */
  async generarInstancias(
    mes: number,
    anio: number,
    creadorId: number,
  ): Promise<ServiceResponse<GenerarInstanciasResponse | null>> {
    try {
      const patrones = await this.patronesActividadRepository.findAllAsync();

      if (!patrones || patrones.length === 0) {
        return ServiceResponse.failure(
          'No hay patrones de actividad activos para generar instancias',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Blindaje backend: impedir creación de actividades si algún tipo quedó inactivo.
      const tipoIdsUnicos = [...new Set(patrones.map((p) => p.tipo_actividad_id))];
      const tiposValidos = await Promise.all(
        tipoIdsUnicos.map(async (tipoId) => ({
          tipoId,
          activo: await this.actividadesRepository.tipoActividadExistsAsync(tipoId),
        })),
      );
      const tiposInvalidos = tiposValidos.filter((t) => !t.activo).map((t) => t.tipoId);
      if (tiposInvalidos.length > 0) {
        return ServiceResponse.failure(
          `No se pueden generar actividades: hay tipos de actividad inactivos (${tiposInvalidos.join(', ')}).`,
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const detalle: GenerarInstanciasResponse['detalle'] = [];
      const todasLasActividades: Parameters<ActividadesRepository['createManyAsync']>[0] = [];

      for (const patron of patrones) {
        const fechas = this.calcularFechas(patron.frecuencia, patron.dia_semana, mes, anio);

        const actividadesDelPatron = fechas.map((fecha) => {
          const horaInicio = patron.hora_inicio.substring(0, 5);
          const horaFin = dayjs
            .tz(`${fecha} ${horaInicio}`, 'America/Santiago')
            .add(patron.duracion_minutos, 'minute')
            .format('HH:mm');

          const fechaFormateada = dayjs.tz(`${fecha}`, 'America/Santiago').format('DD/MM/YYYY');

          return {
            patron_id: patron.id,
            tipo_actividad_id: patron.tipo_actividad_id,
            nombre: `${patron.nombre} ${fechaFormateada}`,
            descripcion: null,
            fecha,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            lugar: patron.lugar,
            grupo_id: patron.grupo_id,
            es_publica: patron.es_publica,
            creador_id: creadorId,
          };
        });

        todasLasActividades.push(...actividadesDelPatron);

        detalle.push({
          patron_id: patron.id,
          patron_nombre: patron.nombre,
          actividades_creadas: actividadesDelPatron.length,
        });
      }

      if (todasLasActividades.length === 0) {
        return ServiceResponse.failure(
          'No se generaron actividades para el período indicado',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      await this.actividadesRepository.createManyAsync(todasLasActividades);

      const response: GenerarInstanciasResponse = {
        total_patrones: patrones.length,
        total_actividades_creadas: todasLasActividades.length,
        detalle,
      };

      return ServiceResponse.success<GenerarInstanciasResponse>(
        `Se generaron ${todasLasActividades.length} actividades para ${mes}/${anio}`,
        response,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al generar instancias: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al generar instancias de actividades',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Calcula las fechas según la frecuencia y día de semana para un mes/año dado
   */
  private calcularFechas(
    frecuencia: string,
    diaSemana: number,
    mes: number,
    anio: number,
  ): string[] {
    const fechas: string[] = [];

    // dayjs usa 0=domingo, 1=lunes... pero nuestro modelo usa 1=lunes, 7=domingo
    // Convertir: 1=lunes→1, 2=martes→2, ..., 7=domingo→0
    const dayjsDow = diaSemana === 7 ? 0 : diaSemana;

    // Primer día del mes
    const primerDia = dayjs.tz(`${anio}-${String(mes).padStart(2, '0')}-01`, 'America/Santiago');
    const diasEnMes = primerDia.daysInMonth();

    // Encontrar todas las ocurrencias del día de semana en el mes
    const ocurrencias: dayjs.Dayjs[] = [];
    for (let d = 1; d <= diasEnMes; d++) {
      const fecha = primerDia.date(d);
      if (fecha.day() === dayjsDow) {
        ocurrencias.push(fecha);
      }
    }

    switch (frecuencia) {
      case 'semanal':
        for (const oc of ocurrencias) {
          fechas.push(oc.format('YYYY-MM-DD'));
        }
        break;
      case 'primera_semana':
        if (ocurrencias[0]) fechas.push(ocurrencias[0].format('YYYY-MM-DD'));
        break;
      case 'segunda_semana':
        if (ocurrencias[1]) fechas.push(ocurrencias[1].format('YYYY-MM-DD'));
        break;
      case 'tercera_semana':
        if (ocurrencias[2]) fechas.push(ocurrencias[2].format('YYYY-MM-DD'));
        break;
      case 'cuarta_semana':
        if (ocurrencias[3]) fechas.push(ocurrencias[3].format('YYYY-MM-DD'));
        break;
    }

    return fechas;
  }
}

export const patronesActividadService = new PatronesActividadService();
