import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import { ColaboradoresRepository } from './colaboradoresRepository';
import type { Colaborador } from './colaboradoresModel';

/**
 * Servicio con lógica de negocio para Colaboradores
 */
export class ColaboradoresService {
  private colaboradoresRepository: ColaboradoresRepository;

  constructor(repository: ColaboradoresRepository = new ColaboradoresRepository()) {
    this.colaboradoresRepository = repository;
  }

  /**
   * Obtiene todos los colaboradores con filtros opcionales
   */
  async findAll(filters: {
    necesidad_id?: number;
    miembro_id?: number;
    estado?: string;
  }): Promise<ServiceResponse<Colaborador[] | null>> {
    try {
      const colaboradores = await this.colaboradoresRepository.findAllAsync(filters);

      if (!colaboradores) {
        return ServiceResponse.failure(
          'Error al obtener colaboradores',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      if (colaboradores.length === 0) {
        return ServiceResponse.success<Colaborador[]>(
          'No se encontraron colaboradores',
          []
        );
      }

      return ServiceResponse.success<Colaborador[]>('Colaboradores encontrados', colaboradores);
    } catch (error) {
      const errorMessage = `Error al obtener colaboradores: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener colaboradores',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
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
        return ServiceResponse.failure(
          'Colaborador no encontrado',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      return ServiceResponse.success<Colaborador>('Colaborador encontrado', colaborador);
    } catch (error) {
      const errorMessage = `Error al obtener colaborador: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener colaborador',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Crea una nueva oferta de colaboración
   */
  async create(
    colaboradorData: Omit<Colaborador, 'id' | 'fecha_oferta' | 'fecha_decision' | 'estado'>
  ): Promise<ServiceResponse<Colaborador | null>> {
    try {
      // Validar que la necesidad exista y obtener sus datos
      const necesidad = await this.colaboradoresRepository.getNecesidadInfoAsync(
        colaboradorData.necesidad_id
      );
      if (!necesidad) {
        return ServiceResponse.failure(
          'La necesidad logística especificada no existe',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que la necesidad esté abierta
      if (necesidad.estado !== 'abierta') {
        return ServiceResponse.failure(
          'Solo se pueden ofrecer colaboraciones para necesidades en estado "abierta"',
          null,
          StatusCodes.CONFLICT
        );
      }

      // Validar que el miembro exista y esté activo
      const miembroExiste = await this.colaboradoresRepository.miembroExistsAsync(
        colaboradorData.miembro_id
      );
      if (!miembroExiste) {
        return ServiceResponse.failure(
          'El miembro especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que el miembro no tenga una oferta pendiente para la misma necesidad
      const existeOferta = await this.colaboradoresRepository.existsOfertaPendienteAsync(
        colaboradorData.necesidad_id,
        colaboradorData.miembro_id
      );
      if (existeOferta) {
        return ServiceResponse.failure(
          'El miembro ya tiene una oferta pendiente para esta necesidad',
          null,
          StatusCodes.CONFLICT
        );
      }

      // Validar que cantidad_ofrecida no supere la cantidad faltante
      const cantidadFaltante = necesidad.cantidad_requerida - necesidad.cantidad_cubierta;
      if (colaboradorData.cantidad_ofrecida > cantidadFaltante) {
        return ServiceResponse.failure(
          `La cantidad ofrecida (${colaboradorData.cantidad_ofrecida}) supera la cantidad faltante (${cantidadFaltante})`,
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const colaborador = await this.colaboradoresRepository.createAsync(colaboradorData);
      return ServiceResponse.success<Colaborador>(
        'Oferta de colaboración registrada exitosamente',
        colaborador,
        StatusCodes.CREATED
      );
    } catch (error) {
      const errorMessage = `Error al crear colaborador: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al registrar oferta de colaboración',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Acepta o rechaza una oferta de colaboración
   */
  async updateDecision(
    id: number,
    estado: 'aceptada' | 'rechazada'
  ): Promise<ServiceResponse<Colaborador | null>> {
    try {
      // Verificar que el colaborador exista
      const colaborador = await this.colaboradoresRepository.findByIdAsync(id);
      if (!colaborador) {
        return ServiceResponse.failure(
          'Colaborador no encontrado',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      // Solo se pueden decidir ofertas pendientes
      if (colaborador.estado !== 'pendiente') {
        return ServiceResponse.failure(
          `No se puede cambiar la decisión de una oferta en estado "${colaborador.estado}"`,
          null,
          StatusCodes.CONFLICT
        );
      }

      // Si se acepta, validar y actualizar cantidad_cubierta en la necesidad
      if (estado === 'aceptada') {
        const necesidad = await this.colaboradoresRepository.getNecesidadInfoAsync(
          colaborador.necesidad_id
        );
        if (!necesidad) {
          return ServiceResponse.failure(
            'La necesidad logística asociada no existe',
            null,
            StatusCodes.INTERNAL_SERVER_ERROR
          );
        }

        const nuevaCantidadCubierta = necesidad.cantidad_cubierta + colaborador.cantidad_ofrecida;

        // Validar que no se supere la cantidad requerida
        if (nuevaCantidadCubierta > necesidad.cantidad_requerida) {
          return ServiceResponse.failure(
            `Aceptar esta oferta superaría la cantidad requerida. Faltante: ${necesidad.cantidad_requerida - necesidad.cantidad_cubierta}, ofrecido: ${colaborador.cantidad_ofrecida}`,
            null,
            StatusCodes.CONFLICT
          );
        }

        // Actualizar cantidad_cubierta en la necesidad
        // Si queda completamente cubierta, se cambia automáticamente a estado 'cubierta'
        await this.colaboradoresRepository.updateCantidadCubiertaAsync(
          colaborador.necesidad_id,
          nuevaCantidadCubierta,
          necesidad.cantidad_requerida
        );
      }

      const colaboradorActualizado = await this.colaboradoresRepository.updateDecisionAsync(
        id,
        estado
      );

      if (!colaboradorActualizado) {
        return ServiceResponse.failure(
          'Error al registrar la decisión',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
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
        StatusCodes.INTERNAL_SERVER_ERROR
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
        return ServiceResponse.failure(
          'Colaborador no encontrado',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      if (colaborador.estado !== 'pendiente') {
        return ServiceResponse.failure(
          'Solo se pueden eliminar ofertas en estado "pendiente"',
          null,
          StatusCodes.CONFLICT
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
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const colaboradoresService = new ColaboradoresService();
