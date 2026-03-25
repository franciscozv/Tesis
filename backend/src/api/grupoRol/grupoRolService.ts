import { StatusCodes } from 'http-status-codes';
import type { RolGrupo } from '@/api/rolesGrupo/rolesGrupoModel';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { supabase } from '@/common/utils/supabaseClient';
import { logger } from '@/server';
import type { GrupoRol } from './grupoRolModel';
import { GrupoRolRepository } from './grupoRolRepository';

export class GrupoRolService {
  private repo: GrupoRolRepository;

  constructor(repo: GrupoRolRepository = new GrupoRolRepository()) {
    this.repo = repo;
  }

  async getRolesPorGrupo(grupoId: number): Promise<ServiceResponse<RolGrupo[] | null>> {
    try {
      const roles = await this.repo.findRolesByGrupoAsync(grupoId);
      return ServiceResponse.success<RolGrupo[]>('Roles habilitados para el grupo', roles);
    } catch (error) {
      logger.error(`Error al obtener roles por grupo: ${(error as Error).message}`);
      return ServiceResponse.failure(
        'Error al obtener roles del grupo',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async habilitarRol(grupoId: number, rolId: number): Promise<ServiceResponse<GrupoRol | null>> {
    try {
      const { data: grupo, error: gErr } = await supabase
        .from('grupo')
        .select('activo')
        .eq('id_grupo', grupoId)
        .single();
      if (gErr || !grupo) {
        return ServiceResponse.failure('El grupo no existe', null, StatusCodes.NOT_FOUND);
      }
      if (!grupo.activo) {
        return ServiceResponse.failure('El grupo no está activo', null, StatusCodes.BAD_REQUEST);
      }

      const { data: rol, error: rErr } = await supabase
        .from('rol_grupo')
        .select('activo')
        .eq('id_rol_grupo', rolId)
        .single();
      if (rErr || !rol) {
        return ServiceResponse.failure('El rol no existe', null, StatusCodes.NOT_FOUND);
      }
      if (!rol.activo) {
        return ServiceResponse.failure('El rol no está activo', null, StatusCodes.BAD_REQUEST);
      }

      const existe = await this.repo.existeAsync(grupoId, rolId);
      if (existe) {
        return ServiceResponse.failure(
          'Este rol ya está habilitado para el grupo',
          null,
          StatusCodes.CONFLICT,
        );
      }

      const grupoRol = await this.repo.habilitarAsync(grupoId, rolId);
      return ServiceResponse.success<GrupoRol>(
        'Rol habilitado exitosamente para el grupo',
        grupoRol,
        StatusCodes.CREATED,
      );
    } catch (error) {
      logger.error(`Error al habilitar rol en grupo: ${(error as Error).message}`);
      return ServiceResponse.failure(
        'Error al habilitar rol en el grupo',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deshabilitarRol(grupoId: number, rolId: number): Promise<ServiceResponse<boolean | null>> {
    try {
      const existe = await this.repo.existeAsync(grupoId, rolId);
      if (!existe) {
        return ServiceResponse.failure(
          'Este rol no está habilitado para el grupo',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const enUso = await this.repo.estaEnUsoAsync(grupoId, rolId);
      if (enUso) {
        return ServiceResponse.failure(
          'No se puede deshabilitar: hay integrantes activos con este rol en el grupo',
          null,
          StatusCodes.CONFLICT,
        );
      }

      await this.repo.deshabilitarAsync(grupoId, rolId);
      return ServiceResponse.success<boolean>('Rol deshabilitado exitosamente', true);
    } catch (error) {
      logger.error(`Error al deshabilitar rol en grupo: ${(error as Error).message}`);
      return ServiceResponse.failure(
        'Error al deshabilitar rol del grupo',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const grupoRolService = new GrupoRolService();
