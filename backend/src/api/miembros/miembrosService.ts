import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { historialEstadoService } from '@/api/historialEstado/historialEstadoService';
import type {
  DeleteMiembroResult,
  GetMiembrosQuery,
  Miembro,
  PaginatedMiembrosResponse,
} from '@/api/miembros/miembrosModel';
import { MiembrosRepository } from '@/api/miembros/miembrosRepository';
import type { JwtPayload } from '@/common/middleware/authMiddleware';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { isDirectivaEnAlgunGrupo } from '@/common/utils/grupoPermissions';
import { logger } from '@/server';

const SALT_ROUNDS = 10;

const buildPasswordFromRut = (rut: string): string => {
  const rutBase = rut.split('-')[0] ?? '';
  return rutBase.slice(0, 4);
};

/**
 * Service para lógica de negocio de Miembros
 */
export class MiembrosService {
  private miembrosRepository: MiembrosRepository;

  constructor(repository: MiembrosRepository = new MiembrosRepository()) {
    this.miembrosRepository = repository;
  }

  /**
   * Obtiene todos los miembros activos
   */
  async findAll(): Promise<ServiceResponse<Miembro[] | null>> {
    try {
      const miembros = await this.miembrosRepository.findAllAsync();

      if (!miembros) {
        return ServiceResponse.failure(
          'Error al obtener miembros',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (miembros.length === 0) {
        return ServiceResponse.success<Miembro[]>('No se encontraron miembros', []);
      }

      return ServiceResponse.success<Miembro[]>('Miembros encontrados', miembros);
    } catch (ex) {
      const errorMessage = `Error al obtener miembros: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al obtener los miembros',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene miembros paginados con búsqueda y filtros opcionales
   */
  async findAllPaginated(
    params: GetMiembrosQuery,
    usuario: JwtPayload,
  ): Promise<ServiceResponse<PaginatedMiembrosResponse | null>> {
    try {
      if (usuario.rol === 'usuario') {
        if (!(await isDirectivaEnAlgunGrupo(usuario.id))) {
          return ServiceResponse.failure(
            'No tienes permiso para ver la lista de miembros',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      const { page, limit, search, estado_comunion, incluir_inactivos } = params;

      if (incluir_inactivos && usuario.rol !== 'administrador') {
        return ServiceResponse.failure(
          'No tienes permiso para ver miembros inactivos',
          null,
          StatusCodes.FORBIDDEN,
        );
      }

      const { data, total } = await this.miembrosRepository.findAllPaginatedAsync({
        page,
        limit,
        search,
        estado_comunion,
        incluir_inactivos,
      });
      const totalPages = Math.ceil(total / limit);
      return ServiceResponse.success<PaginatedMiembrosResponse>('Miembros encontrados', {
        data,
        meta: { total, page, limit, totalPages },
      });
    } catch (ex) {
      const errorMessage = `Error al obtener miembros paginados: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al obtener los miembros',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Busca un miembro por ID
   */
  async findById(id: number, usuario: JwtPayload): Promise<ServiceResponse<Miembro | null>> {
    try {
      if (usuario.rol === 'usuario') {
        const esPropioPerfil = usuario.id === id;
        if (!esPropioPerfil && !(await isDirectivaEnAlgunGrupo(usuario.id))) {
          return ServiceResponse.failure(
            'No tienes permiso para ver la información de miembros',
            null,
            StatusCodes.FORBIDDEN,
          );
        }
      }

      const miembro = await this.miembrosRepository.findByIdIncludingInactiveAsync(id);

      if (!miembro) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      if (!miembro.activo && usuario.rol !== 'administrador') {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Miembro>('Miembro encontrado', miembro);
    } catch (ex) {
      const errorMessage = `Error al obtener miembro con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al obtener el miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo miembro (RF_01: Registrar nuevo miembro)
   */
  async create(
    miembroData: Omit<
      Miembro,
      'id' | 'created_at' | 'updated_at' | 'activo' | 'fecha_creacion' | 'ultimo_acceso'
    >,
  ): Promise<ServiceResponse<Miembro | null>> {
    try {
      const passwordPlano = buildPasswordFromRut(miembroData.rut);
      if (passwordPlano.length < 4) {
        return ServiceResponse.failure(
          'RUT inválido: no se pudo generar contraseña inicial',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const password_hash = await bcrypt.hash(passwordPlano, SALT_ROUNDS);
      const miembro = await this.miembrosRepository.createAsync({
        ...miembroData,
        password_hash,
        fecha_creacion: new Date().toISOString(),
      });
      return ServiceResponse.success<Miembro>(
        'Miembro creado exitosamente',
        miembro,
        StatusCodes.CREATED,
      );
    } catch (ex) {
      const errorMessage = `Error al crear miembro: ${(ex as Error).message}`;
      logger.error(errorMessage);

      if ((ex as any).code === '23505') {
        return ServiceResponse.failure(
          'Ya existe un miembro con ese RUT o email',
          null,
          StatusCodes.CONFLICT,
        );
      }

      return ServiceResponse.failure(
        'Ocurrió un error al crear el miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza un miembro existente (RF_03: Actualizar información)
   */
  async update(
    id: number,
    miembroData: Partial<Miembro>,
  ): Promise<ServiceResponse<Miembro | null>> {
    try {
      // estado_comunion solo se modifica vía PATCH /:id/estado
      // campos de auth solo se modifican vía endpoints de cuenta
      const {
        estado_comunion: _,
        rol: __,
        password_hash: ___,
        fecha_creacion: ____,
        ultimo_acceso: _____,
        ...safeData
      } = miembroData as any;
      const miembro = await this.miembrosRepository.updateAsync(id, safeData);

      if (!miembro) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Miembro>('Miembro actualizado exitosamente', miembro);
    } catch (ex) {
      const errorMessage = `Error al actualizar miembro con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);

      if ((ex as any).code === '23505') {
        return ServiceResponse.failure(
          'Ya existe un miembro con ese RUT o email',
          null,
          StatusCodes.CONFLICT,
        );
      }

      return ServiceResponse.failure(
        'Ocurrió un error al actualizar el miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina un miembro: soft delete si tiene dependencias, hard delete si está "limpio"
   */
  async delete(id: number): Promise<ServiceResponse<DeleteMiembroResult | null>> {
    try {
      const miembro = await this.miembrosRepository.findByIdIncludingInactiveAsync(id);

      if (!miembro) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      if (!miembro.activo) {
        return ServiceResponse.failure('El miembro ya está inactivo', null, StatusCodes.CONFLICT);
      }

      const tieneDependencias = await this.miembrosRepository.checkDependenciasAsync(id);

      if (tieneDependencias) {
        await this.miembrosRepository.deleteAsync(id);
        return ServiceResponse.success<DeleteMiembroResult>(
          'Miembro inactivado: tiene registros históricos asociados',
          { tipo: 'inactivado', tieneDependencias: true },
        );
      }

      await this.miembrosRepository.hardDeleteAsync(id);
      return ServiceResponse.success<DeleteMiembroResult>('Miembro eliminado permanentemente', {
        tipo: 'eliminado',
        tieneDependencias: false,
      });
    } catch (ex) {
      const errorMessage = `Error al eliminar miembro con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al eliminar el miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Reactiva un miembro inactivo
   */
  async reactivar(id: number): Promise<ServiceResponse<Miembro | null>> {
    try {
      const miembro = await this.miembrosRepository.reactivarAsync(id);

      if (!miembro) {
        return ServiceResponse.failure(
          'Miembro no encontrado o ya está activo',
          null,
          StatusCodes.NOT_FOUND,
        );
      }

      return ServiceResponse.success<Miembro>('Miembro reactivado exitosamente', miembro);
    } catch (ex) {
      const errorMessage = `Error al reactivar miembro con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al reactivar el miembro',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza datos de contacto del perfil propio
   */
  async updateMiPerfil(
    miembroId: number,
    data: { direccion?: string | null; telefono?: string | null; email?: string | null },
  ): Promise<ServiceResponse<Miembro | null>> {
    try {
      const miembro = await this.miembrosRepository.updatePerfilAsync(miembroId, data);

      if (!miembro) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Miembro>('Perfil actualizado exitosamente', miembro);
    } catch (ex) {
      const errorMessage = `Error al actualizar perfil: ${(ex as Error).message}`;
      logger.error(errorMessage);

      if ((ex as any).code === '23505') {
        return ServiceResponse.failure(
          'Ya existe un miembro con ese email',
          null,
          StatusCodes.CONFLICT,
        );
      }

      return ServiceResponse.failure(
        'Ocurrió un error al actualizar el perfil',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cambia el estado de membresía de un miembro (RF_05)
   * Registra automáticamente el cambio en el historial de estado
   */
  async changeEstadoComunion(
    id: number,
    estado_nuevo: string,
    motivo: string,
    usuario_id: number,
  ): Promise<ServiceResponse<Miembro | null>> {
    try {
      const miembroActual = await this.miembrosRepository.findByIdAsync(id);

      if (!miembroActual) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      const estado_anterior = miembroActual.estado_comunion;

      if (estado_nuevo === estado_anterior) {
        return ServiceResponse.failure(
          `El miembro ya se encuentra en estado "${estado_nuevo}"`,
          null,
          StatusCodes.CONFLICT,
        );
      }

      const historialResponse = await historialEstadoService.create({
        miembro_id: id,
        estado_anterior,
        estado_nuevo: estado_nuevo as any,
        motivo,
        usuario_id,
      });

      if (!historialResponse.success) {
        return ServiceResponse.failure(
          historialResponse.message,
          null,
          historialResponse.statusCode,
        );
      }

      const miembroActualizado = await this.miembrosRepository.findByIdAsync(id);

      if (!miembroActualizado) {
        return ServiceResponse.failure(
          'Estado actualizado pero error al recuperar datos del miembro',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      return ServiceResponse.success<Miembro>(
        'Estado de comunión actualizado exitosamente',
        miembroActualizado,
      );
    } catch (ex) {
      const errorMessage = `Error al cambiar estado de comunión del miembro con id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al cambiar el estado de comunión',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── Gestión de cuenta de acceso ──────────────────────────────────────────

  /**
   * Actualiza email y/o rol de la cuenta de un miembro
   */
  async actualizarCuenta(
    miembroId: number,
    data: { email?: string; rol?: 'administrador' | 'usuario' },
  ): Promise<ServiceResponse<Miembro | null>> {
    try {
      const miembro = await this.miembrosRepository.findByIdIncludingInactiveAsync(miembroId);
      if (!miembro) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      if (data.email) {
        const emailEnUso = await this.miembrosRepository.existsByEmailAsync(data.email, miembroId);
        if (emailEnUso) {
          return ServiceResponse.failure(
            'Ya existe un miembro con ese email',
            null,
            StatusCodes.CONFLICT,
          );
        }
      }

      const miembroActualizado = await this.miembrosRepository.updateCuentaAsync(miembroId, data);

      if (!miembroActualizado) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Miembro>(
        'Cuenta actualizada exitosamente',
        miembroActualizado,
      );
    } catch (ex) {
      const errorMessage = `Error al actualizar cuenta: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Ocurrió un error al actualizar la cuenta',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Restablece la contraseÃ±a de un miembro (admin)
   */
  async resetPassword(
    miembroId: number,
    nueva_password: string,
  ): Promise<ServiceResponse<Miembro | null>> {
    try {
      const miembro = await this.miembrosRepository.findByIdIncludingInactiveAsync(miembroId);
      if (!miembro) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      if (!miembro.activo) {
        return ServiceResponse.failure(
          'No se puede restablecer contraseÃ±a de un miembro inactivo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const password_hash = await bcrypt.hash(nueva_password, SALT_ROUNDS);
      const miembroActualizado = await this.miembrosRepository.updatePasswordAsync(
        miembroId,
        password_hash,
      );

      if (!miembroActualizado) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Miembro>(
        'ContraseÃ±a restablecida exitosamente',
        miembroActualizado,
      );
    } catch (ex) {
      const errorMessage = `Error al restablecer contraseÃ±a: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'OcurriÃ³ un error al restablecer la contraseÃ±a',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const miembrosService = new MiembrosService();
