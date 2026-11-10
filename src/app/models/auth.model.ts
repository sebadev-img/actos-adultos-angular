export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
}

export interface ResendConfirmationEmailDto {
  email: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface AuthResponseDto {
  token: string;
  expiresAt: string;
  userId: string;
  email: string;
  roles: string[];
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface AuthMessageResponse {
  message: string;
}

export interface AuthErrorResponse {
  message: string;
  code?: string;
  errors?: string[];
}

export interface MeResponseDto {
  id: string;
  email: string | null;
  roles: string[];
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  userId: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}
