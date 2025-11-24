import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import { env } from '@/common/utils/envConfig';
import { AuthRepository } from './authRepository';
import type {
  JWTPayload,
  LoginResponse,
  RolUsuario,
  UsuarioConMiembro,
  UsuarioPublico,
} from './authModel';

interface RegisterData {
  miembro_id: number;
  email: string;
  password: string;
  rol: RolUsuario;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  private authRepository: AuthRepository;

  constructor(repository: AuthRepository = new AuthRepository()) {
    this.authRepository = repository;
  }

  /**
   * Hash de contraseña con bcryptjs
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Comparar contraseña con hash
   */
  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generar JWT token
   */
  private generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }

  /**
   * Verificar JWT token
   */
  public verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Eliminar password_hash de objeto usuario
   */
  private removePasswordHash(usuario: any): UsuarioPublico {
    const { password_hash, ...usuarioPublico } = usuario;
    return usuarioPublico as UsuarioPublico;
  }

  /**
   * Registrar un nuevo usuario
   */
  async register(registerData: RegisterData): Promise<ServiceResponse<UsuarioPublico | null>> {
    try {
      // Validar que miembro existe y está activo
      const miembroExists = await this.authRepository.miembroExistsAndActiveAsync(
        registerData.miembro_id
      );
      if (!miembroExists) {
        return ServiceResponse.failure(
          'El miembro especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que el email del miembro coincide con el email del registro
      const miembroEmail = await this.authRepository.getMiembroEmailAsync(registerData.miembro_id);
      if (!miembroEmail) {
        return ServiceResponse.failure(
          'No se pudo obtener el email del miembro',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      if (miembroEmail !== registerData.email) {
        return ServiceResponse.failure(
          'El email proporcionado no coincide con el email del miembro',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Validar que no existe usuario con ese miembro_id
      const usuarioExistente = await this.authRepository.findByMiembroIdAsync(
        registerData.miembro_id
      );
      if (usuarioExistente) {
        return ServiceResponse.failure(
          'Ya existe un usuario asociado a este miembro',
          null,
          StatusCodes.CONFLICT
        );
      }

      // Validar que el email no esté en uso
      const emailEnUso = await this.authRepository.findByEmailAsync(registerData.email);
      if (emailEnUso) {
        return ServiceResponse.failure(
          'El email ya está registrado',
          null,
          StatusCodes.CONFLICT
        );
      }

      // Hash del password
      const password_hash = await this.hashPassword(registerData.password);

      // Crear usuario
      const usuario = await this.authRepository.createAsync({
        miembro_id: registerData.miembro_id,
        email: registerData.email,
        password_hash,
        rol: registerData.rol,
      });

      // Remover password_hash antes de devolver
      const usuarioPublico = this.removePasswordHash(usuario);

      return ServiceResponse.success<UsuarioPublico>(
        'Usuario registrado exitosamente',
        usuarioPublico,
        StatusCodes.CREATED
      );
    } catch (error) {
      const errorMessage = `Error al registrar usuario: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al registrar usuario',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Login de usuario
   */
  async login(loginData: LoginData): Promise<ServiceResponse<LoginResponse | null>> {
    try {
      // Buscar usuario por email
      const usuario = await this.authRepository.findByEmailAsync(loginData.email);

      // Si no existe o password incorrecta, devolver mensaje genérico
      if (!usuario) {
        return ServiceResponse.failure(
          'Credenciales inválidas',
          null,
          StatusCodes.UNAUTHORIZED
        );
      }

      // Comparar password
      const passwordValida = await this.comparePassword(loginData.password, usuario.password_hash);
      if (!passwordValida) {
        return ServiceResponse.failure(
          'Credenciales inválidas',
          null,
          StatusCodes.UNAUTHORIZED
        );
      }

      // Generar JWT
      const payload: JWTPayload = {
        id_usuario: usuario.id_usuario,
        miembro_id: usuario.miembro_id,
        email: usuario.email,
        rol: usuario.rol,
      };
      const token = this.generateToken(payload);

      // Actualizar último acceso
      await this.authRepository.updateUltimoAccesoAsync(usuario.id_usuario);

      // Remover password_hash antes de devolver
      const usuarioPublico = this.removePasswordHash(usuario);

      const response: LoginResponse = {
        token,
        usuario: usuarioPublico,
      };

      return ServiceResponse.success<LoginResponse>('Login exitoso', response);
    } catch (error) {
      const errorMessage = `Error en login: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure('Error en login', null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obtener información del usuario autenticado
   */
  async getMe(id_usuario: number): Promise<ServiceResponse<UsuarioConMiembro | null>> {
    try {
      const usuario = await this.authRepository.findByIdWithMiembroAsync(id_usuario);

      if (!usuario) {
        return ServiceResponse.failure('Usuario no encontrado', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<UsuarioConMiembro>('Usuario encontrado', usuario);
    } catch (error) {
      const errorMessage = `Error al obtener usuario: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener usuario',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Cambiar contraseña
   */
  async cambiarPassword(
    id_usuario: number,
    password_actual: string,
    password_nueva: string
  ): Promise<ServiceResponse<null>> {
    try {
      // Buscar usuario
      const usuario = await this.authRepository.findByIdAsync(id_usuario);

      if (!usuario) {
        return ServiceResponse.failure('Usuario no encontrado', null, StatusCodes.NOT_FOUND);
      }

      // Validar password actual
      const passwordValida = await this.comparePassword(password_actual, usuario.password_hash);
      if (!passwordValida) {
        return ServiceResponse.failure(
          'La contraseña actual es incorrecta',
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      // Hash de la nueva contraseña
      const password_hash = await this.hashPassword(password_nueva);

      // Actualizar contraseña
      await this.authRepository.updatePasswordAsync(id_usuario, password_hash);

      return ServiceResponse.success('Contraseña actualizada exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al cambiar contraseña: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar contraseña',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const authService = new AuthService();
