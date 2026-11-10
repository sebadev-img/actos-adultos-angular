import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { map, shareReplay, take } from 'rxjs';

import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);

  currentYear = new Date().getFullYear();

  loggingOut = false;

  isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map((result) => result.matches),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  // ESTADO DE AUTENTICACIÓN
  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  // EMAIL DEL USUARIO
  get userEmail(): string {
    return this.authService.getCurrentUser()?.email ?? '';
  }

  // VERIFICAR ROL
  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  // CERRAR SIDENAV EN CELULARES
  closeOnMobile(drawer: MatSidenav): void {
    this.isHandset$.pipe(take(1)).subscribe((isMobile) => {
      if (isMobile) {
        drawer.close();
      }
    });
  }

  // CERRAR SESIÓN
  logout(): void {
    if (this.loggingOut) {
      return;
    }

    this.loggingOut = true;

    this.authService.logout().subscribe({
      next: () => {
        this.loggingOut = false;
        this.router.navigate(['/home']);
      },
      error: () => {
        this.loggingOut = false;
        this.router.navigate(['/home']);
      },
    });
  }
}
