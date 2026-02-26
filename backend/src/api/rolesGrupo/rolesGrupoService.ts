import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { ROL_ENCARGADO_ID } from '@/common/utils/grupoPermissions';
import { logger } from '@/server';
import type { RolGrupo } from './rolesGrupoModel';
import { RolesGrupoRepository } from './rolesGrupoRepository';

/**
 * Service para lógica de negocio de Roles de Grupos Ministeriales
 */
export class RolesGrupoService {
  private rolesGrupoRepository: RolesGrupoRepository;

  constructor(repository: RolesGrupoRepository = new RolesGrupoRepository()) {
    this.rolesGrupoRepository = repository;
  }

  /**
   * Obtiene todos los roles activos
   */
  async findAll(activo?: boolean): Promise<ServiceResponse<RolGrupo[] | null>> {
    try {
      const roles = await this.rolesGrupoRepository.findAllAsync(activo);

      if (!roles) {
        return ServiceResponse.failure(
          'Error al obtener roles de grupo',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (roles.length === 0) {
        return ServiceResponse.success<RolGrupo[]>('No se encontraron roles de grupo', []);
      }

      return ServiceResponse.success<RolGrupo[]>('Roles de grupo encontrados', roles);
    } catch (error) {
      const errorMessage = `Error al obtener roles de grupo: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener roles de grupo',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene un rol por ID
   */
  async findById(id: number): Promise<ServiceResponse<RolGrupo | null>> {
    try {
      const rol = await this.rolesGrupoRepository.findByIdAsync(id);

      if (!rol) {
        return ServiceResponse.failure('Rol de grupo no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<RolGrupo>('Rol de grupo encontrado', rol);
    } catch (error) {
      const errorMessage = `Error al obtener rol de grupo: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener rol de grupo',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo rol de grupo
   *
   * Validaciones:
   * - Nombre debe ser único
   */
  async create(
    nombre: string,
    requierePlenaComunion: boolean,
  ): Promise<ServiceResponse<RolGrupo | null>> {
    try {
      // Validar que el nombre no exista
      const nombreExiste = await this.rolesGrupoRepository.existeNombre(nombre);

      if (nombreExiste) {
        return ServiceResponse.failure(
          'Ya existe un rol con ese nombre',
          null,
          StatusCodes.CONFLICT,
        );
      }

      const rol = await this.rolesGrupoRepository.createAsync(nombre, requierePlenaComunion);

      return ServiceResponse.success<RolGrupo>(
        'Rol de grupo creado exitosamente',
        rol,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al crear rol de grupo: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al crear rol de grupo',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza un rol de grupo
   *
   * Validaciones:
   * - Rol debe existir
   * - Si se actualiza el nombre, debe ser único
   */
  async update(
    id: number,
    updates: { nombre?: string; requiere_plena_comunion?: boolean },
  ): Promise<ServiceResponse<RolGrupo | null>> {
    try {
      if (id === ROL_ENCARGADO_ID) {
        return ServiceResponse.failure(
          'Rol reservado del sistema, no se puede modificar.',
          null,
          StatusCodes.FORBIDDEN,
        );
      }

      // Verificar que el rol exista
      const rolExistente = await this.rolesGrupoRepository.findByIdAsync(id);

      if (!rolExistente) {
        return ServiceResponse.failure('Rol de grupo no encontrado', null, StatusCodes.NOT_FOUND);
      }

      // Si se actualiza el nombre, validar que no exista otro rol con ese nombre
      if (updates.nombre) {
        const nombreExiste = await this.rolesGrupoRepository.existeNombre(updates.nombre, id);

        if (nombreExiste) {
          return ServiceResponse.failure(
            'Ya existe un rol con ese nombre',
            null,
            StatusCodes.CONFLICT,
          );
        }
      }

      const rol = await this.rolesGrupoRepository.updateAsync(id, updates);

      if (!rol) {
        return ServiceResponse.failure('Rol de grupo no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<RolGrupo>('Rol de grupo actualizado exitosamente', rol);
    } catch (error) {
      const errorMessage = `Error al actualizar rol de grupo: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al actualizar rol de grupo',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cambia el estado activo/inactivo de un rol de grupo
   */
  async toggleEstado(id: number): Promise<ServiceResponse<RolGrupo | null>> {
    try {
      if (id === ROL_ENCARGADO_ID) {
        return ServiceResponse.failure(
          'Rol reservado del sistema, no se puede modificar.',
          null,
          StatusCodes.FORBIDDEN,
        );
      }

      const rol = await this.rolesGrupoRepository.toggleEstadoAsync(id);

      if (!rol) {
        return ServiceResponse.failure('Rol de grupo no encontrado', null, StatusCodes.NOT_FOUND);
      }

      const estado = rol.activo ? 'activado' : 'desactivado';
      return ServiceResponse.success<RolGrupo>(`Rol de grupo ${estado} exitosamente`, rol);
    } catch (error) {
      const errorMessage = `Error al cambiar estado del rol de grupo: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar estado del rol de grupo',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina un rol de grupo permanentemente (hard delete)
   * Solo se permite si no tiene membresías asociadas
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      if (id === ROL_ENCARGADO_ID) {
        return ServiceResponse.failure(
          'Rol reservado del sistema, no se puede modificar.',
          null,
          StatusCodes.FORBIDDEN,
        );
      }

      const rolExistente = await this.rolesGrupoRepository.findByIdAsync(id);

      if (!rolExistente) {
        return ServiceResponse.failure('Rol de grupo no encontrado', null, StatusCodes.NOT_FOUND);
      }

      const enUso = await this.rolesGrupoRepository.estaEnUso(id);

      if (enUso) {
        return ServiceResponse.failure(
          'No se puede eliminar porque tiene membresías asociadas. Puede desactivarlo en su lugar.',
          null,
          StatusCodes.CONFLICT,
        );
      }

      await this.rolesGrupoRepository.deleteAsync(id);

      return ServiceResponse.success('Rol de grupo eliminado exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al eliminar rol de grupo: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al eliminar rol de grupo',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const rolesGrupoService = new RolesGrupoService();
