import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import type { ROLES_USUARIO, Usuario } from './usuariosModel';
import { UsuariosRepository } from './usuariosRepository';

const SALT_ROUNDS = 10;

/**
 * Servicio con lógica de negocio para Usuarios
 */
export class UsuariosService {
  private usuariosRepository: UsuariosRepository;

  constructor(repository: UsuariosRepository = new UsuariosRepository()) {
    this.usuariosRepository = repository;
  }

  /**
   * Obtiene todos los usuarios
   */
  async findAll(): Promise<ServiceResponse<Usuario[] | null>> {
    try {
      const usuarios = await this.usuariosRepository.findAllAsync();

      if (!usuarios) {
        return ServiceResponse.failure(
          'Error al obtener usuarios',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      if (usuarios.length === 0) {
        return ServiceResponse.success<Usuario[]>('No se encontraron usuarios', []);
      }

      return ServiceResponse.success<Usuario[]>('Usuarios encontrados', usuarios);
    } catch (error) {
      const errorMessage = `Error al obtener usuarios: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener usuarios',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  async findById(id: number): Promise<ServiceResponse<Usuario | null>> {
    try {
      const usuario = await this.usuariosRepository.findByIdAsync(id);

      if (!usuario) {
        return ServiceResponse.failure('Usuario no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Usuario>('Usuario encontrado', usuario);
    } catch (error) {
      const errorMessage = `Error al obtener usuario: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener usuario',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo usuario con password hasheado
   */
  async create(usuarioData: {
    email: string;
    password: string;
    rol: (typeof ROLES_USUARIO)[number];
    miembro_id?: number;
  }): Promise<ServiceResponse<Usuario | null>> {
    try {
      // Validar email único
      const existeEmail = await this.usuariosRepository.existsByEmailAsync(usuarioData.email);
      if (existeEmail) {
        return ServiceResponse.failure(
          'Ya existe un usuario con ese email',
          null,
          StatusCodes.CONFLICT,
        );
      }

      // Validar que el miembro exista (si se proporcionó)
      if (usuarioData.miembro_id) {
        const miembroExiste = await this.usuariosRepository.miembroExistsAsync(
          usuarioData.miembro_id,
        );
        if (!miembroExiste) {
          return ServiceResponse.failure(
            'El miembro especificado no existe o no está activo',
            null,
            StatusCodes.BAD_REQUEST,
          );
        }

        // Validar que el miembro no tenga ya un usuario
        const miembroTieneUsuario = await this.usuariosRepository.miembroHasUsuarioAsync(
          usuarioData.miembro_id,
        );
        if (miembroTieneUsuario) {
          return ServiceResponse.failure(
            'El miembro especificado ya tiene un usuario asociado',
            null,
            StatusCodes.CONFLICT,
          );
        }
      }

      // Hashear password
      const password_hash = await bcrypt.hash(usuarioData.password, SALT_ROUNDS);

      const usuario = await this.usuariosRepository.createAsync({
        email: usuarioData.email,
        password_hash,
        rol: usuarioData.rol,
        miembro_id: usuarioData.miembro_id,
      });

      return ServiceResponse.success<Usuario>(
        'Usuario creado exitosamente',
        usuario,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = `Error al crear usuario: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al crear usuario',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Actualiza un usuario existente (email y/o rol)
   */
  async update(
    id: number,
    usuarioData: { email?: string; rol?: (typeof ROLES_USUARIO)[number] },
  ): Promise<ServiceResponse<Usuario | null>> {
    try {
      // Validar email único (excluyendo el usuario actual)
      if (usuarioData.email) {
        const existeEmail = await this.usuariosRepository.existsByEmailAsync(usuarioData.email, id);
        if (existeEmail) {
          return ServiceResponse.failure(
            'Ya existe un usuario con ese email',
            null,
            StatusCodes.CONFLICT,
          );
        }
      }

      const usuario = await this.usuariosRepository.updateAsync(id, usuarioData);

      if (!usuario) {
        return ServiceResponse.failure('Usuario no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Usuario>('Usuario actualizado exitosamente', usuario);
    } catch (error) {
      const errorMessage = `Error al actualizar usuario: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al actualizar usuario',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Activa o desactiva un usuario
   */
  async updateEstado(id: number, activo: boolean): Promise<ServiceResponse<Usuario | null>> {
    try {
      // Verificar que el usuario exista
      const usuario = await this.usuariosRepository.findByIdIncludingInactiveAsync(id);
      if (!usuario) {
        return ServiceResponse.failure('Usuario no encontrado', null, StatusCodes.NOT_FOUND);
      }

      if (usuario.activo === activo) {
        const estado = activo ? 'activo' : 'inactivo';
        return ServiceResponse.failure(
          `El usuario ya se encuentra ${estado}`,
          null,
          StatusCodes.CONFLICT,
        );
      }

      const usuarioActualizado = await this.usuariosRepository.updateEstadoAsync(id, activo);

      if (!usuarioActualizado) {
        return ServiceResponse.failure(
          'Error al cambiar el estado del usuario',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      const mensaje = activo ? 'Usuario activado exitosamente' : 'Usuario desactivado exitosamente';

      return ServiceResponse.success<Usuario>(mensaje, usuarioActualizado);
    } catch (error) {
      const errorMessage = `Error al cambiar estado del usuario: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar el estado del usuario',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const usuariosService = new UsuariosService();
