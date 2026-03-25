import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import type { ResponsabilidadActividad } from './rolesActividadModel';
import { ResponsabilidadesActividadRepository } from './rolesActividadRepository';

/**
 * Servicio con lógica de negocio para Responsabilidades de Actividad
 */
export class ResponsabilidadesActividadService {
  private responsabilidadesActividadRepository: ResponsabilidadesActividadRepository;

  constructor(
    repository: ResponsabilidadesActividadRepository = new ResponsabilidadesActividadRepository(),
  ) {
    this.responsabilidadesActividadRepository = repository;
  }

  /**
   * Obtiene todos los roles activos
   */
  async findAll(activo?: boolean): Promise<ServiceResponse<ResponsabilidadActividad[] | null>> {
    try {
      const roles = await this.responsabilidadesActividadRepository.findAllAsync(activo);

      if (!roles) {
        return ServiceResponse.failure(
          'Error al obtener responsabilidades de actividad',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (roles.length === 0) {
        return ServiceResponse.success<ResponsabilidadActividad[]>(
          'No se encontraron responsabilidades de actividad',
          [],
        );
      }

      return ServiceResponse.success<ResponsabilidadActividad[]>(
        'Roles de actividad encontrados',
        roles,
      );
    } catch (error) {
      const errorMessage = `Error al obtener responsabilidades de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener responsabilidades de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene un rol por ID
   */
  async findById(id: number): Promise<ServiceResponse<ResponsabilidadActividad | null>> {
    try {
      const rol = await this.responsabilidadesActividadRepository.findByIdAsync(id);

      if (!rol) {
        return ServiceResponse.failure(
          'Rol de actividad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<ResponsabilidadActividad>('Rol de actividad encontrado', rol);
    } catch (error) {
      const errorMessage = `Error al obtener responsabilidad de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener responsabilidad de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo rol
   */
  async create(
    rolData: Omit<
      ResponsabilidadActividad,
      'id_responsabilidad' | 'created_at' | 'updated_at' | 'activo'
    >,
  ): Promise<ServiceResponse<ResponsabilidadActividad | null>> {
    try {
      // Validar que el nombre no exista
      const existeNombre = await this.responsabilidadesActividadRepository.existsByNombreAsync(
        rolData.nombre,
      );
      if (existeNombre) {
        return ServiceResponse.failure(
          'Ya existe un responsabilidad de actividad con ese nombre',
          null,
          StatusCodes.CONFLICT,
        );
      }

      const rol = await this.responsabilidadesActividadRepository.createAsync(rolData);
      return ServiceResponse.success<ResponsabilidadActividad>(
        'Rol de actividad creado exitosamente',
        rol,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al crear responsabilidad de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al crear responsabilidad de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza un rol existente
   */
  async update(
    id: number,
    rolData: Partial<ResponsabilidadActividad>,
  ): Promise<ServiceResponse<ResponsabilidadActividad | null>> {
    try {
      // Validar que el nombre no exista (excluyendo el rol actual)
      if (rolData.nombre) {
        const existeNombre = await this.responsabilidadesActividadRepository.existsByNombreAsync(
          rolData.nombre,
          id,
        );
        if (existeNombre) {
          return ServiceResponse.failure(
            'Ya existe un responsabilidad de actividad con ese nombre',
            null,
            StatusCodes.CONFLICT,
          );
        }
      }

      const rol = await this.responsabilidadesActividadRepository.updateAsync(id, rolData);

      if (!rol) {
        return ServiceResponse.failure(
          'Rol de actividad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<ResponsabilidadActividad>(
        'Rol de actividad actualizado exitosamente',
        rol,
      );
    } catch (error) {
      const errorMessage = `Error al actualizar responsabilidad de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al actualizar responsabilidad de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cambia el estado activo/inactivo de un responsabilidad de actividad
   */
  async toggleEstado(id: number): Promise<ServiceResponse<ResponsabilidadActividad | null>> {
    try {
      const rol = await this.responsabilidadesActividadRepository.toggleEstadoAsync(id);

      if (!rol) {
        return ServiceResponse.failure(
          'Rol de actividad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const estado = rol.activo ? 'activado' : 'desactivado';
      return ServiceResponse.success<ResponsabilidadActividad>(
        `Rol de actividad ${estado} exitosamente`,
        rol,
      );
    } catch (error) {
      const errorMessage = `Error al cambiar estado del responsabilidad de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar estado del responsabilidad de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina un rol permanentemente (hard delete)
   * Solo se permite si no tiene registros asociados
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      const rol = await this.responsabilidadesActividadRepository.findByIdAsync(id);
      if (!rol) {
        return ServiceResponse.failure(
          'Rol de actividad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const enUso = await this.responsabilidadesActividadRepository.isRolInUseAsync(id);
      if (enUso) {
        return ServiceResponse.failure(
          'No se puede eliminar porque tiene invitados asociados. Puede desactivarlo en su lugar.',
          null,
          StatusCodes.CONFLICT,
        );
      }

      await this.responsabilidadesActividadRepository.deleteAsync(id);
      return ServiceResponse.success('Rol de actividad eliminado exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al eliminar responsabilidad de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al eliminar responsabilidad de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const responsabilidadesActividadService = new ResponsabilidadesActividadService();
