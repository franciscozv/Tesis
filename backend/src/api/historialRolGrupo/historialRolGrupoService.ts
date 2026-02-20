import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import { HistorialRolGrupoRepository } from './historialRolGrupoRepository';
import type { HistorialRolGrupo } from './historialRolGrupoModel';

/**
 * Servicio con lógica de negocio para Historial de Rol en Grupo
 */
export class HistorialRolGrupoService {
  private historialRepository: HistorialRolGrupoRepository;

  constructor(repository: HistorialRolGrupoRepository = new HistorialRolGrupoRepository()) {
    this.historialRepository = repository;
  }

  /**
   * Obtiene todos los registros de historial con filtros opcionales
   */
  async findAll(filters: {
    miembro_grupo_id?: number;
  }): Promise<ServiceResponse<HistorialRolGrupo[] | null>> {
    try {
      const registros = await this.historialRepository.findAllAsync(filters);

      if (!registros) {
        return ServiceResponse.failure(
          'Error al obtener historial de cambios de rol',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      if (registros.length === 0) {
        return ServiceResponse.success<HistorialRolGrupo[]>(
          'No se encontraron registros de historial',
          []
        );
      }

      return ServiceResponse.success<HistorialRolGrupo[]>(
        'Registros de historial encontrados',
        registros
      );
    } catch (error) {
      const errorMessage = `Error al obtener historial: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener historial de cambios de rol',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtiene un registro de historial por ID
   */
  async findById(id: number): Promise<ServiceResponse<HistorialRolGrupo | null>> {
    try {
      const registro = await this.historialRepository.findByIdAsync(id);

      if (!registro) {
        return ServiceResponse.failure(
          'Registro de historial no encontrado',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      return ServiceResponse.success<HistorialRolGrupo>(
        'Registro de historial encontrado',
        registro
      );
    } catch (error) {
      const errorMessage = `Error al obtener registro de historial: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener registro de historial',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Registra un cambio de rol y actualiza la membresía
   */
  async create(historialData: {
    miembro_grupo_id: number;
    rol_grupo_anterior: number;
    rol_grupo_nuevo: number;
    motivo: string;
    usuario_id: number;
  }): Promise<ServiceResponse<HistorialRolGrupo | null>> {
    try {
      // Validar que la membresía de grupo exista y esté activa
      const membresia = await this.historialRepository.miembroGrupoExistsAsync(
        historialData.miembro_grupo_id
      );
      if (!membresia.exists) {
        return ServiceResponse.failure(
          'La membresía de grupo especificada no existe o está desvinculada',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que el rol_grupo_anterior coincida con el rol actual de la membresía
      if (membresia.rol_grupo_id !== historialData.rol_grupo_anterior) {
        return ServiceResponse.failure(
          `El rol anterior indicado (${historialData.rol_grupo_anterior}) no coincide con el rol actual de la membresía (${membresia.rol_grupo_id})`,
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que el rol anterior exista
      const rolAnteriorExiste = await this.historialRepository.rolGrupoExistsAsync(
        historialData.rol_grupo_anterior
      );
      if (!rolAnteriorExiste) {
        return ServiceResponse.failure(
          'El rol de grupo anterior especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que el rol nuevo exista
      const rolNuevoExiste = await this.historialRepository.rolGrupoExistsAsync(
        historialData.rol_grupo_nuevo
      );
      if (!rolNuevoExiste) {
        return ServiceResponse.failure(
          'El rol de grupo nuevo especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que el usuario exista y esté activo
      const usuarioExiste = await this.historialRepository.usuarioExistsAsync(
        historialData.usuario_id
      );
      if (!usuarioExiste) {
        return ServiceResponse.failure(
          'El usuario especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Crear el registro de historial
      const registro = await this.historialRepository.createAsync(historialData);

      // Actualizar automáticamente el rol en la membresía
      await this.historialRepository.updateRolMembresiaAsync(
        historialData.miembro_grupo_id,
        historialData.rol_grupo_nuevo
      );

      return ServiceResponse.success<HistorialRolGrupo>(
        'Cambio de rol registrado exitosamente',
        registro,
        StatusCodes.CREATED
      );
    } catch (error) {
      const errorMessage = `Error al registrar cambio de rol: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al registrar cambio de rol',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const historialRolGrupoService = new HistorialRolGrupoService();
