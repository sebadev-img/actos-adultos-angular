import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { catchError, map, of } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Roles permitidos definidos en la ruta
  const allowedRoles = route.data['roles'] as string[] | undefined;

  // Validar sesión y renovar JWT si es necesario
  return authService.getValidToken().pipe(
    map((token) => {
      // Usuario no autenticado
      if (!token) {
        return router.createUrlTree(['/login'], {
          queryParams: {
            returnUrl: state.url,
          },
        });
      }

      // Ruta sin restricción de roles
      if (!allowedRoles || allowedRoles.length === 0) {
        return true;
      }

      // Verificar si tiene al menos uno de los roles
      const hasPermission = allowedRoles.some((role) => authService.hasRole(role));

      if (!hasPermission) {
        return router.createUrlTree(['/home']);
      }

      return true;
    }),

    catchError(() => {
      return of(
        router.createUrlTree(['/login'], {
          queryParams: {
            returnUrl: state.url,
          },
        }),
      );
    }),
  );
};
