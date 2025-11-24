import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
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
  async findAll(): Promise<ServiceResponse<RolGrupo[] | null>> {
    try {
      const roles = await this.rolesGrupoRepository.findAllAsync();

      if (!roles || roles.length === 0) {
        return ServiceResponse.failure(
          'No se encontraron roles de grupo',
          null,
          StatusCodes.NOT_FOUND,
        );
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
   * Elimina un rol de grupo (soft delete)
   *
   * Validaciones:
   * - Rol debe existir
   * - No permitir eliminar si está siendo usado en membresías activas
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      // Verificar que el rol exista
      const rolExistente = await this.rolesGrupoRepository.findByIdAsync(id);

      if (!rolExistente) {
        return ServiceResponse.failure('Rol de grupo no encontrado', null, StatusCodes.NOT_FOUND);
      }

      // Verificar que el rol no esté siendo usado en membresías activas
      const enUso = await this.rolesGrupoRepository.estaEnUso(id);

      if (enUso) {
        return ServiceResponse.failure(
          'No se puede eliminar el rol porque está siendo usado en membresías activas',
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
