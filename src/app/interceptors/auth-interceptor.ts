import { inject } from '@angular/core';

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';

import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const apiUrl = environment.apiUrl.replace(/\/$/, '');

  // No interceptar peticiones a servicios externos
  if (!req.url.startsWith(`${apiUrl}/`)) {
    return next(req);
  }

  // Endpoints públicos y endpoints de gestión de tokens
  const excludedEndpoints = [
    `${apiUrl}/Auth/login`,
    `${apiUrl}/Auth/register`,
    `${apiUrl}/Auth/refresh-token`,
    `${apiUrl}/Auth/logout`,
    `${apiUrl}/Auth/confirm-email`,
    `${apiUrl}/Auth/resend-confirmation-email`,
  ];

  const urlPath = req.url.split('?')[0].toLowerCase();

  const isExcluded = excludedEndpoints.some((endpoint) => endpoint.toLowerCase() === urlPath);

  if (isExcluded) {
    return next(req);
  }

  // Obtener un JWT vigente o renovarlo
  return authService.getValidToken().pipe(
    switchMap((token) => {
      const authReq = token
        ? req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          })
        : req;

      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          // Solo intentar renovar ante un 401
          if (error.status !== 401 || !token) {
            return throwError(() => error);
          }

          // Si otra petición ya renovó el JWT,
          // reutilizar el token más reciente
          const currentToken = authService.getToken();

          if (currentToken && currentToken !== token && authService.isTokenValid()) {
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${currentToken}`,
              },
            });

            return next(retryReq);
          }

          // Renovar y reintentar una sola vez
          return authService.refreshToken().pipe(
            switchMap((response) => {
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.token}`,
                },
              });

              return next(retryReq);
            }),
          );
        }),
      );
    }),
  );
};
