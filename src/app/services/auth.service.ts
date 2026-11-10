import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, catchError, finalize, map, shareReplay, tap } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  LoginDto,
  RegisterDto,
  ResendConfirmationEmailDto,
  RefreshTokenRequestDto,
  AuthResponseDto,
  AuthMessageResponse,
  MeResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/Auth`;

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private refreshRequest$?: Observable<AuthResponseDto>;

  // REGISTRO
  register(request: RegisterDto): Observable<AuthMessageResponse> {
    return this.http.post<AuthMessageResponse>(`${this.apiUrl}/register`, request);
  }

  // LOGIN
  login(request: LoginDto): Observable<AuthResponseDto> {
    return this.http
      .post<AuthResponseDto>(`${this.apiUrl}/login`, request)
      .pipe(tap((response) => this.saveSession(response)));
  }

  // CONFIRMAR EMAIL
  confirmEmail(userId: string, token: string): Observable<AuthMessageResponse> {
    return this.http.get<AuthMessageResponse>(`${this.apiUrl}/confirm-email`, {
      params: { userId, token },
    });
  }

  // REENVIAR CONFIRMACIÓN
  resendConfirmationEmail(request: ResendConfirmationEmailDto): Observable<AuthMessageResponse> {
    return this.http.post<AuthMessageResponse>(`${this.apiUrl}/resend-confirmation-email`, request);
  }

  // SOLICITAR RECUPERACIÓN DE CONTRASEÑA
  forgotPassword(request: ForgotPasswordDto): Observable<AuthMessageResponse> {
    return this.http.post<AuthMessageResponse>(`${this.apiUrl}/forgot-password`, request);
  }

  // RESTABLECER CONTRASEÑA
  resetPassword(request: ResetPasswordDto): Observable<AuthMessageResponse> {
    return this.http.post<AuthMessageResponse>(`${this.apiUrl}/reset-password`, request);
  }

  // USUARIO AUTENTICADO
  getMe(): Observable<MeResponseDto> {
    return this.http.get<MeResponseDto>(`${this.apiUrl}/me`);
  }

  // RENOVAR JWT + REFRESH TOKEN
  refreshToken(): Observable<AuthResponseDto> {
    // Evitar varias renovaciones simultáneas
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    const refreshToken = this.getRefreshToken();

    if (!refreshToken || !this.isRefreshTokenValid()) {
      this.clearSession();

      return throwError(() => new Error('Refresh Token no disponible o expirado.'));
    }

    const request: RefreshTokenRequestDto = {
      refreshToken,
    };

    this.refreshRequest$ = this.http
      .post<AuthResponseDto>(`${this.apiUrl}/refresh-token`, request)
      .pipe(
        tap((response) => {
          this.saveSession(response);
        }),
        catchError((error) => {
          this.clearSession();
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshRequest$ = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.refreshRequest$;
  }

  // OBTENER UN JWT VIGENTE
  getValidToken(): Observable<string | null> {
    const token = this.getToken();

    if (!token) {
      return of(null);
    }

    // Renovar anticipadamente si faltan menos de 30 segundos
    if (this.isTokenValid(30)) {
      return of(token);
    }

    if (!this.isRefreshTokenValid()) {
      this.clearSession();
      return of(null);
    }

    return this.refreshToken().pipe(map((response) => response.token));
  }

  // LOGOUT EN BACKEND
  logout(): Observable<AuthMessageResponse> {
    const refreshToken = this.getRefreshToken();
    this.clearSession();
    if (!refreshToken) {
      return of({
        message: 'Sesión cerrada correctamente.',
      });
    }

    return this.http
      .post<AuthMessageResponse>(`${this.apiUrl}/logout`, { refreshToken })
      .pipe(finalize(() => this.clearSession()));
  }

  // GUARDAR SESIÓN
  private saveSession(response: AuthResponseDto): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);

    localStorage.setItem(this.USER_KEY, JSON.stringify(response));
  }

  // ELIMINAR SESIÓN LOCAL
  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // OBTENER JWT
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // OBTENER REFRESH TOKEN
  getRefreshToken(): string | null {
    return this.getCurrentUser()?.refreshToken ?? null;
  }

  // OBTENER DATOS DEL USUARIO
  getCurrentUser(): AuthResponseDto | null {
    const user = localStorage.getItem(this.USER_KEY);

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as AuthResponseDto;
    } catch {
      return null;
    }
  }

  // VERIFICAR VIGENCIA DEL JWT
  isTokenValid(bufferSeconds = 0): boolean {
    const user = this.getCurrentUser();

    if (!user || !this.getToken()) {
      return false;
    }

    const expiresAt = new Date(user.expiresAt).getTime();

    return Number.isFinite(expiresAt) && expiresAt > Date.now() + bufferSeconds * 1000;
  }

  // VERIFICAR VIGENCIA DEL REFRESH TOKEN
  isRefreshTokenValid(): boolean {
    const user = this.getCurrentUser();

    if (!user?.refreshToken) {
      return false;
    }

    const expiresAt = new Date(user.refreshTokenExpiresAt).getTime();

    return Number.isFinite(expiresAt) && expiresAt > Date.now();
  }

  // VERIFICAR SI HAY SESIÓN RENOVABLE
  isAuthenticated(): boolean {
    return this.isTokenValid() || this.isRefreshTokenValid();
  }

  // VERIFICAR ROL
  hasRole(role: string): boolean {
    if (!this.isAuthenticated()) {
      return false;
    }

    const user = this.getCurrentUser();

    return user?.roles.some((r) => r.toLowerCase() === role.toLowerCase()) ?? false;
  }
}
