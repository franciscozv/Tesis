import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import type { MembresiaGrupo } from './membresiaGrupoModel';
import { MembresiaGrupoRepository } from './membresiaGrupoRepository';

/**
 * Service para lógica de negocio de Membresía en Grupos Ministeriales
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
      // 1. Verificar que miembro exista y esté activo
      const miembroStatus = await this.membresiaGrupoRepository.verificarMiembroActivo(miembroId);

      if (!miembroStatus.existe) {
        return ServiceResponse.failure('El miembro no existe', null, StatusCodes.NOT_FOUND);
      }

      if (!miembroStatus.activo) {
        return ServiceResponse.failure('El miembro no está activo', null, StatusCodes.BAD_REQUEST);
      }

      // 2. Verificar que estado_membresia = 'plena_comunion'
      if (!miembroStatus.plena_comunion) {
        return ServiceResponse.failure(
          'El miembro debe tener estado de plena comunión para ser vinculado',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 3. Verificar que grupo exista y esté activo
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
          'El grupo ministerial no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 4. Verificar que rol exista y esté activo
      const rolStatus = await this.membresiaGrupoRepository.verificarRolActivo(rolId);

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

      // 5. Verificar que el rol no requiera plena comunión si el miembro no la tiene
      // (Esta validación ya está cubierta en el punto 2)

      // 6. No permitir duplicados (mismo miembro, grupo, rol activo)
      const existeDuplicado = await this.membresiaGrupoRepository.verificarDuplicado(
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
   * - Membresía debe existir
   * - fecha_desvinculacion debe ser NULL (membresía activa)
   */
  async desvincularMiembro(
    id: number,
    fechaDesvinculacion?: string,
  ): Promise<ServiceResponse<MembresiaGrupo | null>> {
    try {
      // 1. Verificar que la membresía exista
      const membresiaExistente = await this.membresiaGrupoRepository.findByIdAsync(id);

      if (!membresiaExistente) {
        return ServiceResponse.failure('La membresía no existe', null, StatusCodes.NOT_FOUND);
      }

      // 2. Verificar que fecha_desvinculacion sea NULL (membresía activa)
      if (membresiaExistente.fecha_desvinculacion !== null) {
        return ServiceResponse.failure(
          'La membresía ya está desvinculada',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 3. Desvincular miembro
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
   * Obtiene todas las membresías de un miembro
   */
  async getMembresiasByMiembro(
    miembroId: number,
  ): Promise<ServiceResponse<MembresiaGrupo[] | null>> {
    try {
      const membresias = await this.membresiaGrupoRepository.findByMiembroIdAsync(miembroId);

      if (!membresias || membresias.length === 0) {
        return ServiceResponse.failure(
          'No se encontraron membresías para este miembro',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<MembresiaGrupo[]>('Membresías encontradas', membresias);
    } catch (error) {
      const errorMessage = `Error al obtener membresías por miembro: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener membresías del miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene todas las membresías activas de un grupo
   */
  async getMembresiasByGrupo(grupoId: number): Promise<ServiceResponse<MembresiaGrupo[] | null>> {
    try {
      const membresias = await this.membresiaGrupoRepository.findByGrupoIdAsync(grupoId);

      if (!membresias || membresias.length === 0) {
        return ServiceResponse.failure(
          'No se encontraron miembros en este grupo',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<MembresiaGrupo[]>(
        'Miembros del grupo encontrados',
        membresias,
      );
    } catch (error) {
      const errorMessage = `Error al obtener membresías por grupo: ${(error as Error).message}`;
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
