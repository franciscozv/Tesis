import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { ROL_ENCARGADO_ID } from '@/common/utils/grupoPermissions';
import { logger } from '@/server';
import type { MembresiaGrupo, MembresiaGrupoConNombres } from './membresiaGrupoModel';
import { MembresiaGrupoRepository } from './membresiaGrupoRepository';

/**
 * Service para lÃ³gica de negocio de MembresÃ­a en Grupos Ministeriales
 */
export class MembresiaGrupoService {
  private membresiaGrupoRepository: MembresiaGrupoRepository;

  constructor(repository: MembresiaGrupoRepository = new MembresiaGrupoRepository()) {
    this.membresiaGrupoRepository = repository;
  }

  /**
   * Vincula un miembro a un grupo ministerial (RF_06)
   *
   * Validaciones:
   * - Miembro debe existir y estar activo
   * - Miembro debe tener estado_membresia = 'plena_comunion'
   * - Grupo debe existir y estar activo
   * - Rol debe existir y estar activo
   * - No permitir duplicados (mismo miembro, grupo, rol activo)
   */
  async vincularMiembro(
    miembroId: number,
    grupoId: number,
    rolId: number,
    fechaVinculacion?: string,
  ): Promise<ServiceResponse<MembresiaGrupo | null>> {
    try {
      // 1. Verificar que miembro exista y estÃ© activo
      const miembroStatus = await this.membresiaGrupoRepository.verificarMiembroActivo(miembroId);

      if (!miembroStatus.existe) {
        return ServiceResponse.failure('El miembro no existe', null, StatusCodes.NOT_FOUND);
      }

      if (!miembroStatus.activo) {
        return ServiceResponse.failure('El miembro no estÃ¡ activo', null, StatusCodes.BAD_REQUEST);
      }

      // // 2. Verificar que estado_membresia = 'plena_comunion'
      // if (!miembroStatus.plena_comunion) {
      //   return ServiceResponse.failure(
      //     'El miembro debe tener estado de plena comuniÃ³n para ser vinculado',
      //     null,
      //     StatusCodes.BAD_REQUEST,
      //   );
      // }

      // 3. Verificar que grupo exista y estÃ© activo
      const grupoStatus = await this.membresiaGrupoRepository.verificarGrupoActivo(grupoId);

      if (!grupoStatus.existe) {
        return ServiceResponse.failure(
          'El grupo ministerial no existe',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      if (!grupoStatus.activo) {
        return ServiceResponse.failure(
          'El grupo ministerial no estÃ¡ activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 4. Verificar que rol exista y estÃ© activo
      const rolStatus = await this.membresiaGrupoRepository.verificarRolActivo(rolId);

      if (!rolStatus.existe) {
        return ServiceResponse.failure('El rol de grupo no existe', null, StatusCodes.NOT_FOUND);
      }

      if (!rolStatus.activo) {
        return ServiceResponse.failure(
          'El rol de grupo no estÃ¡ activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }
      // 4a. Si el rol requiere plena comunión, el miembro debe cumplirla.
      if (rolStatus.requiere_plena_comunion && !miembroStatus.plena_comunion) {
        return ServiceResponse.failure(
          'Este rol requiere plena comunión. El miembro no cumple esa condición.',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 4b. Bloquear asignaciÃ³n directa del rol ENCARGADO
      if (rolId === ROL_ENCARGADO_ID) {
        return ServiceResponse.failure(
          'El rol ENCARGADO se asigna solo mediante PUT /api/grupos-ministeriales/:id/encargado',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 5. Verificar que el rol no requiera plena comuniÃ³n si el miembro no la tiene
      // (Esta validaciÃ³n ya estÃ¡ cubierta en el punto 2)

      // 6. Regla 1: un miembro solo puede tener 1 rol activo por grupo
      const tieneRolActivo = await this.membresiaGrupoRepository.existeMembresiaActivaEnGrupo(
        miembroId,
        grupoId,
      );

      if (tieneRolActivo) {
        return ServiceResponse.failure(
          'El miembro ya tiene un rol activo en este grupo. Debes cambiar el rol en lugar de vincular otro.',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // 7. No permitir duplicados (mismo miembro, grupo, rol activo)
      const existeDuplicado = await this.membresiaGrupoRepository.verificarDuplicado(
        miembroId,
        grupoId,
        rolId,
      );

      if (existeDuplicado) {
        return ServiceResponse.failure(
          'El miembro ya estÃ¡ vinculado a este grupo con este rol',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // 7. Vincular miembro
      const membresia = await this.membresiaGrupoRepository.vincularMiembroAsync(
        miembroId,
        grupoId,
        rolId,
        fechaVinculacion,
      );

      return ServiceResponse.success<MembresiaGrupo>(
        'Miembro vinculado exitosamente al grupo ministerial',
        membresia,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al vincular miembro: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al vincular miembro al grupo ministerial',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Desvincula un miembro de un grupo ministerial (RF_07)
   *
   * Validaciones:
   * - MembresÃ­a debe existir
   * - fecha_desvinculacion debe ser NULL (membresÃ­a activa)
   */
  async desvincularMiembro(
    id: number,
    fechaDesvinculacion?: string,
  ): Promise<ServiceResponse<MembresiaGrupo | null>> {
    try {
      // 1. Verificar que la membresÃ­a exista
      const membresiaExistente = await this.membresiaGrupoRepository.findByIdAsync(id);

      if (!membresiaExistente) {
        return ServiceResponse.failure('La membresÃ­a no existe', null, StatusCodes.NOT_FOUND);
      }

      // 2. Bloquear desvinculaciÃ³n directa del Encargado
      if (
        membresiaExistente.rol_grupo_id === ROL_ENCARGADO_ID &&
        membresiaExistente.fecha_desvinculacion === null
      ) {
        return ServiceResponse.failure(
          'No se puede desvincular el Encargado directamente. Usa PUT /api/grupos-ministeriales/:id/encargado.',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 3. Verificar que fecha_desvinculacion sea NULL (membresÃ­a activa)
      if (membresiaExistente.fecha_desvinculacion !== null) {
        return ServiceResponse.failure(
          'La membresÃ­a ya estÃ¡ desvinculada',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 4. Desvincular miembro
      const membresia = await this.membresiaGrupoRepository.desvincularMiembroAsync(
        id,
        fechaDesvinculacion,
      );

      if (!membresia) {
        return ServiceResponse.failure(
          'Error al desvincular miembro',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      return ServiceResponse.success<MembresiaGrupo>(
        'Miembro desvinculado exitosamente del grupo ministerial',
        membresia,
      );
    } catch (error) {
      const errorMessage = `Error al desvincular miembro: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al desvincular miembro del grupo ministerial',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cambia el rol de una membresÃ­a activa
   */
  async cambiarRol(
    id: number,
    rolGrupoId: number,
  ): Promise<ServiceResponse<MembresiaGrupo | null>> {
    try {
      // 1. Verificar que la membresÃ­a exista
      const membresiaExistente = await this.membresiaGrupoRepository.findByIdAsync(id);

      if (!membresiaExistente) {
        return ServiceResponse.failure('La membresÃ­a no existe', null, StatusCodes.NOT_FOUND);
      }

      // 2. Verificar que estÃ© activa
      if (membresiaExistente.fecha_desvinculacion !== null) {
        return ServiceResponse.failure(
          'No se puede cambiar el rol de una membresÃ­a desvinculada',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 2b. Bloquear cambio de rol cuando la membresÃ­a actual ya es ENCARGADO
      if (membresiaExistente.rol_grupo_id === ROL_ENCARGADO_ID) {
        return ServiceResponse.failure(
          'El rol ENCARGADO no se cambia por este endpoint. Usa PUT /api/grupos-ministeriales/:id/encargado.',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 3. Bloquear asignaciÃ³n del rol ENCARGADO por esta vÃ­a
      if (rolGrupoId === ROL_ENCARGADO_ID) {
        return ServiceResponse.failure(
          'El rol ENCARGADO se asigna solo mediante PUT /api/grupos-ministeriales/:id/encargado',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 4. Verificar que no sea el mismo rol
      if (membresiaExistente.rol_grupo_id === rolGrupoId) {
        return ServiceResponse.failure(
          'El miembro ya tiene este rol asignado',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // 4. Verificar que el nuevo rol exista y estÃ© activo
      const rolStatus = await this.membresiaGrupoRepository.verificarRolActivo(rolGrupoId);

      if (!rolStatus.existe) {
        return ServiceResponse.failure('El rol de grupo no existe', null, StatusCodes.NOT_FOUND);
      }

      if (!rolStatus.activo) {
        return ServiceResponse.failure(
          'El rol de grupo no estÃ¡ activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }
      // 4b. Si el nuevo rol requiere plena comunión, validar estado del miembro actual.
      if (rolStatus.requiere_plena_comunion) {
        const miembroStatus = await this.membresiaGrupoRepository.verificarMiembroActivo(
          membresiaExistente.miembro_id,
        );
        if (!miembroStatus.existe || !miembroStatus.activo) {
          return ServiceResponse.failure(
            'El miembro asociado a la membresía no existe o no está activo',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
        if (!miembroStatus.plena_comunion) {
          return ServiceResponse.failure(
            'Este rol requiere plena comunión. El miembro no cumple esa condición.',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
      }

      // 5. Rotar: cerrar fila actual e insertar nueva fila activa con el nuevo rol
      const membresia = await this.membresiaGrupoRepository.rotarRolAsync(
        id,
        membresiaExistente.miembro_id,
        membresiaExistente.grupo_id,
        rolGrupoId,
      );

      return ServiceResponse.success<MembresiaGrupo>('Rol cambiado exitosamente', membresia);
    } catch (error) {
      const errorMessage = `Error al cambiar rol de membresÃ­a: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar el rol de la membresÃ­a',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene todas las membresÃ­as de un miembro
   */
  async getMembresiasByMiembro(
    miembroId: number,
    rol?: 'administrador' | 'usuario',
    miembroIdToken?: number | null,
  ): Promise<ServiceResponse<MembresiaGrupoConNombres[] | null>> {
    try {
      // Un usuario no-admin solo puede consultar sus propias membresÃ­as
      if (rol !== 'administrador' && rol !== undefined && miembroIdToken !== miembroId) {
        return ServiceResponse.failure(
          'No tiene permisos para consultar las membresÃ­as de otro miembro',
          null,
          StatusCodes.FORBIDDEN,
        );
      }

      const membresias = await this.membresiaGrupoRepository.findByMiembroIdAsync(miembroId);

      if (!membresias) {
        return ServiceResponse.failure(
          'Error al obtener membresÃ­as del miembro',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (membresias.length === 0) {
        return ServiceResponse.success<MembresiaGrupoConNombres[]>(
          'No se encontraron membresÃ­as para este miembro',
          [],
        );
      }

      return ServiceResponse.success<MembresiaGrupoConNombres[]>(
        'MembresÃ­as encontradas',
        membresias,
      );
    } catch (error) {
      const errorMessage = `Error al obtener membresÃ­as por miembro: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener membresÃ­as del miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene todas las membresÃ­as activas de un grupo
   */
  async getMembresiasByGrupo(
    grupoId: number,
  ): Promise<ServiceResponse<MembresiaGrupoConNombres[] | null>> {
    try {
      const membresias = await this.membresiaGrupoRepository.findByGrupoIdAsync(grupoId);

      if (!membresias) {
        return ServiceResponse.failure(
          'Error al obtener miembros del grupo',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (membresias.length === 0) {
        return ServiceResponse.success<MembresiaGrupoConNombres[]>(
          'No se encontraron miembros en este grupo',
          [],
        );
      }

      return ServiceResponse.success<MembresiaGrupoConNombres[]>(
        'Miembros del grupo encontrados',
        membresias,
      );
    } catch (error) {
      const errorMessage = `Error al obtener membresÃ­as por grupo: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener miembros del grupo',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const membresiaGrupoService = new MembresiaGrupoService();
