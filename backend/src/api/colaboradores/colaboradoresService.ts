import { StatusCodes } from 'http-status-codes';
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
    filters: { necesidad_id?: number; miembro_id?: number; estado?: string },
    usuario?: JwtPayload,
  ): Promise<ServiceResponse<Colaborador[] | null>> {
    try {
      let colaboradores: Colaborador[];

      if (usuario?.rol === 'usuario') {
        if (!usuario.miembro_id) {
          return ServiceResponse.failure(
            'El usuario no tiene un miembro asociado',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
        colaboradores = await this.colaboradoresRepository.findAllForEncargadoAsync(
          filters,
          usuario.miembro_id,
        );
      } else {
        // administrador: acceso global
        colaboradores = await this.colaboradoresRepository.findAllAsync(filters);
      }

      if (colaboradores.length === 0) {
        return ServiceResponse.success<Colaborador[]>('No se encontraron colaboradores', []);
      }

      return ServiceResponse.success<Colaborador[]>('Colaboradores encontrados', colaboradores);
    } catch (error) {
      const errorMessage = `Error al obtener colaboradores: ${(error as Error).message}`;
      logger.error({ err: error }, errorMessage);
      return ServiceResponse.failure(
        'Error al obtener colaboradores',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene un colaborador por ID
   */
  async findById(id: number): Promise<ServiceResponse<Colaborador | null>> {
    try {
      const colaborador = await this.colaboradoresRepository.findByIdAsync(id);

      if (!colaborador) {
        return ServiceResponse.failure('Colaborador no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Colaborador>('Colaborador encontrado', colaborador);
    } catch (error) {
      const errorMessage = `Error al obtener colaborador: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener colaborador',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea una nueva oferta de colaboración
   */
  async create(
    colaboradorData: Omit<Colaborador, 'id' | 'fecha_oferta' | 'fecha_decision' | 'estado'>,
  ): Promise<ServiceResponse<Colaborador | null>> {
    try {
      // Cargar necesidad + actividad en una sola consulta
      const necesidad = await this.colaboradoresRepository.getNecesidadConActividadAsync(
        colaboradorData.necesidad_id,
      );
      if (!necesidad) {
        return ServiceResponse.failure(
          'La necesidad logística especificada no existe',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Validar que la necesidad esté abierta
      if (necesidad.estado !== 'abierta') {
        return ServiceResponse.failure(
          'Solo se pueden ofrecer colaboraciones para necesidades en estado "abierta"',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Validaciones temporales sobre la actividad asociada
      const { actividad } = necesidad;
      if (actividad.estado === 'cancelada') {
        return ServiceResponse.failure(
          'No se puede registrar colaboración en una actividad cancelada',
          null,
          StatusCodes.CONFLICT,
        );
      }

      const finActividad = parseActividadFin(actividad.fecha, actividad.hora_fin);
      if (finActividad.isBefore(nowEnZona())) {
        return ServiceResponse.failure(
          'No se puede registrar colaboración en una actividad que ya finalizó',
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

      // Validar que el miembro no tenga ya una oferta para la misma necesidad
      const ofertaExistente = await this.colaboradoresRepository.findByMiembroAndNecesidad(
        colaboradorData.miembro_id,
        colaboradorData.necesidad_id,
      );
      if (ofertaExistente) {
        return ServiceResponse.failure(
          'Ya existe una oferta de este miembro para esta necesidad',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Validar que cantidad_ofrecida no supere la cantidad faltante
      const cantidadFaltante = necesidad.cantidad_requerida - necesidad.cantidad_cubierta;
      if (colaboradorData.cantidad_ofrecida > cantidadFaltante) {
        return ServiceResponse.failure(
          `La cantidad ofrecida (${colaboradorData.cantidad_ofrecida}) supera la cantidad faltante (${cantidadFaltante})`,
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const colaborador = await this.colaboradoresRepository.createAsync(colaboradorData);
      return ServiceResponse.success<Colaborador>(
        'Oferta de colaboración registrada exitosamente',
        colaborador,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al crear colaborador: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al registrar oferta de colaboración',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Acepta o rechaza una oferta de colaboración
   */
  async updateDecision(
    id: number,
    estado: 'aceptada' | 'rechazada',
    usuario?: JwtPayload,
  ): Promise<ServiceResponse<Colaborador | null>> {
    try {
      // Verificar que el colaborador exista
      const colaborador = await this.colaboradoresRepository.findByIdAsync(id);
      if (!colaborador) {
        return ServiceResponse.failure('Colaborador no encontrado', null, StatusCodes.NOT_FOUND);
      }

      // Usuario no-admin: validar que la oferta pertenece a una necesidad de sus grupos
      if (usuario?.rol === 'usuario') {
        if (!usuario.miembro_id) {
          return ServiceResponse.failure(
            'El usuario no tiene un miembro asociado',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
        const esEncargado = await this.colaboradoresRepository.perteneceEncargadoAsync(
          colaborador.necesidad_id,
          usuario.miembro_id,
        );
        if (!esEncargado) {
          return ServiceResponse.failure(
            'No tiene permisos para decidir esta oferta',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      // Solo se pueden decidir ofertas pendientes
      if (colaborador.estado !== 'pendiente') {
        return ServiceResponse.failure(
          `No se puede cambiar la decisión de una oferta en estado "${colaborador.estado}"`,
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Validar que la actividad no haya finalizado
      const necesidadInfo = await this.colaboradoresRepository.getNecesidadConActividadAsync(
        colaborador.necesidad_id,
      );

      if (necesidadInfo) {
        const { actividad } = necesidadInfo;
        if (actividad.estado === 'cancelada') {
          return ServiceResponse.failure(
            'No se puede decidir sobre una oferta de una actividad cancelada',
            null,
            StatusCodes.CONFLICT,
          );
        }

        const finActividad = parseActividadFin(actividad.fecha, actividad.hora_fin);
        if (finActividad.isBefore(nowEnZona())) {
          return ServiceResponse.failure(
            'No se puede decidir sobre una oferta de una actividad que ya finalizó',
            null,
            StatusCodes.CONFLICT,
          );
        }
      }

      // Si se acepta, validar y actualizar cantidad_cubierta en la necesidad
      if (estado === 'aceptada') {
        const necesidad = await this.colaboradoresRepository.getNecesidadInfoAsync(
          colaborador.necesidad_id,
        );
        if (!necesidad) {
          return ServiceResponse.failure(
            'La necesidad logística asociada no existe',
            null,
            StatusCodes.INTERNAL_SERVER_ERROR,
          );
        }

        const nuevaCantidadCubierta = necesidad.cantidad_cubierta + colaborador.cantidad_ofrecida;

        // Validar que no se supere la cantidad requerida
        if (nuevaCantidadCubierta > necesidad.cantidad_requerida) {
          return ServiceResponse.failure(
            `Aceptar esta oferta superaría la cantidad requerida. Faltante: ${necesidad.cantidad_requerida - necesidad.cantidad_cubierta}, ofrecido: ${colaborador.cantidad_ofrecida}`,
            null,
            StatusCodes.CONFLICT,
          );
        }

        // Actualizar cantidad_cubierta en la necesidad
        // Si queda completamente cubierta, se cambia automáticamente a estado 'cubierta'
        await this.colaboradoresRepository.updateCantidadCubiertaAsync(
          colaborador.necesidad_id,
          nuevaCantidadCubierta,
          necesidad.cantidad_requerida,
        );
      }

      const colaboradorActualizado = await this.colaboradoresRepository.updateDecisionAsync(
        id,
        estado,
      );

      if (!colaboradorActualizado) {
        return ServiceResponse.failure(
          'Error al registrar la decisión',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      const mensaje =
        estado === 'aceptada'
          ? 'Oferta de colaboración aceptada exitosamente'
          : 'Oferta de colaboración rechazada';

      return ServiceResponse.success<Colaborador>(mensaje, colaboradorActualizado);
    } catch (error) {
      const errorMessage = `Error al procesar decisión: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al procesar la decisión sobre la oferta',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina una oferta de colaboración (solo si está pendiente)
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      const colaborador = await this.colaboradoresRepository.findByIdAsync(id);
      if (!colaborador) {
        return ServiceResponse.failure('Colaborador no encontrado', null, StatusCodes.NOT_FOUND);
      }

      if (colaborador.estado !== 'pendiente') {
        return ServiceResponse.failure(
          'Solo se pueden eliminar ofertas en estado "pendiente"',
          null,
          StatusCodes.CONFLICT,
        );
      }

      await this.colaboradoresRepository.deleteAsync(id);
      return ServiceResponse.success('Oferta de colaboración eliminada exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al eliminar colaborador: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al eliminar oferta de colaboración',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const colaboradoresService = new ColaboradoresService();
