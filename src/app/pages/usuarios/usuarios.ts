import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { UserService } from '../../services/user.service';
import { UserResponseDto, UserRole } from '../../models/user.model';

import { AuthService } from '../../services/auth.service';

import { CambiarRolDialog } from './dialogs/cambiar-rol-dialog/cambiar-rol-dialog';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  displayedColumns: string[] = ['email', 'emailConfirmed', 'role', 'institucion', 'acciones'];

  usuarios: UserResponseDto[] = [];

  search = '';
  role: UserRole | '' = '';

  appliedSearch = '';
  appliedRole = '';

  page = 1;
  pageSize = 10;
  totalItems = 0;

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.errorMessage = '';

    this.userService
      .getPaged({
        page: this.page,
        pageSize: this.pageSize,
        search: this.appliedSearch,
        role: this.appliedRole,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.usuarios = response.items;
          this.totalItems = response.totalItems;
          this.page = response.page;
          this.pageSize = response.pageSize;
          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.errorMessage = error.error?.message ?? 'No se pudo cargar el listado de usuarios.';

          this.cdr.markForCheck();
        },
      });
  }

  buscar(): void {
    this.appliedSearch = this.search.trim();
    this.appliedRole = this.role;
    this.page = 1;
    this.cargarUsuarios();
  }

  limpiarFiltros(): void {
    this.search = '';
    this.role = '';
    this.buscar();
  }

  cambiarPagina(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargarUsuarios();
  }

  getNombreRol(role: string | null): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Administrador';

      case 'institucion':
        return 'Institución';

      case 'docente':
        return 'Docente';

      default:
        return 'Sin rol';
    }
  }

  esUsuarioActual(usuario: UserResponseDto): boolean {
    return usuario.id === this.authService.getCurrentUser()?.userId;
  }

  cambiarRol(usuario: UserResponseDto): void {
    if (this.esUsuarioActual(usuario)) {
      return;
    }

    const ref = this.dialog.open(CambiarRolDialog, {
      width: '480px',
      maxWidth: '95vw',
      autoFocus: false,
      data: { usuario },
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === true) {
          this.cargarUsuarios();
        }
      });
  }
}
