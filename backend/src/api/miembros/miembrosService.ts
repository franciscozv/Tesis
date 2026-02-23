import { StatusCodes } from 'http-status-codes';
import { historialEstadoService } from '@/api/historialEstado/historialEstadoService';
import type { Miembro } from '@/api/miembros/miembrosModel';
import { MiembrosRepository } from '@/api/miembros/miembrosRepository';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';

/**
 * Service para lógica de negocio de Miembros
 */
export class MiembrosService {
  private miembrosRepository: MiembrosRepository;

  constructor(repository: MiembrosRepository = new MiembrosRepository()) {
    this.miembrosRepository = repository;
  }

  /**
   * Obtiene todos los miembros activos
   */
  async findAll(): Promise<ServiceResponse<Miembro[] | null>> {
    try {
      const miembros = await this.miembrosRepository.findAllAsync();

      if (!miembros) {
        return ServiceResponse.failure(
          'Error al obtener miembros',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (miembros.length === 0) {
        return ServiceResponse.success<Miembro[]>('No se encontraron miembros', []);
      }

      return ServiceResponse.success<Miembro[]>('Miembros encontrados', miembros);
    } catch (ex) {
      const errorMessage = `Error al obtener miembros: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al obtener los miembros',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Busca un miembro por ID
   */
  async findById(id: number): Promise<ServiceResponse<Miembro | null>> {
    try {
      const miembro = await this.miembrosRepository.findByIdAsync(id);

      if (!miembro) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Miembro>('Miembro encontrado', miembro);
    } catch (ex) {
      const errorMessage = `Error al obtener miembro con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al obtener el miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo miembro (RF_01: Registrar nuevo miembro)
   */
  async create(
    miembroData: Omit<Miembro, 'id' | 'created_at' | 'updated_at' | 'activo'>,
  ): Promise<ServiceResponse<Miembro | null>> {
    try {
      const miembro = await this.miembrosRepository.createAsync(miembroData);
      return ServiceResponse.success<Miembro>(
        'Miembro creado exitosamente',
        miembro,
        StatusCodes.CREATED,
      );
    } catch (ex) {
      const errorMessage = `Error al crear miembro: ${(ex as Error).message}`;
      logger.error(errorMessage);

      // Manejar error de duplicado (RUT o email únicos)
      if ((ex as any).code === '23505') {
        return ServiceResponse.failure(
          'Ya existe un miembro con ese RUT o email',
          null,
          StatusCodes.CONFLICT,
        );
      }

      return ServiceResponse.failure(
        'Ocurrió un error al crear el miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza un miembro existente (RF_03: Actualizar información)
   */
  async update(
    id: number,
    miembroData: Partial<Miembro>,
  ): Promise<ServiceResponse<Miembro | null>> {
    try {
      // estado_membresia solo se modifica vía PATCH /:id/estado
      const { estado_membresia: _, ...safeData } = miembroData as any;
      const miembro = await this.miembrosRepository.updateAsync(id, safeData);

      if (!miembro) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Miembro>('Miembro actualizado exitosamente', miembro);
    } catch (ex) {
      const errorMessage = `Error al actualizar miembro con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);

      // Manejar error de duplicado (RUT o email únicos)
      if ((ex as any).code === '23505') {
        return ServiceResponse.failure(
          'Ya existe un miembro con ese RUT o email',
          null,
          StatusCodes.CONFLICT,
        );
      }

      return ServiceResponse.failure(
        'Ocurrió un error al actualizar el miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina lógicamente un miembro (soft delete)
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      const deleted = await this.miembrosRepository.deleteAsync(id);

      if (!deleted) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success('Miembro eliminado exitosamente', null);
    } catch (ex) {
      const errorMessage = `Error al eliminar miembro con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al eliminar el miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza datos de contacto del perfil propio
   */
  async updateMiPerfil(
    miembroId: number | null,
    data: { direccion?: string | null; telefono?: string | null; email?: string | null },
  ): Promise<ServiceResponse<Miembro | null>> {
    try {
      if (!miembroId) {
        return ServiceResponse.failure(
          'Tu usuario no tiene un miembro asociado',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const miembro = await this.miembrosRepository.updatePerfilAsync(miembroId, data);

      if (!miembro) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Miembro>('Perfil actualizado exitosamente', miembro);
    } catch (ex) {
      const errorMessage = `Error al actualizar perfil: ${(ex as Error).message}`;
      logger.error(errorMessage);

      if ((ex as any).code === '23505') {
        return ServiceResponse.failure(
          'Ya existe un miembro con ese email',
          null,
          StatusCodes.CONFLICT,
        );
      }

      return ServiceResponse.failure(
        'Ocurrió un error al actualizar el perfil',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cambia el estado de membresía de un miembro (RF_05)
   * Registra automáticamente el cambio en el historial de estado
   */
  async changeEstadoMembresia(
    id: number,
    estado_nuevo: string,
    motivo: string,
    usuario_id: number,
  ): Promise<ServiceResponse<Miembro | null>> {
    try {
      // Obtener el miembro actual para saber el estado anterior
      const miembroResponse = await this.findById(id);

      if (!miembroResponse.success || !miembroResponse.responseObject) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      const estado_anterior = miembroResponse.responseObject.estado_membresia;

      // Delegar al servicio de historial (registra historial + actualiza miembro)
      const historialResponse = await historialEstadoService.create({
        miembro_id: id,
        estado_anterior,
        estado_nuevo: estado_nuevo as any, // El servicio ya valida el tipo
        motivo,
        usuario_id,
      });

      if (!historialResponse.success) {
        return ServiceResponse.failure(
          historialResponse.message,
          null,
          historialResponse.statusCode,
        );
      }

      // Obtener el miembro actualizado para devolverlo
      const miembroActualizadoResponse = await this.findById(id);

      return ServiceResponse.success<Miembro>(
        'Estado de membresía actualizado exitosamente',
        miembroActualizadoResponse.responseObject,
      );
    } catch (ex) {
      const errorMessage = `Error al cambiar estado de membresía del miembro con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al cambiar el estado de membresía',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const miembrosService = new MiembrosService();
