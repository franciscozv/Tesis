import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '@/common/utils/envConfig';
import { logger } from '@/server';

/**
 * Servicio de envío de emails usando nodemailer
 */
class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Envía email de recuperación de contraseña con enlace al frontend
   */
  async enviarRecuperacionPassword(email: string, token: string): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/auth/reset-password?token=${token}`;

    const mailOptions = {
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Recuperación de contraseña - IEP Santa Juana',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Recuperación de contraseña</h2>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:</p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}"
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Restablecer contraseña
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">Este enlace expirará en 1 hora.</p>
          <p style="color: #666; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">IEP Santa Juana - Sistema de Gestión</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Email de recuperación enviado a: ${email}`);
    } catch (error) {
      logger.error(`Error al enviar email de recuperación: ${(error as Error).message}`);
      throw error;
    }
  }
}

export const emailService = new EmailService();
