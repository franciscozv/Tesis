export interface Usuario {
  id: number;
  email: string;
  rol: 'administrador' | 'usuario';
  es_directiva: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface RecuperarPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  nueva_password: string;
}

export interface CambiarPasswordRequest {
  password_actual: string;
  password_nueva: string;
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  responseObject: T;
  statusCode: number;
}
