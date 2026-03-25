import { StatusCodes } from 'http-status-codes';
import { emitAndPersistAdmin } from '@/api/notificaciones/notificacionesService';
import type { JwtPayload } from '@/common/middleware/authMiddleware';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { nowEnZona, parseActividadFin } from '@/common/utils/dateTime';
import { logger } from '@/server';
import type { Colaborador } from './colaboradoresModel';
import { ColaboradoresRepository } from './colaboradoresRepository';

/**
 * Servicio con lógica de negocio para Colaboradores
 */
export class ColaboradoresService {
  private colaboradoresRepository: ColaboradoresRepository;

  constructor(repository: ColaboradoresRepository = new ColaboradoresRepository()) {
    this.colaboradoresRepository = repository;
  }

  /**
   * Obtiene todos los colaboradores con filtros opcionales, scoped según rol del usuario
   */
  async findAll(
    filters: { necesidad_id?: number; miembro_id?: number },
    usuario?: JwtPayload,
  ): Promise<ServiceResponse<Colaborador[] | null>> {
    try {
      let colaboradores: Colaborador[];

      if (usuario?.rol === 'usuario') {
        colaboradores = await this.colaboradoresRepository.findAllForEncargadoAsync(
          filters,
          usuario.id,
        );
      } else {
        colaboradores = await this.colaboradoresRepository.findAllAsync(filters);
      }

      if (colaboradores.length === 0) {
        return ServiceResponse.success<Colaborador[]>('No se encontraron compromisos', []);
      }

      return ServiceResponse.success<Colaborador[]>('Compromisos encontrados', colaboradores);
    } catch (error) {
      const errorMessage = `Error al obtener compromisos: ${(error as Error).message}`;
      logger.error({ err: error }, errorMessage);
      return ServiceResponse.failure(
        'Error al obtener compromisos',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene un compromiso por ID
   */
  async findById(id: number): Promise<ServiceResponse<Colaborador | null>> {
    try {
      const colaborador = await this.colaboradoresRepository.findByIdAsync(id);

      if (!colaborador) {
        return ServiceResponse.failure('Compromiso no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Colaborador>('Compromiso encontrado', colaborador);
    } catch (error) {
      const errorMessage = `Error al obtener compromiso: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener compromiso',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Registra un nuevo compromiso de colaboración (confirmado automáticamente)
   */
  async create(
    colaboradorData: Omit<Colaborador, 'id' | 'fecha_compromiso' | 'cumplio'>,
  ): Promise<ServiceResponse<Colaborador | null>> {
    try {
      // Cargar necesidad + actividad
      const necesidad = await this.colaboradoresRepository.getNecesidadConActividadAsync(
        colaboradorData.necesidad_id,
      );
      if (!necesidad) {
        return ServiceResponse.failure(
          'La necesidad material especificada no existe',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Validar que la necesidad esté abierta
      if (necesidad.estado !== 'abierta') {
        return ServiceResponse.failure(
          'Solo se pueden registrar compromisos para necesidades en estado "abierta"',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Validaciones temporales sobre la actividad asociada
      const { actividad } = necesidad;
      if (actividad.estado === 'cancelada') {
        return ServiceResponse.failure(
          'No se puede registrar un compromiso en una actividad cancelada',
          null,
          StatusCodes.CONFLICT,
        );
      }

      const finActividad = parseActividadFin(actividad.fecha, actividad.hora_fin);
      if (finActividad.isBefore(nowEnZona())) {
        return ServiceResponse.failure(
          'No se puede registrar un compromiso en una actividad que ya finalizó',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Validar que el miembro exista y esté activo
      const miembroExiste = await this.colaboradoresRepository.miembroExistsAsync(
        colaboradorData.miembro_id,
      );
      if (!miembroExiste) {
        return ServiceResponse.failure(
          'El miembro especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Validar que el miembro no tenga ya un compromiso para la misma necesidad
      const compromisoExistente = await this.colaboradoresRepository.findByMiembroAndNecesidad(
        colaboradorData.miembro_id,
        colaboradorData.necesidad_id,
      );
      if (compromisoExistente) {
        return ServiceResponse.failure(
          'Ya tienes un compromiso registrado para esta necesidad',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Validar que cantidad_comprometida no supere la cantidad faltante
      const cantidadFaltante = necesidad.cantidad_requerida - necesidad.cantidad_cubierta;
      if (colaboradorData.cantidad_comprometida > cantidadFaltante) {
        return ServiceResponse.failure(
          `La cantidad comprometida (${colaboradorData.cantidad_comprometida}) supera la cantidad faltante (${cantidadFaltante})`,
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const colaborador = await this.colaboradoresRepository.createAsync(colaboradorData);

      // Actualizar cantidad_cubierta automáticamente
      const nuevaCantidadCubierta = necesidad.cantidad_cubierta + colaboradorData.cantidad_comprometida;
      await this.colaboradoresRepository.updateCantidadCubiertaAsync(
        colaboradorData.necesidad_id,
        nuevaCantidadCubierta,
        necesidad.cantidad_requerida,
      );

      // Notificar a admins y directiva
      const miembro = (colaborador as any).miembro;
      const nombreMiembro = miembro
        ? `${miembro.nombre} ${miembro.apellido}`
        : `Miembro #${colaboradorData.miembro_id}`;
      await emitAndPersistAdmin({
        tipo: 'nueva_colaboracion',
        mensaje: `${nombreMiembro} se ofreció a colaborar`,
        detalle: `${necesidad.descripcion} · ${colaboradorData.cantidad_comprometida} ${necesidad.unidad_medida ?? ''} · ${necesidad.actividad.nombre}`.trim(),
        href: `/dashboard/actividades/${necesidad.actividad.id}?tab=logistica&colaboradorId=${colaborador.id}`,
        timestamp: Date.now(),
      });

      return ServiceResponse.success<Colaborador>(
        'Compromiso de colaboración registrado exitosamente',
        colaborador,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al registrar compromiso: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al registrar compromiso de colaboración',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Marca si un colaborador cumplió su compromiso (verificación post-actividad)
   */
  async marcarCumplio(
    id: number,
    cumplio: boolean,
    usuario?: JwtPayload,
  ): Promise<ServiceResponse<Colaborador | null>> {
    try {
      const colaborador = await this.colaboradoresRepository.findByIdAsync(id);
      if (!colaborador) {
        return ServiceResponse.failure('Compromiso no encontrado', null, StatusCodes.NOT_FOUND);
      }

      // Usuario no-admin: validar que el compromiso pertenece a una necesidad de sus grupos
      if (usuario?.rol === 'usuario') {
        const esEncargado = await this.colaboradoresRepository.perteneceEncargadoAsync(
          colaborador.necesidad_id,
          usuario.id,
        );
        if (!esEncargado) {
          return ServiceResponse.failure(
            'No tiene permisos para marcar este compromiso',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      const colaboradorActualizado = await this.colaboradoresRepository.updateCumplioAsync(
        id,
        cumplio,
      );

      if (!colaboradorActualizado) {
        return ServiceResponse.failure(
          'Error al actualizar el compromiso',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      const mensaje = cumplio
        ? 'Compromiso marcado como cumplido'
        : 'Compromiso marcado como no cumplido';

      return ServiceResponse.success<Colaborador>(mensaje, colaboradorActualizado);
    } catch (error) {
      const errorMessage = `Error al marcar cumplio: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al actualizar el compromiso',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina un compromiso de colaboración y descuenta la cantidad cubierta
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      const colaborador = await this.colaboradoresRepository.findByIdAsync(id);
      if (!colaborador) {
        return ServiceResponse.failure('Compromiso no encontrado', null, StatusCodes.NOT_FOUND);
      }

      // Descontar la cantidad del compromiso eliminado
      const necesidad = await this.colaboradoresRepository.getNecesidadInfoAsync(
        colaborador.necesidad_id,
      );
      if (necesidad && necesidad.estado !== 'cancelada') {
        const nuevaCantidad = Math.max(
          0,
          necesidad.cantidad_cubierta - colaborador.cantidad_comprometida,
        );
        await this.colaboradoresRepository.updateCantidadCubiertaAsync(
          colaborador.necesidad_id,
          nuevaCantidad,
          necesidad.cantidad_requerida,
        );
      }

      await this.colaboradoresRepository.deleteAsync(id);
      return ServiceResponse.success('Compromiso de colaboración eliminado exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al eliminar compromiso: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al eliminar compromiso de colaboración',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const colaboradoresService = new ColaboradoresService();
