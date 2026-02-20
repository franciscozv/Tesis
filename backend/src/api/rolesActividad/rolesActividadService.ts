import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import type { RolActividad } from './rolesActividadModel';
import { RolesActividadRepository } from './rolesActividadRepository';

/**
 * Servicio con lógica de negocio para Roles de Actividad
 */
export class RolesActividadService {
  private rolesActividadRepository: RolesActividadRepository;

  constructor(repository: RolesActividadRepository = new RolesActividadRepository()) {
    this.rolesActividadRepository = repository;
  }

  /**
   * Obtiene todos los roles activos
   */
  async findAll(activo?: boolean): Promise<ServiceResponse<RolActividad[] | null>> {
    try {
      const roles = await this.rolesActividadRepository.findAllAsync(activo);

      if (!roles) {
        return ServiceResponse.failure(
          'Error al obtener roles de actividad',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (roles.length === 0) {
        return ServiceResponse.success<RolActividad[]>(
          'No se encontraron roles de actividad',
          [],
        );
      }

      return ServiceResponse.success<RolActividad[]>('Roles de actividad encontrados', roles);
    } catch (error) {
      const errorMessage = `Error al obtener roles de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener roles de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene un rol por ID
   */
  async findById(id: number): Promise<ServiceResponse<RolActividad | null>> {
    try {
      const rol = await this.rolesActividadRepository.findByIdAsync(id);

      if (!rol) {
        return ServiceResponse.failure(
          'Rol de actividad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<RolActividad>('Rol de actividad encontrado', rol);
    } catch (error) {
      const errorMessage = `Error al obtener rol de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener rol de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo rol
   */
  async create(
    rolData: Omit<RolActividad, 'id_rol' | 'created_at' | 'updated_at' | 'activo'>,
  ): Promise<ServiceResponse<RolActividad | null>> {
    try {
      // Validar que el nombre no exista
      const existeNombre = await this.rolesActividadRepository.existsByNombreAsync(rolData.nombre);
      if (existeNombre) {
        return ServiceResponse.failure(
          'Ya existe un rol de actividad con ese nombre',
          null,
          StatusCodes.CONFLICT,
        );
      }

      const rol = await this.rolesActividadRepository.createAsync(rolData);
      return ServiceResponse.success<RolActividad>(
        'Rol de actividad creado exitosamente',
        rol,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al crear rol de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al crear rol de actividad',
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
    rolData: Partial<RolActividad>,
  ): Promise<ServiceResponse<RolActividad | null>> {
    try {
      // Validar que el nombre no exista (excluyendo el rol actual)
      if (rolData.nombre) {
        const existeNombre = await this.rolesActividadRepository.existsByNombreAsync(
          rolData.nombre,
          id,
        );
        if (existeNombre) {
          return ServiceResponse.failure(
            'Ya existe un rol de actividad con ese nombre',
            null,
            StatusCodes.CONFLICT,
          );
        }
      }

      const rol = await this.rolesActividadRepository.updateAsync(id, rolData);

      if (!rol) {
        return ServiceResponse.failure(
          'Rol de actividad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<RolActividad>(
        'Rol de actividad actualizado exitosamente',
        rol,
      );
    } catch (error) {
      const errorMessage = `Error al actualizar rol de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al actualizar rol de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cambia el estado activo/inactivo de un rol de actividad
   */
  async toggleEstado(id: number): Promise<ServiceResponse<RolActividad | null>> {
    try {
      const rol = await this.rolesActividadRepository.toggleEstadoAsync(id);

      if (!rol) {
        return ServiceResponse.failure(
          'Rol de actividad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const estado = rol.activo ? 'activado' : 'desactivado';
      return ServiceResponse.success<RolActividad>(
        `Rol de actividad ${estado} exitosamente`,
        rol,
      );
    } catch (error) {
      const errorMessage = `Error al cambiar estado del rol de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar estado del rol de actividad',
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
      const rol = await this.rolesActividadRepository.findByIdAsync(id);
      if (!rol) {
        return ServiceResponse.failure(
          'Rol de actividad no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const enUso = await this.rolesActividadRepository.isRolInUseAsync(id);
      if (enUso) {
        return ServiceResponse.failure(
          'No se puede eliminar porque tiene invitados asociados. Puede desactivarlo en su lugar.',
          null,
          StatusCodes.CONFLICT,
        );
      }

      await this.rolesActividadRepository.deleteAsync(id);
      return ServiceResponse.success('Rol de actividad eliminado exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al eliminar rol de actividad: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al eliminar rol de actividad',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const rolesActividadService = new RolesActividadService();
