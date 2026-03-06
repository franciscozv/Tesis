import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import type { IntegranteGrupo, IntegranteGrupoConNombres } from './integranteGrupoModel';
import { IntegranteGrupoRepository } from './integranteGrupoRepository';

/**
 * Service para l�gica de negocio de Integrantes en Grupo
 */
export class IntegranteGrupoService {
  private integranteGrupoRepository: IntegranteGrupoRepository;

  constructor(repository: IntegranteGrupoRepository = new IntegranteGrupoRepository()) {
    this.integranteGrupoRepository = repository;
  }

  /**
   * Vincula un miembro a un grupo ministerial (RF_06)
   *
   * Validaciones:
   * - Miembro debe existir y estar activo
   * - Miembro debe tener estado_comunion = 'plena_comunion'
   * - Grupo debe existir y estar activo
   * - Rol debe existir y estar activo
   * - No permitir duplicados (mismo miembro, grupo, rol activo)
   */
  async vincularMiembro(
    miembroId: number,
    grupoId: number,
    rolId: number,
    fechaVinculacion?: string,
    rolUsuario?: string,
  ): Promise<ServiceResponse<IntegranteGrupo | null>> {
    try {
      // 1. Verificar que miembro exista y est� activo
      const miembroStatus = await this.integranteGrupoRepository.verificarMiembroActivo(miembroId);

      if (!miembroStatus.existe) {
        return ServiceResponse.failure('El miembro no existe', null, StatusCodes.NOT_FOUND);
      }

      if (!miembroStatus.activo) {
        return ServiceResponse.failure('El miembro no est� activo', null, StatusCodes.BAD_REQUEST);
      }

      // 3. Verificar que grupo exista y est� activo
      const grupoStatus = await this.integranteGrupoRepository.verificarGrupoActivo(grupoId);

      if (!grupoStatus.existe) {
        return ServiceResponse.failure(
          'El grupo ministerial no existe',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      if (!grupoStatus.activo) {
        return ServiceResponse.failure(
          'El grupo ministerial no est� activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 4. Verificar que rol exista y est� activo
      const rolStatus = await this.integranteGrupoRepository.verificarRolActivo(rolId);

      if (!rolStatus.existe) {
        return ServiceResponse.failure('El rol de grupo no existe', null, StatusCodes.NOT_FOUND);
      }

      if (!rolStatus.activo) {
        return ServiceResponse.failure(
          'El rol de grupo no est� activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 4b. Solo administradores pueden asignar cargos de directiva
      if (rolStatus.es_directiva && rolUsuario !== 'administrador') {
        return ServiceResponse.failure(
          'Solo un administrador puede asignar cargos de directiva',
          null,
          StatusCodes.FORBIDDEN,
        );
      }

      // 4a. Si el rol requiere plena comuni�n, el miembro debe cumplirla.
      if (rolStatus.requiere_plena_comunion && !miembroStatus.plena_comunion) {
        return ServiceResponse.failure(
          'Este rol requiere plena comuni�n. El miembro no cumple esa condici�n.',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 4c. Si el rol es �nico, verificar que no est� ya ocupado en el grupo
      if (rolStatus.es_unico) {
        const rolOcupado = await this.integranteGrupoRepository.estaRolOcupadoEnGrupo(
          grupoId,
          rolId,
        );
        if (rolOcupado) {
          return ServiceResponse.failure(
            'Este cargo ya tiene un titular activo en el grupo. Solo puede haber un titular por cargo �nico.',
            null,
            StatusCodes.CONFLICT,
          );
        }
      }

      // 6. Regla 1: un miembro solo puede tener 1 rol activo por grupo
      const tieneRolActivo = await this.integranteGrupoRepository.existeIntegranteActivoEnGrupo(
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
      const existeDuplicado = await this.integranteGrupoRepository.verificarDuplicado(
        miembroId,
        grupoId,
        rolId,
      );

      if (existeDuplicado) {
        return ServiceResponse.failure(
          'El miembro ya est� vinculado a este grupo con este rol',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // 7. Vincular miembro
      const integrante = await this.integranteGrupoRepository.vincularMiembroAsync(
        miembroId,
        grupoId,
        rolId,
        fechaVinculacion,
      );

      return ServiceResponse.success<IntegranteGrupo>(
        'Miembro vinculado exitosamente al grupo ministerial',
        integrante,
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
   * - Integraci�n debe existir
   * - fecha_desvinculacion debe ser NULL (integraci�n activa)
   */
  async desvincularMiembro(
    id: number,
    fechaDesvinculacion?: string,
    rolUsuario?: string,
  ): Promise<ServiceResponse<IntegranteGrupo | null>> {
    try {
      // 1. Verificar que la integraci�n exista
      const integranteExistente = await this.integranteGrupoRepository.findByIdAsync(id);

      if (!integranteExistente) {
        return ServiceResponse.failure('La integraci�n no existe', null, StatusCodes.NOT_FOUND);
      }

      // 3. Verificar que fecha_desvinculacion sea NULL (integraci�n activa)
      if (integranteExistente.fecha_desvinculacion !== null) {
        return ServiceResponse.failure(
          'La integraci�n ya est� desvinculada',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 3b. Si el cargo de la integraci�n es directiva, solo admin puede desvincular
      const rolStatus = await this.integranteGrupoRepository.verificarRolActivo(
        integranteExistente.rol_grupo_id,
      );
      if (rolStatus.es_directiva && rolUsuario !== 'administrador') {
        return ServiceResponse.failure(
          'No tiene permisos para desvincular a un miembro de la directiva',
          null,
          StatusCodes.FORBIDDEN,
        );
      }

      // 4. Desvincular miembro
      const integrante = await this.integranteGrupoRepository.desvincularMiembroAsync(
        id,
        fechaDesvinculacion,
      );

      if (!integrante) {
        return ServiceResponse.failure(
          'Error al desvincular miembro',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      return ServiceResponse.success<IntegranteGrupo>(
        'Miembro desvinculado exitosamente del grupo ministerial',
        integrante,
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
   * Cambia el rol de una integraci�n activa
   */
  async cambiarRol(
    id: number,
    rolGrupoId: number,
    rolUsuario?: string,
  ): Promise<ServiceResponse<IntegranteGrupo | null>> {
    try {
      // 1. Verificar que la integraci�n exista
      const integranteExistente = await this.integranteGrupoRepository.findByIdAsync(id);

      if (!integranteExistente) {
        return ServiceResponse.failure('La integraci�n no existe', null, StatusCodes.NOT_FOUND);
      }

      // 2. Verificar que est� activa
      if (integranteExistente.fecha_desvinculacion !== null) {
        return ServiceResponse.failure(
          'No se puede cambiar el rol de una integraci�n desvinculada',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 2b. Si el cargo actual es directiva, solo admin puede modificarlo
      const rolActualStatus = await this.integranteGrupoRepository.verificarRolActivo(
        integranteExistente.rol_grupo_id,
      );
      if (rolActualStatus.es_directiva && rolUsuario !== 'administrador') {
        return ServiceResponse.failure(
          'No tiene permisos para cambiar el cargo de un miembro de la directiva',
          null,
          StatusCodes.FORBIDDEN,
        );
      }

      // 4. Verificar que no sea el mismo rol
      if (integranteExistente.rol_grupo_id === rolGrupoId) {
        return ServiceResponse.failure(
          'El miembro ya tiene este rol asignado',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // 4. Verificar que el nuevo rol exista y est� activo
      const rolStatus = await this.integranteGrupoRepository.verificarRolActivo(rolGrupoId);

      if (!rolStatus.existe) {
        return ServiceResponse.failure('El rol de grupo no existe', null, StatusCodes.NOT_FOUND);
      }

      if (!rolStatus.activo) {
        return ServiceResponse.failure(
          'El rol de grupo no est� activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Solo administradores pueden asignar cargos de directiva
      if (rolStatus.es_directiva && rolUsuario !== 'administrador') {
        return ServiceResponse.failure(
          'Solo un administrador puede asignar cargos de directiva',
          null,
          StatusCodes.FORBIDDEN,
        );
      }

      // 4b. Si el nuevo rol es �nico, verificar que no est� ya ocupado en el grupo
      if (rolStatus.es_unico) {
        const rolOcupado = await this.integranteGrupoRepository.estaRolOcupadoEnGrupo(
          integranteExistente.grupo_id,
          rolGrupoId,
        );
        if (rolOcupado) {
          return ServiceResponse.failure(
            'Este cargo ya tiene un titular activo en el grupo. Solo puede haber un titular por cargo �nico.',
            null,
            StatusCodes.CONFLICT,
          );
        }
      }

      // 4c. Si el nuevo rol requiere plena comuni�n, validar estado del miembro actual.
      if (rolStatus.requiere_plena_comunion) {
        const miembroStatus = await this.integranteGrupoRepository.verificarMiembroActivo(
          integranteExistente.miembro_id,
        );
        if (!miembroStatus.existe || !miembroStatus.activo) {
          return ServiceResponse.failure(
            'El miembro asociado a la integraci�n no existe o no est� activo',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
        if (!miembroStatus.plena_comunion) {
          return ServiceResponse.failure(
            'Este rol requiere plena comuni�n. El miembro no cumple esa condici�n.',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
      }

      // 5. Rotar: cerrar fila actual e insertar nueva fila activa con el nuevo rol
      const integrante = await this.integranteGrupoRepository.rotarRolAsync(
        id,
        integranteExistente.miembro_id,
        integranteExistente.grupo_id,
        rolGrupoId,
      );

      return ServiceResponse.success<IntegranteGrupo>('Rol cambiado exitosamente', integrante);
    } catch (error) {
      const errorMessage = `Error al cambiar rol de integraci�n: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar el rol de la integraci�n',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene todas las integraciones de un miembro
   */
  async getIntegrantesByMiembro(
    miembroId: number,
    rol?: 'administrador' | 'usuario',
    miembroIdToken?: number | null,
  ): Promise<ServiceResponse<IntegranteGrupoConNombres[] | null>> {
    try {
      // Un usuario no-admin solo puede consultar sus propias integraciones
      if (rol !== 'administrador' && rol !== undefined && miembroIdToken !== miembroId) {
        return ServiceResponse.failure(
          'No tiene permisos para consultar las integraciones de otro miembro',
          null,
          StatusCodes.FORBIDDEN,
        );
      }

      const integrantes = await this.integranteGrupoRepository.findByMiembroIdAsync(miembroId);

      if (!integrantes) {
        return ServiceResponse.failure(
          'Error al obtener integraciones del miembro',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (integrantes.length === 0) {
        return ServiceResponse.success<IntegranteGrupoConNombres[]>(
          'No se encontraron integraciones para este miembro',
          [],
        );
      }

      return ServiceResponse.success<IntegranteGrupoConNombres[]>(
        'Integraciones encontradas',
        integrantes,
      );
    } catch (error) {
      const errorMessage = `Error al obtener integraciones por miembro: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener integraciones del miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene todas las integraciones activas de un grupo
   */
  async getIntegrantesByGrupo(
    grupoId: number,
  ): Promise<ServiceResponse<IntegranteGrupoConNombres[] | null>> {
    try {
      const integrantes = await this.integranteGrupoRepository.findByGrupoIdAsync(grupoId);

      if (!integrantes) {
        return ServiceResponse.failure(
          'Error al obtener miembros del grupo',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (integrantes.length === 0) {
        return ServiceResponse.success<IntegranteGrupoConNombres[]>(
          'No se encontraron miembros en este grupo',
          [],
        );
      }

      return ServiceResponse.success<IntegranteGrupoConNombres[]>(
        'Miembros del grupo encontrados',
        integrantes,
      );
    } catch (error) {
      const errorMessage = `Error al obtener integraciones por grupo: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener miembros del grupo',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const integranteGrupoService = new IntegranteGrupoService();
