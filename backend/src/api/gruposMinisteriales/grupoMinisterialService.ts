import { StatusCodes } from 'http-status-codes';

import type {
  GrupoConEncargado,
  GrupoMinisterial,
} from '@/api/gruposMinisteriales/grupoMinisterialModel';
import { GrupoMinisterialRepository } from '@/api/gruposMinisteriales/grupoMinisterialRepository';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { ROL_ENCARGADO_ID } from '@/common/utils/grupoPermissions';
import { logger } from '@/server';

/**
 * Service para lÃ³gica de negocio de Grupos Ministeriales
 */
export class GrupoMinisterialService {
  private grupoMinisterialRepository: GrupoMinisterialRepository;

  constructor(repository: GrupoMinisterialRepository = new GrupoMinisterialRepository()) {
    this.grupoMinisterialRepository = repository;
  }

  /**
   * Obtiene todos los grupos ministeriales activos, con encargado_actual derivado de membresia_grupo.
   */
  async findAll(): Promise<ServiceResponse<GrupoConEncargado[] | null>> {
    try {
      const grupos = await this.grupoMinisterialRepository.findAllAsync();

      if (!grupos) {
        return ServiceResponse.failure(
          'Error al obtener grupos ministeriales',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (grupos.length === 0) {
        return ServiceResponse.success<GrupoConEncargado[]>(
          'No se encontraron grupos ministeriales',
          [],
        );
      }

      const grupoIds = grupos.map((g) => g.id_grupo);
      const encargadosMap =
        await this.grupoMinisterialRepository.getEncargadosForGruposAsync(grupoIds);

      const gruposConEncargado: GrupoConEncargado[] = grupos.map((g) => ({
        ...g,
        encargado_actual: encargadosMap.get(g.id_grupo) ?? null,
      }));

      return ServiceResponse.success<GrupoConEncargado[]>(
        'Grupos ministeriales encontrados',
        gruposConEncargado,
      );
    } catch (ex) {
      const errorMessage = `Error al obtener grupos ministeriales: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'OcurriÃ³ un error al obtener los grupos ministeriales',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Busca un grupo ministerial por ID, con encargado_actual derivado de membresia_grupo.
   */
  async findById(id: number): Promise<ServiceResponse<GrupoConEncargado | null>> {
    try {
      const grupo = await this.grupoMinisterialRepository.findByIdAsync(id);

      if (!grupo) {
        return ServiceResponse.failure(
          'Grupo ministerial no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      const encargado_actual = await this.grupoMinisterialRepository.getEncargadoActualAsync(id);

      return ServiceResponse.success<GrupoConEncargado>('Grupo ministerial encontrado', {
        ...grupo,
        encargado_actual,
      });
    } catch (ex) {
      const errorMessage = `Error al obtener grupo ministerial con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'OcurriÃ³ un error al obtener el grupo ministerial',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo grupo ministerial
   * Validaciones:
   * - El nombre debe ser Ãºnico
   */
  async create(
    grupoData: Omit<GrupoMinisterial, 'id_grupo' | 'created_at' | 'updated_at' | 'activo'>,
  ): Promise<ServiceResponse<GrupoMinisterial | null>> {
    try {
      const grupo = await this.grupoMinisterialRepository.createAsync(grupoData);
      return ServiceResponse.success<GrupoMinisterial>(
        'Grupo ministerial creado exitosamente',
        grupo,
        StatusCodes.CREATED,
      );
    } catch (ex) {
      const errorMessage = `Error al crear grupo ministerial: ${(ex as Error).message}`;
      logger.error(errorMessage);

      // Manejar error de duplicado (nombre Ãºnico)
      if ((ex as any).code === '23505') {
        return ServiceResponse.failure(
          'Ya existe un grupo ministerial con ese nombre',
          null,
          StatusCodes.CONFLICT,
        );
      }

      return ServiceResponse.failure(
        'OcurriÃ³ un error al crear el grupo ministerial',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza un grupo ministerial existente
   * Validaciones:
   * - Si se cambia el nombre, debe ser Ãºnico
   * - No se permite cambiar fecha_creacion
   */
  async update(
    id: number,
    grupoData: Partial<GrupoMinisterial>,
  ): Promise<ServiceResponse<GrupoMinisterial | null>> {
    try {
      // Validar que el grupo existe
      const grupoExistente = await this.grupoMinisterialRepository.findByIdAsync(id);
      if (!grupoExistente) {
        return ServiceResponse.failure(
          'Grupo ministerial no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // No permitir cambiar fecha_creacion
      const dataToUpdate = { ...grupoData };
      delete (dataToUpdate as any).fecha_creacion;

      const grupo = await this.grupoMinisterialRepository.updateAsync(id, dataToUpdate);

      if (!grupo) {
        return ServiceResponse.failure(
          'Grupo ministerial no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<GrupoMinisterial>(
        'Grupo ministerial actualizado exitosamente',
        grupo,
      );
    } catch (ex) {
      const errorMessage = `Error al actualizar grupo ministerial con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);

      // Manejar error de duplicado (nombre Ãºnico)
      if ((ex as any).code === '23505') {
        return ServiceResponse.failure(
          'Ya existe un grupo ministerial con ese nombre',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Manejar error de clave forÃ¡nea (lÃ­der no existe)
      if ((ex as any).code === '23503') {
        return ServiceResponse.failure(
          'El lÃ­der principal especificado no existe',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      return ServiceResponse.failure(
        'OcurriÃ³ un error al actualizar el grupo ministerial',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina lÃ³gicamente un grupo ministerial (soft delete)
   * ValidaciÃ³n:
   * - No debe tener miembros activos (fecha_desvinculacion IS NULL en membresia_grupo)
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      // Validar que el grupo existe
      const grupoExistente = await this.grupoMinisterialRepository.findByIdAsync(id);
      if (!grupoExistente) {
        return ServiceResponse.failure(
          'Grupo ministerial no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // Validar que no tiene miembros activos
      const hasActiveMembers = await this.grupoMinisterialRepository.hasActiveMembersAsync(id);
      if (hasActiveMembers) {
        return ServiceResponse.failure(
          'No se puede eliminar el grupo ministerial porque tiene miembros activos',
          null,
          StatusCodes.CONFLICT,
        );
      }

      await this.grupoMinisterialRepository.deleteAsync(id);
      return ServiceResponse.success('Grupo ministerial eliminado exitosamente', null);
    } catch (ex) {
      const errorMessage = `Error al eliminar grupo ministerial con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'OcurriÃ³ un error al eliminar el grupo ministerial',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Asigna o cambia el encargado de un grupo ministerial.
   * Solo administradores (verificado en el router).
   *
   * Validaciones:
   * - Grupo debe existir y estar activo.
   * - nuevo_miembro_id debe existir y estar activo.
   * - nuevo_miembro_id no debe ser ya el encargado vigente.
   */
  async asignarEncargado(
    grupoId: number,
    nuevoMiembroId: number,
    fecha?: string,
  ): Promise<ServiceResponse<GrupoConEncargado | null>> {
    try {
      // 1. Verificar que el grupo existe
      const grupo = await this.grupoMinisterialRepository.findByIdAsync(grupoId);
      if (!grupo) {
        return ServiceResponse.failure(
          'Grupo ministerial no encontrado',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      // 2. Verificar que el nuevo miembro existe y estÃ¡ activo
      const miembroStatus =
        await this.grupoMinisterialRepository.validateLiderAsync(nuevoMiembroId);
      if (!miembroStatus.exists) {
        return ServiceResponse.failure(
          'El miembro especificado no existe',
          null,
          StatusCodes.NOT_FOUND,
        );
      }
      if (!miembroStatus.isActive) {
        return ServiceResponse.failure(
          'El miembro especificado no estÃ¡ activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }
      // 2b. Validar regla de plena comunión según configuración del rol ENCARGADO
      const encargadoRol =
        await this.grupoMinisterialRepository.getRolStatusAsync(ROL_ENCARGADO_ID);
      if (!encargadoRol.exists || !encargadoRol.activo) {
        return ServiceResponse.failure(
          'No existe un rol ENCARGADO activo en rol_grupo_ministerial',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }
      if (encargadoRol.requiere_plena_comunion && !miembroStatus.isPlenaComunion) {
        return ServiceResponse.failure(
          'Este rol requiere plena comunión. El miembro no cumple esa condición.',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // 3. Verificar que no es ya el encargado vigente
      const encargadoActual =
        await this.grupoMinisterialRepository.getEncargadoActualAsync(grupoId);
      if (encargadoActual?.miembro_id === nuevoMiembroId) {
        return ServiceResponse.failure(
          'El miembro ya es el encargado vigente de este grupo',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // 4. Resolver rol base 'Miembro'
      const idRolMiembro = await this.grupoMinisterialRepository.findRolBaseIdAsync('Miembro');
      if (idRolMiembro === null) {
        return ServiceResponse.failure(
          "No existe rol base 'Miembro' en rol_grupo_ministerial",
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      // 5. Ejecutar la transacciÃ³n (cerrar anterior + insertar nuevo + degradar anterior)
      const nuevoEncargado = await this.grupoMinisterialRepository.asignarEncargadoAsync(
        grupoId,
        nuevoMiembroId,
        idRolMiembro,
        fecha,
      );

      return ServiceResponse.success<GrupoConEncargado>('Encargado asignado exitosamente', {
        ...grupo,
        encargado_actual: nuevoEncargado,
      });
    } catch (ex) {
      const errorMessage = `Error al asignar encargado al grupo ${grupoId}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'OcurriÃ³ un error al asignar el encargado',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene los grupos ministeriales que un usuario puede gestionar segÃºn su rol
   * - Administrador: Retorna todos los grupos activos
   * - LÃ­der: Retorna solo los grupos donde es lÃ­der
   * - Miembro: Retorna array vacÃ­o
   */
  async findMisGrupos(
    rol: 'administrador' | 'usuario',
    miembro_id: number | null,
  ): Promise<ServiceResponse<GrupoConEncargado[] | null>> {
    try {
      let grupos: GrupoMinisterial[] = [];

      if (rol === 'administrador') {
        grupos = await this.grupoMinisterialRepository.findAllAsync();
      } else {
        if (!miembro_id) {
          return ServiceResponse.failure(
            'El usuario no tiene un miembro_id asociado',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
        grupos = await this.grupoMinisterialRepository.findGruposByEncargadoAsync(miembro_id);
      }

      const grupoIds = grupos.map((g) => g.id_grupo);
      const encargadosMap =
        await this.grupoMinisterialRepository.getEncargadosForGruposAsync(grupoIds);

      const gruposConEncargado: GrupoConEncargado[] = grupos.map((g) => ({
        ...g,
        encargado_actual: encargadosMap.get(g.id_grupo) ?? null,
      }));

      return ServiceResponse.success<GrupoConEncargado[]>(
        'Grupos obtenidos exitosamente',
        gruposConEncargado,
      );
    } catch (ex) {
      const errorMessage = `Error al obtener grupos del usuario: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'OcurriÃ³ un error al obtener los grupos',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const grupoMinisterialService = new GrupoMinisterialService();
