import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '@/common/middleware/authMiddleware';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { emailService } from '@/common/utils/emailService';
import { env } from '@/common/utils/envConfig';
import { logger } from '@/server';
import type { LoginResponse } from './authModel';
import { AuthRepository } from './authRepository';

const SALT_ROUNDS = 10;

/**
 * Servicio con lógica de negocio para Autenticación
 */
export class AuthService {
  private authRepository: AuthRepository;

  constructor(repository: AuthRepository = new AuthRepository()) {
    this.authRepository = repository;
  }

  /**
   * Inicia sesión con email y password, retorna JWT
   */
  async login(email: string, password: string): Promise<ServiceResponse<LoginResponse | null>> {
    try {
      const usuario = await this.authRepository.findByEmailAsync(email);

      // Mensaje genérico para no revelar si el email existe
      if (!usuario) {
        return ServiceResponse.failure('Credenciales incorrectas', null, StatusCodes.UNAUTHORIZED);
      }

      if (!usuario.activo) {
        return ServiceResponse.failure('Credenciales incorrectas', null, StatusCodes.UNAUTHORIZED);
      }

      const passwordValido = await bcrypt.compare(password, usuario.password_hash);
      if (!passwordValido) {
        return ServiceResponse.failure('Credenciales incorrectas', null, StatusCodes.UNAUTHORIZED);
      }

      // Generar JWT
      const payload: JwtPayload = {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        miembro_id: usuario.miembro_id,
      };

      const token = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as string & { __brand: 'StringValue' },
      } as jwt.SignOptions);

      // Actualizar último acceso
      await this.authRepository.updateUltimoAccesoAsync(usuario.id);

      const loginResponse: LoginResponse = {
        token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          rol: usuario.rol,
          miembro_id: usuario.miembro_id,
        },
      };

      return ServiceResponse.success<LoginResponse>('Inicio de sesión exitoso', loginResponse);
    } catch (error) {
      const errorMessage = `Error en login: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al iniciar sesión',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cambia la contraseña del usuario autenticado
   */
  async cambiarPassword(
    usuarioId: number,
    passwordActual: string,
    passwordNueva: string,
  ): Promise<ServiceResponse<null>> {
    try {
      const usuario = await this.authRepository.findByIdWithPasswordAsync(usuarioId);

      if (!usuario) {
        return ServiceResponse.failure('Usuario no encontrado', null, StatusCodes.NOT_FOUND);
      }

      const passwordValido = await bcrypt.compare(passwordActual, usuario.password_hash);
      if (!passwordValido) {
        return ServiceResponse.failure(
          'La contraseña actual es incorrecta',
          null,
          StatusCodes.UNAUTHORIZED,
        );
      }

      const nuevoHash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
      await this.authRepository.updatePasswordAsync(usuarioId, nuevoHash);

      return ServiceResponse.success<null>('Contraseña actualizada exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al cambiar contraseña: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al cambiar la contraseña',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Solicita recuperación de contraseña por email
   */
  async recuperarPassword(email: string): Promise<ServiceResponse<null>> {
    try {
      // Siempre retorna éxito para no revelar si el email existe
      const usuario = await this.authRepository.findByEmailAsync(email);

      if (usuario && usuario.activo) {
        const resetToken = jwt.sign(
          { usuario_id: usuario.id, tipo: 'password_reset' },
          env.JWT_SECRET,
          { expiresIn: '1h' } as jwt.SignOptions,
        );

        await emailService.enviarRecuperacionPassword(email, resetToken);
      }

      return ServiceResponse.success<null>(
        'Si el email está registrado, recibirás instrucciones para recuperar tu contraseña',
        null,
      );
    } catch (error) {
      const errorMessage = `Error en recuperación de contraseña: ${(error as Error).message}`;
      logger.error(errorMessage);
      // Retornar éxito incluso si falla el envío para no revelar información
      return ServiceResponse.success<null>(
        'Si el email está registrado, recibirás instrucciones para recuperar tu contraseña',
        null,
      );
    }
  }

  /**
   * Restablece la contraseña usando un token de recuperación
   */
  async resetPassword(token: string, nuevaPassword: string): Promise<ServiceResponse<null>> {
    try {
      // Verificar y decodificar el token
      let decoded: { usuario_id: number; tipo: string };
      try {
        decoded = jwt.verify(token, env.JWT_SECRET) as { usuario_id: number; tipo: string };
      } catch (jwtError) {
        const message =
          (jwtError as Error).name === 'TokenExpiredError'
            ? 'El enlace de recuperación ha expirado, solicita uno nuevo'
            : 'Token de recuperación inválido';
        return ServiceResponse.failure(message, null, StatusCodes.UNAUTHORIZED);
      }

      // Verificar que sea un token de tipo password_reset
      if (decoded.tipo !== 'password_reset') {
        return ServiceResponse.failure(
          'Token de recuperación inválido',
          null,
          StatusCodes.UNAUTHORIZED,
        );
      }

      // Verificar que el usuario existe y está activo
      const usuario = await this.authRepository.findByIdWithPasswordAsync(decoded.usuario_id);
      if (!usuario || !usuario.activo) {
        return ServiceResponse.failure('Usuario no encontrado', null, StatusCodes.NOT_FOUND);
      }

      // Actualizar la contraseña
      const nuevoHash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);
      await this.authRepository.updatePasswordAsync(decoded.usuario_id, nuevoHash);

      return ServiceResponse.success<null>('Contraseña restablecida exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al restablecer contraseña: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al restablecer la contraseña',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const authService = new AuthService();
