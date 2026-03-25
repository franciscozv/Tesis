import { StatusCodes } from 'http-status-codes';
import { emitAndPersist } from '@/api/notificaciones/notificacionesService';
import type { JwtPayload } from '@/common/middleware/authMiddleware';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { nowEnZona } from '@/common/utils/dateTime';
import { isEncargadoDeGrupo } from '@/common/utils/grupoPermissions';
import { logger } from '@/server';
import type {
  IntegranteGrupo,
  IntegranteGrupoConNombres,
  RenovarDirectivaItem,
} from './integranteGrupoModel';
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
    usuario?: JwtPayload,
  ): Promise<ServiceResponse<IntegranteGrupo | null>> {
    try {
      // Validar permisos generales de gestión en el grupo
      if (usuario?.rol === 'usuario') {
        const esEncargado = await isEncargadoDeGrupo(usuario.id, grupoId);
        if (!esEncargado) {
          return ServiceResponse.failure(
            'No tienes permiso para gestionar integrantes en este grupo',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      // 1. Verificar que miembro exista y está activo
      const miembroStatus = await this.integranteGrupoRepository.verificarMiembroActivo(miembroId);

      if (!miembroStatus.existe) {
        return ServiceResponse.failure('El miembro no existe', null, StatusCodes.NOT_FOUND);
      }

      if (!miembroStatus.activo) {
        return ServiceResponse.failure('El miembro no está activo', null, StatusCodes.BAD_REQUEST);
      }

      // 3. Verificar que grupo exista y está activo
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
          'El grupo ministerial no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 4. Verificar que rol exista y está activo
      const rolStatus = await this.integranteGrupoRepository.verificarRolActivo(rolId);

      if (!rolStatus.existe) {
        return ServiceResponse.failure('El rol de grupo no existe', null, StatusCodes.NOT_FOUND);
      }

      if (!rolStatus.activo) {
        return ServiceResponse.failure(
          'El rol de grupo no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 4b-prev. Verificar que el rol está habilitado para este grupo específico
      const rolHabilitado = await this.integranteGrupoRepository.verificarRolHabilitadoEnGrupo(
        grupoId,
        rolId,
      );
      if (!rolHabilitado) {
        return ServiceResponse.failure(
          'Este rol no está configurado para este grupo. Un administrador debe habilitarlo primero.',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 4b. Solo administradores pueden asignar cargos de directiva
      if (rolStatus.es_directiva && usuario?.rol !== 'administrador') {
        return ServiceResponse.failure(
          'Solo un administrador puede asignar cargos de directiva',
          null,
          StatusCodes.FORBIDDEN,
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

      // 4c. Si el rol es único, verificar que no está ya ocupado en el grupo
      if (rolStatus.es_unico) {
        const rolOcupado = await this.integranteGrupoRepository.estaRolOcupadoEnGrupo(
          grupoId,
          rolId,
        );
        if (rolOcupado) {
          return ServiceResponse.failure(
            'Este cargo ya tiene un titular activo en el grupo. Solo puede haber un titular por cargo único.',
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
          'El miembro ya está vinculado a este grupo con este rol',
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

      // 8. Notificar al usuario (opcionalmente no esperar a que termine para no bloquear respuesta)
      emitAndPersist(miembroId, {
        tipo: 'grupo_vinculacion',
        mensaje: `Has sido vinculado al grupo ${grupoStatus.nombre}`,
        detalle: `Tu rol asignado es: ${rolStatus.nombre}`,
        href: `/dashboard/grupos/${grupoId}?from=mis-grupos`,
        timestamp: Date.now(),
      }).catch((err) => logger.warn({ err }, 'Error al notificar vinculación'));

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
   * - fecha_desvinculacion debe ser NULL (integración activa)
   */
  async desvincularMiembro(
    id: number,
    fechaDesvinculacion?: string,
    usuario?: JwtPayload,
  ): Promise<ServiceResponse<IntegranteGrupo | null>> {
    try {
      // 1. Verificar que la integración exista
      const integranteExistente = await this.integranteGrupoRepository.findByIdAsync(id);

      if (!integranteExistente) {
        return ServiceResponse.failure('La integración no existe', null, StatusCodes.NOT_FOUND);
      }

      // Validar permisos generales de gestión en el grupo
      if (usuario?.rol === 'usuario') {
        const esEncargado = await isEncargadoDeGrupo(usuario.id, integranteExistente.grupo_id);
        if (!esEncargado) {
          return ServiceResponse.failure(
            'No tienes permiso para gestionar integrantes en este grupo',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      // 3. Verificar que fecha_desvinculacion sea NULL (integración activa)
      if (integranteExistente.fecha_desvinculacion !== null) {
        return ServiceResponse.failure(
          'La integración ya está desvinculada',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 3b. Si el cargo de la integración es directiva, solo admin puede desvincular
      const rolStatus = await this.integranteGrupoRepository.verificarRolActivo(
        integranteExistente.rol_grupo_id,
      );
      if (rolStatus.es_directiva && usuario?.rol !== 'administrador') {
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

      // 5. Notificar al usuario
      const grupoStatus = await this.integranteGrupoRepository.verificarGrupoActivo(
        integranteExistente.grupo_id,
      );
      emitAndPersist(integranteExistente.miembro_id, {
        tipo: 'grupo_desvinculacion',
        mensaje: `Has sido desvinculado del grupo ${grupoStatus.nombre || ''}`,
        detalle: `Anteriormente tenías el rol: ${rolStatus.nombre}`,
        href: '/dashboard/mis-grupos',
        timestamp: Date.now(),
      }).catch((err) => logger.warn({ err }, 'Error al notificar desvinculación'));

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
   * Cambia el rol de una integración activa
   */
  async cambiarRol(
    id: number,
    rolGrupoId: number,
    usuario?: JwtPayload,
  ): Promise<ServiceResponse<IntegranteGrupo | null>> {
    try {
      // 1. Verificar que la integración exista
      const integranteExistente = await this.integranteGrupoRepository.findByIdAsync(id);

      if (!integranteExistente) {
        return ServiceResponse.failure('La integración no existe', null, StatusCodes.NOT_FOUND);
      }

      // Validar permisos generales de gestión en el grupo
      if (usuario?.rol === 'usuario') {
        const esEncargado = await isEncargadoDeGrupo(usuario.id, integranteExistente.grupo_id);
        if (!esEncargado) {
          return ServiceResponse.failure(
            'No tienes permiso para gestionar integrantes en este grupo',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      // 2. Verificar que está activa
      if (integranteExistente.fecha_desvinculacion !== null) {
        return ServiceResponse.failure(
          'No se puede cambiar el rol de una integración desvinculada',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 2b. Si el cargo actual es directiva, solo admin puede modificarlo
      const rolActualStatus = await this.integranteGrupoRepository.verificarRolActivo(
        integranteExistente.rol_grupo_id,
      );
      if (rolActualStatus.es_directiva && usuario?.rol !== 'administrador') {
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

      // 4. Verificar que el nuevo rol exista y está activo
      const rolStatus = await this.integranteGrupoRepository.verificarRolActivo(rolGrupoId);

      if (!rolStatus.existe) {
        return ServiceResponse.failure('El rol de grupo no existe', null, StatusCodes.NOT_FOUND);
      }

      if (!rolStatus.activo) {
        return ServiceResponse.failure(
          'El rol de grupo no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Verificar que el nuevo rol está habilitado para este grupo
      const rolHabilitadoNuevo = await this.integranteGrupoRepository.verificarRolHabilitadoEnGrupo(
        integranteExistente.grupo_id,
        rolGrupoId,
      );
      if (!rolHabilitadoNuevo) {
        return ServiceResponse.failure(
          'Este rol no está configurado para este grupo. Un administrador debe habilitarlo primero.',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Solo administradores pueden asignar cargos de directiva
      if (rolStatus.es_directiva && usuario?.rol !== 'administrador') {
        return ServiceResponse.failure(
          'Solo un administrador puede asignar cargos de directiva',
          null,
          StatusCodes.FORBIDDEN,
        );
      }

      // 4b. Si el nuevo rol es único, verificar que no está ya ocupado en el grupo
      if (rolStatus.es_unico) {
        const rolOcupado = await this.integranteGrupoRepository.estaRolOcupadoEnGrupo(
          integranteExistente.grupo_id,
          rolGrupoId,
        );
        if (rolOcupado) {
          return ServiceResponse.failure(
            'Este cargo ya tiene un titular activo en el grupo. Solo puede haber un titular por cargo único.',
            null,
            StatusCodes.CONFLICT,
          );
        }
      }

      // 4c. Si el nuevo rol requiere plena comunión, validar estado del miembro actual.
      if (rolStatus.requiere_plena_comunion) {
        const miembroStatus = await this.integranteGrupoRepository.verificarMiembroActivo(
          integranteExistente.miembro_id,
        );
        if (!miembroStatus.existe || !miembroStatus.activo) {
          return ServiceResponse.failure(
            'El miembro asociado a la integración no existe o no está activo',
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
      const integrante = await this.integranteGrupoRepository.rotarRolAsync(
        id,
        integranteExistente.miembro_id,
        integranteExistente.grupo_id,
        rolGrupoId,
      );

      // 6. Notificar al usuario
      const grupoStatus = await this.integranteGrupoRepository.verificarGrupoActivo(
        integranteExistente.grupo_id,
      );
      emitAndPersist(integranteExistente.miembro_id, {
        tipo: 'grupo_rol_cambio',
        mensaje: `Tu rol ha cambiado en el grupo ${grupoStatus.nombre || ''}`,
        detalle: `Nuevo rol: ${rolStatus.nombre}`,
        href: `/dashboard/grupos/${integranteExistente.grupo_id}?from=mis-grupos`,
        timestamp: Date.now(),
      }).catch((err) => logger.warn({ err }, 'Error al notificar cambio de rol'));

      return ServiceResponse.success<IntegranteGrupo>('Rol cambiado exitosamente', integrante);
    } catch (error) {
      const errorMessage = `Error al cambiar rol de integración: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar el rol de la integración',
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
   * Renovación masiva de directiva de un grupo
   *
   * Para cada par (cargo_id, nuevo_miembro_id):
   *  1. Valida cargo y miembro (sin escritura)
   *  2. Cierra al titular saliente
   *  3. Cierra la integración previa del entrante (si existe)
   *  4. Inserta nueva fila activa con el cargo directivo
   */
  async renovarDirectivaMasiva(
    grupoId: number,
    renovaciones: RenovarDirectivaItem[],
    fecha?: string,
    usuario?: JwtPayload,
  ): Promise<ServiceResponse<IntegranteGrupo[] | null>> {
    try {
      if (usuario?.rol === 'usuario') {
        const esEncargado = await isEncargadoDeGrupo(usuario.id, grupoId);
        if (!esEncargado) {
          return ServiceResponse.failure(
            'No tienes permiso para renovar la directiva de este grupo',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      const grupoStatus = await this.integranteGrupoRepository.verificarGrupoActivo(grupoId);
      if (!grupoStatus.existe) {
        return ServiceResponse.failure('El grupo no existe', null, StatusCodes.NOT_FOUND);
      }
      if (!grupoStatus.activo) {
        return ServiceResponse.failure('El grupo no está activo', null, StatusCodes.BAD_REQUEST);
      }

      // Sin duplicados de cargo_id en la misma solicitud
      const cargoIds = renovaciones.map((r) => r.cargo_id);
      if (new Set(cargoIds).size !== cargoIds.length) {
        return ServiceResponse.failure(
          'No se puede renovar el mismo cargo más de una vez en la misma solicitud',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Sin duplicados de miembro_id en la misma solicitud (un miembro no puede tener dos cargos directivos)
      const miembroIds = renovaciones.map((r) => r.nuevo_miembro_id);
      if (new Set(miembroIds).size !== miembroIds.length) {
        return ServiceResponse.failure(
          'No se puede asignar el mismo miembro a múltiples cargos directivos en la misma solicitud',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Validación previa completa (sin escritura)
      const rolesInfo = new Map<number, string>();
      for (const { cargo_id, nuevo_miembro_id } of renovaciones) {
        const rolStatus = await this.integranteGrupoRepository.verificarRolActivo(cargo_id);
        if (!rolStatus.existe) {
          return ServiceResponse.failure(
            `El cargo con ID ${cargo_id} no existe`,
            null,
            StatusCodes.NOT_FOUND,
          );
        }
        rolesInfo.set(cargo_id, rolStatus.nombre || '');

        if (!rolStatus.activo) {
          return ServiceResponse.failure(
            `El cargo con ID ${cargo_id} no está activo`,
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
        if (!rolStatus.es_directiva) {
          return ServiceResponse.failure(
            `El cargo con ID ${cargo_id} no es un cargo directivo`,
            null,
            StatusCodes.BAD_REQUEST,
          );
        }

        // Verificar que el cargo directivo está habilitado para este grupo
        const cargoHabilitado = await this.integranteGrupoRepository.verificarRolHabilitadoEnGrupo(
          grupoId,
          cargo_id,
        );
        if (!cargoHabilitado) {
          return ServiceResponse.failure(
            `El cargo con ID ${cargo_id} no está configurado para este grupo`,
            null,
            StatusCodes.BAD_REQUEST,
          );
        }

        const miembroStatus =
          await this.integranteGrupoRepository.verificarMiembroActivo(nuevo_miembro_id);
        if (!miembroStatus.existe) {
          return ServiceResponse.failure(
            `El miembro con ID ${nuevo_miembro_id} no existe`,
            null,
            StatusCodes.NOT_FOUND,
          );
        }
        if (!miembroStatus.activo) {
          return ServiceResponse.failure(
            `El miembro con ID ${nuevo_miembro_id} no está activo`,
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
        if (rolStatus.requiere_plena_comunion && !miembroStatus.plena_comunion) {
          return ServiceResponse.failure(
            `El cargo con ID ${cargo_id} requiere plena comunión y el miembro con ID ${nuevo_miembro_id} no la cumple`,
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
      }
      const fechaRenovacion = fecha || nowEnZona().toISOString();
      await this.integranteGrupoRepository.renovarDirectivaMasivaAsync(
        grupoId,
        renovaciones,
        fechaRenovacion,
      );

      // 4. Notificar a cada miembro (sin bloquear la respuesta)
      for (const { cargo_id, nuevo_miembro_id } of renovaciones) {
        emitAndPersist(nuevo_miembro_id, {
          tipo: 'grupo_directiva_renovacion',
          mensaje: `Has sido asignado a la directiva del grupo ${grupoStatus.nombre}`,
          detalle: `Cargo: ${rolesInfo.get(cargo_id)}`,
          href: `/dashboard/grupos/${grupoId}?from=mis-grupos`,
          timestamp: Date.now(),
        }).catch((err) =>
          logger.warn({ err }, `Error al notificar renovación a miembro ${nuevo_miembro_id}`),
        );
      }

      return ServiceResponse.success<null>(
        'Directiva renovada exitosamente.',
        null,
        StatusCodes.OK,
      );
    } catch (error) {
      const errorMessage = `Error al renovar directiva: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al renovar la directiva del grupo',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene el historial completo de directiva de un grupo (activos + pasados).
   * Usuarios con rol 'usuario' solo pueden acceder si son directiva activa del grupo.
   */
  async getHistorialDirectiva(
    grupoId: number,
    usuario: JwtPayload,
  ): Promise<ServiceResponse<IntegranteGrupoConNombres[] | null>> {
    try {
      if (usuario.rol === 'usuario') {
        const esDirectiva = await isEncargadoDeGrupo(usuario.id, grupoId);
        if (!esDirectiva) {
          return ServiceResponse.failure(
            'No tienes permiso para ver el historial de directiva de este grupo',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      const historial = await this.integranteGrupoRepository.findHistorialDirectivaAsync(grupoId);
      return ServiceResponse.success<IntegranteGrupoConNombres[]>(
        'Historial de directiva obtenido',
        historial,
      );
    } catch (error) {
      const errorMessage = `Error al obtener historial de directiva: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener el historial de directiva',
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
